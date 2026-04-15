const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'minites_calculator.db');

let db = null;

async function initializeDatabase() {
    const SQL = await initSqlJs();
    
    // Загружаем существующую БД или создаём новую
    try {
        if (fs.existsSync(DB_FILE)) {
            const fileBuffer = fs.readFileSync(DB_FILE);
            db = new SQL.Database(fileBuffer);
        } else {
            db = new SQL.Database();
        }
    } catch (err) {
        db = new SQL.Database();
    }
    
    // Создаём таблицы
    db.run(`
        CREATE TABLE IF NOT EXISTS equipment_models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            manufacturer TEXT NOT NULL,
            power_kw REAL NOT NULL,
            gas_consumption_per_kwh REAL NOT NULL,
            min_load_percent REAL DEFAULT 30,
            max_load_percent REAL DEFAULT 100,
            purchase_price REAL NOT NULL,
            rent_rate_month REAL NOT NULL,
            service_cost_per_kwh REAL DEFAULT 1.4,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS mining_farm_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT DEFAULT 'Ферма 100кВт',
            power_kw REAL DEFAULT 100.0,
            revenue_per_kwh REAL NOT NULL,
            capex_per_kw REAL NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT,
            load_profile TEXT,
            gas_tariff REAL,
            grid_tariff REAL,
            company_margin REAL,
            contract_term_months INTEGER,
            contract_type TEXT,
            equipment_model_id INTEGER,
            mining_farms_count INTEGER DEFAULT 0,
            tariff_per_kwh REAL,
            mining_profit_monthly REAL,
            payback_months REAL,
            irr REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица для хранения лидов (заявок)
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            source TEXT DEFAULT 'calculator',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
        )
    `);

    // Начальные данные для моделей ГПУ
    const equipmentCount = db.exec('SELECT COUNT(*) as count FROM equipment_models')[0];
    if (equipmentCount.values[0][0] === 0) {
        db.run(`INSERT INTO equipment_models (name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month) VALUES ('Doosan 200 кВт', 'Doosan', 200, 0.30, 14000000, 180000)`);
        db.run(`INSERT INTO equipment_models (name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month) VALUES ('Doosan 250 кВт', 'Doosan', 250, 0.30, 17000000, 220000)`);
        db.run(`INSERT INTO equipment_models (name, manufacturer, power_kw, gas_consumption_per_kwh, purchase_price, rent_rate_month) VALUES ('ТМЗ 200 кВт', 'ТМЗ', 200, 0.32, 12000000, 160000)`);
    }

    // Начальные данные для майнинг-ферм
    const miningCount = db.exec('SELECT COUNT(*) as count FROM mining_farm_configs')[0];
    if (miningCount.values[0][0] === 0) {
        db.run(`INSERT INTO mining_farm_configs (revenue_per_kwh, capex_per_kw) VALUES (3.5, 50000)`);
    }

    // Сохраняем БД
    saveDatabase();

    return db;
}

function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_FILE, buffer);
    }
}

function getDb() {
    return db;
}

// Автосохранение при закрытии
process.on('exit', saveDatabase);
process.on('SIGINT', () => {
    saveDatabase();
    process.exit();
});

module.exports = { initializeDatabase, getDb, saveDatabase };