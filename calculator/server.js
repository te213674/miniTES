require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const { initializeDatabase, getDb, saveDatabase } = require('./database/init');
const adminRoutes = require('./routes/admin');
const calculatorRoutes = require('./routes/calculator');
const pdfRoutes = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/calculator', pdfRoutes);

// Главная страница - калькулятор
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница входа в админ-панель
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Админ-панель
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Автосохранение БД при закрытии
process.on('SIGINT', () => {
    saveDatabase();
    console.log('База данных сохранена');
    process.exit(0);
});

process.on('SIGTERM', () => {
    saveDatabase();
    console.log('База данных сохранена');
    process.exit(0);
});

// Инициализация и запуск
async function start() {
    try {
        await initializeDatabase();
        console.log('База данных инициализирована');
        
        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`);
            console.log(`Калькулятор: http://localhost:${PORT}`);
            console.log(`Админ-панель: http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        process.exit(1);
    }
}

start();