// Загрузка моделей оборудования из JSON файла
let equipmentData = [];
let miningConfig = {};

// Резервные данные на случай, если fetch не сработает (локальный файл)
const fallbackEquipment = {
    equipment: [
        {
            id: 1,
            name: "Doosan 200",
            manufacturer: "Doosan",
            power_kw: 200,
            gas_consumption_per_kwh: 0.3,
            purchase_price: 6000000,
            rent_rate_month: 150000,
            service_cost_per_kwh: 1.4,
            investor_rate_month: 250000,
            contractor_rate_month: 150000
        },
        {
            id: 2,
            name: "Doosan 250",
            manufacturer: "Doosan",
            power_kw: 250,
            gas_consumption_per_kwh: 0.3,
            purchase_price: 7500000,
            rent_rate_month: 187500,
            service_cost_per_kwh: 1.4,
            investor_rate_month: 300000,
            contractor_rate_month: 180000
        },
        {
            id: 3,
            name: "ТМЗ 200",
            manufacturer: "ТМЗ",
            power_kw: 200,
            gas_consumption_per_kwh: 0.3,
            purchase_price: 5500000,
            rent_rate_month: 137500,
            service_cost_per_kwh: 1.4,
            investor_rate_month: 250000,
            contractor_rate_month: 150000
        }
    ],
    mining_config: {
        power_kw: 100,
        revenue_per_kwh: 3.5,
        capex_per_kw: 50000
    }
};

function populateSelect(data) {
    equipmentData = data.equipment;
    miningConfig = data.mining_config;
    
    const select = document.getElementById('equipment-model');
    if (!select) {
        console.error('Элемент select#equipment-model не найден');
        return;
    }
    
    select.innerHTML = '<option value="">Выберите модель</option>';
    
    equipmentData.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name} (${model.power_kw} кВт) - ${model.manufacturer}`;
        select.appendChild(option);
    });
    
    console.log('Оборудование загружено:', equipmentData.length, 'моделей');
}

async function loadEquipment() {
    try {
        const response = await fetch('data/equipment.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        populateSelect(data);
    } catch (error) {
        console.warn('Не удалось загрузить equipment.json (возможно, локальный файл), используем резервные данные:', error);
        populateSelect(fallbackEquipment);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', loadEquipment);
