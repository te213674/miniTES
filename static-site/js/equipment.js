// Загрузка моделей оборудования из JSON файла
let equipmentData = [];
let miningConfig = {};

async function loadEquipment() {
    try {
        const response = await fetch('data/equipment.json');
        const data = await response.json();
        
        equipmentData = data.equipment;
        miningConfig = data.mining_config;
        
        const select = document.getElementById('equipment-model');
        select.innerHTML = '<option value="">Выберите модель</option>';
        
        equipmentData.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.power_kw} кВт) - ${model.manufacturer}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки оборудования:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', loadEquipment);