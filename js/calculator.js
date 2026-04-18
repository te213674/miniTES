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

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Calculator.js: DOM loaded');

    // Обновление значений ползунков
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', function() {
            const valueSpan = document.getElementById(`${this.id}-value`);
            if (valueSpan) valueSpan.textContent = this.value;
        });
    });

    // Обработка отправки формы калькулятора
    const calcForm = document.getElementById('calculator-form');
    console.log('Calculator.js: form element:', calcForm);
    if (calcForm) {
        // Предотвращаем автоматическую отправку формы при загрузке
        calcForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('Calculator.js: form submitted');

            const equipmentModelId = parseInt(document.getElementById('equipment-model').value);
            console.log('Calculator.js: equipmentModelId:', equipmentModelId);
            if (!equipmentModelId) {
                alert('Пожалуйста, выберите модель ГПУ');
                return;
            }

            console.log('Calculator.js: equipmentData:', equipmentData);
            const profileType = document.getElementById('load-profile').value;
            const loadProfile = loadProfiles[profileType];

            // Получаем выбранное оборудование
            const equipment = equipmentData.find(eq => eq.id === equipmentModelId);
            console.log('Calculator.js: equipment:', equipment);
            if (!equipment) {
                alert('Оборудование не найдено');
                return;
            }

            // Параметры из формы
            const gasTariff = parseFloat(document.getElementById('gas-tariff').value);
            const gridTariff = parseFloat(document.getElementById('grid-tariff').value);
            const maxPower = parseInt(document.getElementById('max-power').value);
            const miningFarmsCount = parseInt(document.getElementById('mining-farms').value);

            // Выполняем расчёт
            const result = calculateTariff({
                equipment,
                gasTariff,
                gridTariff,
                maxPower,
                miningFarmsCount,
                loadProfile
            });

            displayResults(result);
        });
    }

    // Экспорт в PDF
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            if (!window.currentCalculationData) {
                alert('Сначала выполните расчёт');
                return;
            }
            generatePDF(window.currentCalculationData);
        });
    }

    // Модальное окно
    const closeModalBtn = document.getElementById('close-modal');
    const leadModal = document.getElementById('lead-modal');
    const leadForm = document.getElementById('lead-form');

    if (closeModalBtn && leadModal) {
        closeModalBtn.addEventListener('click', function() {
            leadModal.classList.add('hidden');
        });

        leadModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }

    // Отправка формы лида (добавляем данные расчёта)
    if (leadForm && !leadForm.dataset.calculatorInitialized) {
        leadForm.addEventListener('submit', function(e) {
            if (window.currentCalculationData) {
                const calcDataInput = document.getElementById('calculation-data');
                if (calcDataInput) {
                    calcDataInput.value = JSON.stringify(window.currentCalculationData);
                }
            }
        });
        leadForm.dataset.calculatorInitialized = 'true';
    }
});

// Основная функция расчёта
function calculateTariff(params) {
    const {
        equipment,
        gasTariff,
        gridTariff,
        maxPower,
        miningFarmsCount,
        loadProfile
    } = params;

    // Масштабируем профиль нагрузки под выбранную максимальную мощность
    const base_profile = loadProfile || Array.from({length: 24}, (_, i) => [i, 100]);
    const base_max_load = Math.max(...base_profile.map(([_, load]) => load));
    const scale_factor = maxPower / base_max_load;
    const profile = base_profile.map(([hour, load]) => [hour, load * scale_factor]);

    const avg_load = profile.reduce((sum, [_, load]) => sum + load, 0) / 24;
    const max_load = Math.max(...profile.map(([_, load]) => load));

    const equipment_count = Math.ceil(max_load / equipment.power_kw);
    const total_power_kw = equipment_count * equipment.power_kw;
    const mining_power_kw = miningFarmsCount * miningConfig.power_kw;

    const hours_per_month = 720;
    const monthly_energy_client_kwh = avg_load * hours_per_month;
    const monthly_energy_mining_kwh = mining_power_kw * hours_per_month;
    const monthly_energy_total_kwh = monthly_energy_client_kwh + monthly_energy_mining_kwh;

    // Защита от деления на ноль
    if (monthly_energy_total_kwh === 0) {
        return null;
    }

    const gas_cost_per_kwh = equipment.gas_consumption_per_kwh * gasTariff;
    const service_per_kwh = equipment.service_cost_per_kwh;
    
    // Фиксированные выплаты инвестору и подрядчику
    const investor_payment_monthly = equipment.investor_rate_month * equipment_count;
    const contractor_payment_monthly = equipment.contractor_rate_month * equipment_count;
    
    const investor_per_kwh = investor_payment_monthly / monthly_energy_total_kwh;
    const contractor_per_kwh = contractor_payment_monthly / monthly_energy_total_kwh;

    // Майнинг
    const contractTermMonths = 36; // Фиксированный срок выкупа 3 года
    const mining_profit_monthly = miningConfig.revenue_per_kwh * monthly_energy_mining_kwh - 
                                  (miningConfig.capex_per_kw * mining_power_kw) / contractTermMonths;
    const mining_discount_per_kwh = mining_profit_monthly / monthly_energy_total_kwh;

    // Тариф до выкупа (первые 3 года)
    const tariff_per_kwh = gas_cost_per_kwh + service_per_kwh + investor_per_kwh + contractor_per_kwh - mining_discount_per_kwh;
    
    // Тариф после выкупа (после 3 лет)
    // Инвестор уходит, подрядчик уменьшается вдвое
    const contractor_after_buyout_per_kwh = contractor_per_kwh / 2;
    const tariff_after_buyout_per_kwh = gas_cost_per_kwh + service_per_kwh + contractor_after_buyout_per_kwh - mining_discount_per_kwh;

    const savings_percent = ((gridTariff - tariff_per_kwh) / gridTariff) * 100;
    const savings_after_buyout_percent = ((gridTariff - tariff_after_buyout_per_kwh) / gridTariff) * 100;

    const mining_capex_total = miningConfig.capex_per_kw * mining_power_kw;
    const mining_payback_months = mining_capex_total > 0 ? mining_capex_total / mining_profit_monthly : null;

    const load_profile_original = profile;
    const load_profile_with_mining = profile.map(([hour, load]) => [hour, load + mining_power_kw]);

    return {
        tariff_per_kwh: Math.round(tariff_per_kwh * 100) / 100,
        tariff_after_buyout_per_kwh: Math.round(tariff_after_buyout_per_kwh * 100) / 100,
        savings_vs_grid_percent: Math.round(savings_percent * 10) / 10,
        savings_after_buyout_percent: Math.round(savings_after_buyout_percent * 10) / 10,
        mining_profit_monthly: Math.round(mining_profit_monthly),
        mining_payback_months: mining_payback_months ? Math.round(mining_payback_months) : null,
        tariff_breakdown: {
            gas_cost_per_kwh: Math.round(gas_cost_per_kwh * 100) / 100,
            service_per_kwh: Math.round(service_per_kwh * 100) / 100,
            investor_per_kwh: Math.round(investor_per_kwh * 100) / 100,
            contractor_per_kwh: Math.round(contractor_per_kwh * 100) / 100,
            mining_discount_per_kwh: Math.round(mining_discount_per_kwh * 100) / 100
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
            max_power: maxPower,
            mining_farms_count: miningFarmsCount
        }
    };
}

// Отображение результатов
function displayResults(data) {
    if (!data) return;
    console.log('Calculator.js: displayResults called with:', data);
    const placeholder = document.getElementById('placeholder');
    const results = document.getElementById('results');
    
    if (placeholder) placeholder.style.display = 'none';
    if (results) results.style.display = 'block';

    // Основные показатели
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('tariff-value', data.tariff_per_kwh.toFixed(2));
    setTxt('savings-value', data.savings_vs_grid_percent.toFixed(1));
    setTxt('mining-profit', data.mining_profit_monthly.toLocaleString());
    setTxt('payback-value', data.mining_payback_months || '—');

    // Детализация тарифа
    const breakdown = data.tariff_breakdown;
    const rent_per_kwh = breakdown.investor_per_kwh + breakdown.contractor_per_kwh;
    const breakdownHtml = `
        <div class="calculator-breakdown-item">
            <span>Газ</span>
            <span>${breakdown.gas_cost_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="calculator-breakdown-item">
            <span>Обслуживание</span>
            <span>${breakdown.service_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="calculator-breakdown-item">
            <span>Аренда оборудования</span>
            <span>${rent_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="calculator-breakdown-item green-text">
            <span>Майнинг (вычет)</span>
            <span>-${breakdown.mining_discount_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="calculator-breakdown-item total">
            <span>Итого (первые 3 года)</span>
            <span>${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
        <div class="calculator-breakdown-item total" style="margin-top: 10px; border-top: 1px dashed var(--color-border); padding-top: 10px;">
            <span>Тариф после выкупа (через 3 года)</span>
            <span style="color: var(--color-success);">${data.tariff_after_buyout_per_kwh.toFixed(2)} руб/кВт·ч</span>
        </div>
    `;
    const breakdownEl = document.getElementById('tariff-breakdown');
    if (breakdownEl) breakdownEl.innerHTML = breakdownHtml;

    setTxt('equipment-model-name', data.equipment_model);
    setTxt('equipment-power', data.equipment_power_kw);
    setTxt('equipment-count', data.equipment_count);
    setTxt('total-power', data.total_power_kw);
    setTxt('mining-power', data.mining_power_kw);
    setTxt('energy-client', data.monthly_energy_client_kwh.toLocaleString());
    setTxt('energy-mining', data.monthly_energy_mining_kwh.toLocaleString());
    setTxt('energy-total', data.monthly_energy_total_kwh.toLocaleString());

    updateLoadChart(data.load_profile_original, data.load_profile_with_mining);
    updateTariffChart(breakdown);

    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) exportBtn.classList.remove('hidden');

    window.currentCalculationData = data;
}

// График нагрузки
function updateLoadChart(original, withMining) {
    const canvas = document.getElementById('load-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
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
    const canvas = document.getElementById('tariff-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (tariffChart) tariffChart.destroy();

    const rent_per_kwh = breakdown.investor_per_kwh + breakdown.contractor_per_kwh;

    tariffChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Газ', 'Обслуживание', 'Аренда оборудования', 'Майнинг (вычет)'],
            datasets: [{
                data: [
                    breakdown.gas_cost_per_kwh,
                    breakdown.service_per_kwh,
                    rent_per_kwh,
                    -breakdown.mining_discount_per_kwh
                ],
                backgroundColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#8b5cf6',
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

// Генерация PDF
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('Библиотека jsPDF не загружена');
        return;
    }
    
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 10;

    doc.setFontSize(18);
    doc.text('Расчёт энергосервисного контракта', 20, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.text(`Дата расчёта: ${new Date().toLocaleDateString('ru-RU')}`, 20, y);
    y += lineHeight;

    y += 5;
    doc.setFontSize(14);
    doc.text('Параметры расчёта:', 20, y);
    y += lineHeight;
    
    doc.setFontSize(11);
    doc.text(`Модель ГПУ: ${data.equipment_model}`, 25, y); y += lineHeight;
    doc.text(`Тариф на газ: ${data.input_params.gas_tariff} руб/м³`, 25, y); y += lineHeight;
    doc.text(`Сетевой тариф: ${data.input_params.grid_tariff} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Максимальная мощность: ${data.input_params.max_power} кВт`, 25, y); y += lineHeight;
    doc.text(`Майнинг-фермы: ${data.input_params.mining_farms_count} шт.`, 25, y); y += lineHeight * 1.5;

    doc.setFontSize(14);
    doc.text('Результаты расчёта:', 20, y); y += lineHeight;

    doc.setFontSize(11);
    doc.text(`Тариф для клиента (первые 3 года): ${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Тариф после выкупа (через 3 года): ${data.tariff_after_buyout_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Экономия vs сеть: ${data.savings_vs_grid_percent.toFixed(1)}%`, 25, y); y += lineHeight;
    doc.text(`Выручка от майнинга: ${data.mining_profit_monthly.toLocaleString()} руб/мес`, 25, y); y += lineHeight;
    doc.text(`Окупаемость ферм: ${data.mining_payback_months || '—'} мес.`, 25, y); y += lineHeight * 1.5;

    doc.setFontSize(14);
    doc.text('Оборудование:', 20, y); y += lineHeight;

    doc.setFontSize(11);
    doc.text(`ГПУ: ${data.equipment_model} ${data.equipment_power_kw} кВт × ${data.equipment_count} шт.`, 25, y); y += lineHeight;
    doc.text(`Общая мощность: ${data.total_power_kw} кВт`, 25, y); y += lineHeight;
    doc.text(`Майнинг-фермы: ${data.mining_power_kw} кВт`, 25, y); y += lineHeight * 1.5;

    doc.setFontSize(14);
    doc.text('Структура тарифа:', 20, y); y += lineHeight;

    const breakdown = data.tariff_breakdown;
    const rent_per_kwh = breakdown.investor_per_kwh + breakdown.contractor_per_kwh;
    doc.setFontSize(11);
    doc.text(`Газ: ${breakdown.gas_cost_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Обслуживание: ${breakdown.service_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Аренда оборудования: ${rent_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.text(`Майнинг (вычет): -${breakdown.mining_discount_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y); y += lineHeight;
    doc.setFontSize(12);
    doc.text(`Итого: ${data.tariff_per_kwh.toFixed(2)} руб/кВт·ч`, 25, y);

    doc.save(`calculation_${Date.now()}.pdf`);
}
