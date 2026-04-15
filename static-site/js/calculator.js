// Профили нагрузки
const loadProfiles = {
    '1shift': Array.from({length: 24}, (_, i) => {
        const hour = i;
        if (hour >= 8 && hour < 17) return [hour, 150];
        return [hour, 20];
    }),
    '2shifts': Array.from({length: 24}, (_, i) => {
        const hour = i;
        if (hour >= 8 && hour < 20) return [hour, 150];
        return [hour, 20];
    }),
    '3shifts': Array.from({length: 24}, (_, i) => [i, 120]),
    'custom': Array.from({length: 24}, (_, i) => [i, 100])
};

let loadChart = null;
let tariffChart = null;

// Обновление значений ползунков
document.querySelectorAll('input[type="range"]').forEach(slider => {
    slider.addEventListener('input', function() {
        const valueSpan = document.getElementById(`${this.id}-value`);
        if (valueSpan) valueSpan.textContent = this.value;
    });
});

// Обработка отправки формы
document.getElementById('calculator-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const equipmentModelId = parseInt(document.getElementById('equipment-model').value);
    if (!equipmentModelId) {
        alert('Пожалуйста, выберите модель ГПУ');
        return;
    }

    const profileType = document.getElementById('load-profile').value;
    const loadProfile = loadProfiles[profileType];

    // Получаем выбранное оборудование
    const equipment = equipmentData.find(eq => eq.id === equipmentModelId);
    if (!equipment) {
        alert('Оборудование не найдено');
        return;
    }

    // Параметры из формы
    const gasTariff = parseFloat(document.getElementById('gas-tariff').value);
    const gridTariff = parseFloat(document.getElementById('grid-tariff').value);
    const companyMargin = parseInt(document.getElementById('company-margin').value);
    const contractTermMonths = parseInt(document.getElementById('contract-term').value);
    const miningFarmsCount = parseInt(document.getElementById('mining-farms').value);

    // Выполняем расчёт
    const result = calculateTariff({
        equipment,
        gasTariff,
        gridTariff,
        companyMargin,
        contractTermMonths,
        miningFarmsCount,
        loadProfile
    });

    displayResults(result);
});

// Основная функция расчёта
function calculateTariff(params) {
    const {
        equipment,
        gasTariff,
        gridTariff,
        companyMargin,
        contractTermMonths,
        miningFarmsCount,
        loadProfile
    } = params;

    // Профиль нагрузки
    const profile = loadProfile || Array.from({length: 24}, (_, i) => [i, 100]);
    const avg_load = profile.reduce((sum, [_, load]) => sum + load, 0) / 24;
    const max_load = Math.max(...profile.map(([_, load]) => load));

    // Определяем количество ГПУ
    const equipment_count = Math.ceil(max_load / equipment.power_kw);
    const total_power_kw = equipment_count * equipment.power_kw;
    const mining_power_kw = miningFarmsCount * miningConfig.power_kw;

    // Расчёт энергопотребления
    const hours_per_month = 720;
    const monthly_energy_client_kwh = avg_load * hours_per_month;
    const monthly_energy_mining_kwh = mining_power_kw * hours_per_month;
    const monthly_energy_total_kwh = monthly_energy_client_kwh + monthly_energy_mining_kwh;

    // Расчёт себестоимости
    const gas_cost_per_kwh = equipment.gas_consumption_per_kwh * gasTariff;
    const service_per_kwh = equipment.service_cost_per_kwh;
    const rent_per_kwh = (equipment.rent_rate_month * equipment_count) / monthly_energy_total_kwh;
    const capex_recovery_per_kwh = (equipment.purchase_price * equipment_count) / (contractTermMonths * monthly_energy_total_kwh);

    // Расчёт выручки от майнинга
    const mining_profit_monthly = miningConfig.revenue_per_kwh * monthly_energy_mining_kwh - 
                                  (miningConfig.capex_per_kw * mining_power_kw) / contractTermMonths;
    const mining_discount_per_kwh = mining_profit_monthly / monthly_energy_total_kwh;

    // Итоговый тариф
    const base_tariff = gas_cost_per_kwh + service_per_kwh + rent_per_kwh + capex_recovery_per_kwh - mining_discount_per_kwh;
    const tariff_per_kwh = base_tariff * (1 + companyMargin / 100);

    // Экономия
    const savings_percent = ((gridTariff - tariff_per_kwh) / gridTariff) * 100;

    // Окупаемость майнинг-ферм
    const mining_capex_total = miningConfig.capex_per_kw * mining_power_kw;
    const mining_payback_months = mining_capex_total > 0 ? mining_capex_total / mining_profit_monthly : null;

    // Профиль нагрузки с майнинг-фермами
    const load_profile_original = profile;
    const load_profile_with_mining = profile.map(([hour, load]) => [hour, load + mining_power_kw]);

    return {
        tariff_per_kwh: Math.round(tariff_per_kwh * 100) / 100,
        savings_vs_grid_percent: Math.round(savings_percent * 10) / 10,
        mining_profit_monthly: Math.round(mining_profit_monthly),
        mining_payback_months: mining_payback_months ? Math.round(mining_payback_months) : null,
        tariff_breakdown: {
            gas_cost_per_kwh: Math.round(gas_cost_per_kwh * 100) / 100,
            service_per_kwh: Math.round(service_per_kwh * 100) / 100,
            rent_per_kwh: Math.round(rent_per_kwh * 100) / 100,
            capex_recovery_per_kwh: Math.round(capex_recovery_per_kwh * 100) / 100,
            mining_discount_per_kwh: Math.round(mining_discount_per_kwh * 100) / 100,
            margin_per_kwh: Math.round((tariff_per_kwh - base_tariff) * 100) / 100
        },
        equipment_count,
        total_power_kw,
        mining_power_kw,
        monthly_energy_client_kwh: Math.round(monthly_energy_client_kwh),
        monthly_energy_mining_kwh: Math.round(monthly_energy_mining_kwh),
        monthly_energy_total_kwh: Math.round(monthly_energy_total_kwh),
        load_profile_original,
        load_profile_with_mining,
        equipment_model: equipment.name,
        equipment_power_kw: equipment.power_kw,
        input_params: {
            gas_tariff: gasTariff,
            grid_tariff: gridTariff,
            company_margin: companyMargin,
            contract_term_months: contractTermMonths,
            mining_farms_count: miningFarmsCount
        }
    };
}

// Отображение результатов
function displayResults(data) {
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');

    // Основные показатели
    document.getElementById('tariff-value').textContent = data.tariff_per_kwh.toFixed(2);
    document.getElementById('savings-value').textContent = data.savings_vs_grid_percent.toFixed(1);
    document.getElementById('mining-profit').textContent = data.mining_profit_monthly.toLocaleString();
    document.getElementById('payback-value').textContent = data.mining_payback_months || '—';

    // Детализация тарифа
    const breakdown = data.tariff_breakdown;
    const breakdownHtml = `
        <div class="flex justify-between py-2 border-b">
            <span>Газ</span>
            <span>${breakdown.gas_cost_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 border-b">
            <span>Обслуживание</span>
            <span>${breakdown.service_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 border-b">
            <span>Аренда</span>
            <span>${breakdown.rent_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 border-b">
            <span>Выкуп</span>
            <span>${breakdown.capex_recovery_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 border-b text-green-600">
            <span>Майнинг (вычет)</span>
            <span>-${breakdown.mining_discount_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 border-b">
            <span>Маржа</span>
            <span>${breakdown.margin_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="flex justify-between py-2 font-bold text-lg">
            <span>Итого</span>
            <span>${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
    `;
    document.getElementById('tariff-breakdown').innerHTML = breakdownHtml;

    // Оборудование
    document.getElementById('equipment-count').textContent = data.equipment_count;
    document.getElementById('total-power').textContent = data.total_power_kw;
    document.getElementById('mining-power').textContent = data.mining_power_kw;

    // Энергопотребление
    document.getElementById('energy-client').textContent = data.monthly_energy_client_kwh.toLocaleString();
    document.getElementById('energy-mining').textContent = data.monthly_energy_mining_kwh.toLocaleString();
    document.getElementById('energy-total').textContent = data.monthly_energy_total_kwh.toLocaleString();

    // Графики
    updateLoadChart(data.load_profile_original, data.load_profile_with_mining);
    updateTariffChart(breakdown);

    // Показываем кнопку экспорта PDF
    document.getElementById('export-pdf-btn').classList.remove('hidden');

    // Сохраняем текущие данные для экспорта
    window.currentCalculationData = data;
}

// График нагрузки
function updateLoadChart(original, withMining) {
    const ctx = document.getElementById('load-chart').getContext('2d');
    
    if (loadChart) loadChart.destroy();

    loadChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: original.map(([hour]) => `${hour}:00`),
            datasets: [
                {
                    label: 'Нагрузка клиента',
                    data: original.map(([_, load]) => load),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true
                },
                {
                    label: 'Нагрузка с фермами',
                    data: withMining.map(([_, load]) => load),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'кВт' } },
                x: { title: { display: true, text: 'Часы' } }
            }
        }
    });
}

// Круговая диаграмма тарифа
function updateTariffChart(breakdown) {
    const ctx = document.getElementById('tariff-chart').getContext('2d');
    
    if (tariffChart) tariffChart.destroy();

    tariffChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Газ', 'Обслуживание', 'Аренда', 'Выкуп', 'Маржа', 'Майнинг (вычет)'],
            datasets: [{
                data: [
                    breakdown.gas_cost_per_kwh,
                    breakdown.service_per_kwh,
                    breakdown.rent_per_kwh,
                    breakdown.capex_recovery_per_kwh,
                    breakdown.margin_per_kwh,
                    -breakdown.mining_discount_per_kwh
                ],
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#8b5cf6',
                    '#06b6d4',
                    '#10b981',
                    '#6b7280'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Экспорт в PDF (клиентская генерация)
document.getElementById('export-pdf-btn').addEventListener('click', function() {
    if (!window.currentCalculationData) {
        alert('Сначала выполните расчёт');
        return;
    }

    generatePDF(window.currentCalculationData);
});

// Генерация PDF с помощью jsPDF
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 20;
    const lineHeight = 10;

    // Заголовок
    doc.setFontSize(18);
    doc.text('Расчёт энергосервисного контракта', 20, y);
    y += lineHeight;

    // Дата
    doc.setFontSize(10);
    doc.text(`Дата расчёта: ${new Date().toLocaleDateString('ru-RU')}`, 20, y);
    y += lineHeight;

    // Параметры
    y += 5;
    doc.setFontSize(14);
    doc.text('Параметры расчёта:', 20, y);
    y += lineHeight;
    
    doc.setFontSize(11);
    doc.text(`Модель ГПУ: ${data.equipment_model}`, 25, y);
    y += lineHeight;
    doc.text(`Тариф на газ: ${data.input_params.gas_tariff} руб/м³`, 25, y);
    y += lineHeight;
    doc.text(`Сетевой тариф: ${data.input_params.grid_tariff} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Маржа компании: ${data.input_params.company_margin}%`, 25, y);
    y += lineHeight;
    doc.text(`Срок контракта: ${data.input_params.contract_term_months} мес.`, 25, y);
    y += lineHeight;
    doc.text(`Майнинг-фермы: ${data.input_params.mining_farms_count} шт.`, 25, y);
    y += lineHeight * 1.5;

    // Результаты
    doc.setFontSize(14);
    doc.text('Результаты расчёта:', 20, y);
    y += lineHeight;

    doc.setFontSize(11);
    doc.text(`Тариф для клиента: ${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Экономия vs сеть: ${data.savings_vs_grid_percent.toFixed(1)}%`, 25, y);
    y += lineHeight;
    doc.text(`Выручка от майнинга: ${data.mining_profit_monthly.toLocaleString()} руб/мес`, 25, y);
    y += lineHeight;
    doc.text(`Окупаемость ферм: ${data.mining_payback_months || '—'} мес.`, 25, y);
    y += lineHeight * 1.5;

    // Оборудование
    doc.setFontSize(14);
    doc.text('Оборудование:', 20, y);
    y += lineHeight;

    doc.setFontSize(11);
    doc.text(`Требуется ГПУ: ${data.equipment_count} шт.`, 25, y);
    y += lineHeight;
    doc.text(`Общая мощность: ${data.total_power_kw} кВт`, 25, y);
    y += lineHeight;
    doc.text(`Майнинг-фермы: ${data.mining_power_kw} кВт`, 25, y);
    y += lineHeight * 1.5;

    // Структура тарифа
    doc.setFontSize(14);
    doc.text('Структура тарифа:', 20, y);
    y += lineHeight;

    const breakdown = data.tariff_breakdown;
    doc.setFontSize(11);
    doc.text(`Газ: ${breakdown.gas_cost_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Обслуживание: ${breakdown.service_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Аренда: ${breakdown.rent_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Выкуп: ${breakdown.capex_recovery_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Майнинг (вычет): -${breakdown.mining_discount_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.text(`Маржа: ${breakdown.margin_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`Итого: ${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);

    // Сохранение файла
    doc.save(`calculation_${Date.now()}.pdf`);
}

// Модальное окно
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('lead-modal').classList.add('hidden');
});

document.getElementById('lead-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

// Отправка формы лида
document.getElementById('lead-form').addEventListener('submit', function(e) {
    // Сохраняем данные расчёта в скрытое поле
    if (window.currentCalculationData) {
        document.getElementById('calculation-data').value = JSON.stringify(window.currentCalculationData);
    }
    // Форма отправится через Formspree
});