const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getDb, saveDatabase } = require('../database/init');

// Middleware для проверки аутентификации
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Требуется аутентификация' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Неверный токен' });
        }
        req.user = user;
        next();
    });
};

// POST /api/admin/login - Вход в админ-панель
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Проверяем логин и пароль из .env
    const correctUsername = process.env.ADMIN_USERNAME || 'admin';
    const correctPassword = process.env.ADMIN_PASSWORD;
    
    if (username === correctUsername && password === correctPassword) {
        // Создаём JWT токен
        const token = jwt.sign(
            { username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Устанавливаем cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 часа
            sameSite: 'strict'
        });
        
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// POST /api/admin/logout - Выход
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Выход выполнен' });
});

// GET /api/admin/verify - Проверка токена
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Получить все модели оборудования (требуется аутентификация)
router.get('/equipment-models', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const result = db.exec('SELECT * FROM equipment_models WHERE is_active = 1 ORDER BY power_kw');
    
    const data = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        manufacturer: row[2],
        power_kw: row[3],
        gas_consumption_per_kwh: row[4],
        min_load_percent: row[5],
        max_load_percent: row[6],
        purchase_price: row[7],
        rent_rate_month: row[8],
        service_cost_per_kwh: row[9],
        is_active: row[10],
        created_at: row[11],
        updated_at: row[12]
    })) : [];
    
    res.json({ success: true, data });
});

// Создать модель оборудования
router.post('/equipment-models', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month } = req.body;
    
    try {
        db.run(
            `INSERT INTO equipment_models (name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month]
        );
        saveDatabase();
        res.json({ success: true, message: 'Модель оборудования создана' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Обновить модель оборудования
router.put('/equipment-models/:id', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { id } = req.params;
    const { name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month } = req.body;
    
    try {
        db.run(
            `UPDATE equipment_models 
             SET name = ?, manufacturer = ?, power_kw = ?, gas_consumption_per_kwh = ?, 
                 purchase_price = ?, rent_rate_month = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month, id]
        );
        saveDatabase();
        res.json({ success: true, message: 'Модель оборудования обновлена' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Удалить модель оборудования
router.delete('/equipment-models/:id', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { id } = req.params;
    
    try {
        db.run('UPDATE equipment_models SET is_active = 0 WHERE id = ?', [id]);
        saveDatabase();
        res.json({ success: true, message: 'Модель оборудования удалена' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Получить все конфигурации майнинг-ферм
router.get('/mining-configs', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const result = db.exec('SELECT * FROM mining_farm_configs WHERE is_active = 1');
    
    const data = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        power_kw: row[2],
        revenue_per_kwh: row[3],
        capex_per_kw: row[4],
        is_active: row[5],
        created_at: row[6]
    })) : [];
    
    res.json({ success: true, data });
});

// Создать конфигурацию майнинг-фермы
router.post('/mining-configs', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { name, power_kw, revenue_per_kwh, capex_per_kw } = req.body;
    
    try {
        db.run(
            `INSERT INTO mining_farm_configs (name, power_kw, revenue_per_kwh, capex_per_kw) 
             VALUES (?, ?, ?, ?)`,
            [name || 'Ферма 100кВт', power_kw || 100, revenue_per_kwh, capex_per_kw]
        );
        saveDatabase();
        res.json({ success: true, message: 'Конфигурация майнинг-фермы создана' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Обновить конфигурацию майнинг-фермы
router.put('/mining-configs/:id', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { id } = req.params;
    const { name, power_kw, revenue_per_kwh, capex_per_kw } = req.body;
    
    try {
        db.run(
            `UPDATE mining_farm_configs 
             SET name = ?, power_kw = ?, revenue_per_kwh = ?, capex_per_kw = ?
             WHERE id = ?`,
            [name, power_kw, revenue_per_kwh, capex_per_kw, id]
        );
        saveDatabase();
        res.json({ success: true, message: 'Конфигурация майнинг-фермы обновлена' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Удалить конфигурацию майнинг-фермы
router.delete('/mining-configs/:id', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { id } = req.params;
    
    try {
        db.run('UPDATE mining_farm_configs SET is_active = 0 WHERE id = ?', [id]);
        saveDatabase();
        res.json({ success: true, message: 'Конфигурация майнинг-фермы удалена' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Получить все лиды (заявки)
router.get('/leads', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const result = db.exec('SELECT * FROM leads ORDER BY created_at DESC');
    
    const data = result.length > 0 ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        phone: row[2],
        email: row[3],
        source: row[4],
        created_at: row[5],
        status: row[6]
    })) : [];
    
    res.json({ success: true, data });
});

// Обновить статус лида
router.put('/leads/:id', authenticateToken, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ success: false, error: 'База данных не инициализирована' });
    
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        db.run(
            `UPDATE leads SET status = ? WHERE id = ?`,
            [status, id]
        );
        saveDatabase();
        res.json({ success: true, message: 'Статус лида обновлёn' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
