const express = require('express');
const router = express.Router();
const { getDb, saveDatabase } = require('../database/init');

// Получить модели оборудования для калькулятора
router.get('/equipment', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const result = db.exec('SELECT id, name, power_kw FROM equipment_models WHERE is_active = 1 ORDER BY power_kw');
    
    const data = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        power_kw: row[2]
    })) : [];
    
    res.json({ success: true, data });
});

// Рассчитать тариф
router.post('/calculate', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const {
        equipment_model_id,
        gas_tariff,
        grid_tariff,
        company_margin,
        contract_term_months,
        mining_farms_count,
        load_profile
    } = req.body;
    
    try {
        // Получаем модель оборудования
        const equipResult = db.exec('SELECT * FROM equipment_models WHERE id = ?', [equipment_model_id]);
        if (equipResult.length === 0) {
            return res.status(400).json({ success: false, error: 'Модель оборудования не найдена' });
        }
        
        const equipment = {
            id: equipResult[0].values[0][0],
            name: equipResult[0].values[0][1],
            manufacturer: equipResult[0].values[0][2],
            power_kw: equipResult[0].values[0][3],
            gas_consumption_per_kwh: equipResult[0].values[0][4],
            purchase_price: equipResult[0].values[0][7],
            rent_rate_month: equipResult[0].values[0][8],
            service_cost_per_kwh: equipResult[0].values[0][9]
        };
        
        // Получаем конфигурацию майнинг-фермы
        const miningResult = db.exec('SELECT * FROM mining_farm_configs WHERE is_active = 1 LIMIT 1');
        const mining = miningResult.length > 0 ? {
            power_kw: miningResult[0].values[0][2],
            revenue_per_kwh: miningResult[0].values[0][3],
            capex_per_kw: miningResult[0].values[0][4]
        } : { power_kw: 100, revenue_per_kwh: 3.5, capex_per_kw: 50000 };
        
        // Расчёт профиля нагрузки
        const profile = load_profile || Array.from({length: 24}, (_, i) => [i, 100]);
        const avg_load = profile.reduce((sum, [_, load]) => sum + load, 0) / 24;
        const max_load = Math.max(...profile.map(([_, load]) => load));
        
        // Определяем количество ГПУ
        const equipment_count = Math.ceil(max_load / equipment.power_kw);
        const total_power_kw = equipment_count * equipment.power_kw;
        const mining_power_kw = mining_farms_count * mining.power_kw;
        
        // Расчёт энергопотребления
        const hours_per_month = 720;
        const monthly_energy_client_kwh = avg_load * hours_per_month;
        const monthly_energy_mining_kwh = mining_power_kw * hours_per_month;
        const monthly_energy_total_kwh = monthly_energy_client_kwh + monthly_energy_mining_kwh;
        
        // Расчёт себестоимости
        const gas_cost_per_kwh = equipment.gas_consumption_per_kwh * gas_tariff;
        const service_per_kwh = equipment.service_cost_per_kwh;
        const rent_per_kwh = (equipment.rent_rate_month * equipment_count) / monthly_energy_total_kwh;
        const capex_recovery_per_kwh = (equipment.purchase_price * equipment_count) / (contract_term_months * monthly_energy_total_kwh);
        
        // Расчёт выручки от майнинга
        const mining_profit_monthly = mining.revenue_per_kwh * monthly_energy_mining_kwh - 
                                      (mining.capex_per_kw * mining_power_kw) / contract_term_months;
        const mining_discount_per_kwh = mining_profit_monthly / monthly_energy_total_kwh;
        
        // Итоговый тариф
        const base_tariff = gas_cost_per_kwh + service_per_kwh + rent_per_kwh + capex_recovery_per_kwh - mining_discount_per_kwh;
        const tariff_per_kwh = base_tariff * (1 + company_margin / 100);
        
        // Экономия
        const savings_percent = ((grid_tariff - tariff_per_kwh) / grid_tariff) * 100;
        
        // Окупаемость майнинг-ферм
        const mining_capex_total = mining.capex_per_kw * mining_power_kw;
        const mining_payback_months = mining_capex_total > 0 ? mining_capex_total / mining_profit_monthly : null;
        
        // Профиль нагрузки с майнинг-фермами
        const load_profile_original = profile;
        const load_profile_with_mining = profile.map(([hour, load]) => [hour, load + mining_power_kw]);
        
        // Сохраняем расчёт
        db.run(
            `INSERT INTO calculations (equipment_model_id, gas_tariff, grid_tariff, company_margin, 
             contract_term_months, mining_farms_count, tariff_per_kwh, mining_profit_monthly, payback_months)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [equipment_model_id, gas_tariff, grid_tariff, company_margin, 
             contract_term_months, mining_farms_count, tariff_per_kwh, mining_profit_monthly, mining_payback_months]
        );
        saveDatabase();
        
        // Формируем ответ
        const response = {
            success: true,
            data: {
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
                load_profile_with_mining
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Ошибка расчёta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Сохранение лида (заявки)
router.post('/lead', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { name, phone, email } = req.body;
    
    if (!name || !phone || !email) {
        return res.status(400).json({ success: false, error: 'Все поля обязательны для заполнения' });
    }
    
    try {
        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Некорректный email' });
        }
        
        // Валидация телефона (простая)
        const phoneRegex = /^[\d\+\-\(\)\s]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, error: 'Некорректный телефон' });
        }
        
        // Сохранение в БД
        const stmt = db.prepare(`
            INSERT INTO leads (name, phone, email, created_at, source)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'calculator')
        `);
        stmt.run([name, phone, email]);
        stmt.free();
        saveDatabase();
        
        // TODO: Отправка уведомления (email/Telegram)
        // await sendNotification({ name, phone, email });
        
        res.json({ success: true, message: 'Заявка успешно отправлена' });
    } catch (error) {
        console.error('Ошибка сохранения лида:', error);
        res.status(500).json({ success: false, error: 'Ошибка сохранения заявки' });
    }
});

module.exports = router;
