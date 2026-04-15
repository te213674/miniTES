const express = require('express');
const PDFDocument = require('pdfkit');
const router = express.Router();
const { getDb } = require('../database/init');

// POST /api/calculator/export-pdf - Генерация PDF-отчёта
router.post('/export-pdf', (req, res) => {
    try {
        const {
            equipment_model,
            calculation_data,
            input_params
        } = req.body;

        if (!calculation_data || !equipment_model) {
            return res.status(400).json({ 
                success: false, 
                error: 'Необходимы данные для генерации отчёта' 
            });
        }

        // Создаём PDF документ
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
                Title: 'Расчёт тарифа на электроэнергию - миниТЭЦ',
                Author: 'miniTES.ru',
                Subject: 'Расчёт энергосервисного контракта',
                CreationDate: new Date()
            }
        });

        // Устанавливаем заголовки
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="calculation_${Date.now()}.pdf"`);

        // Поток в ответ
        doc.pipe(res);

        // === ЗАГОЛОВОК ===
        doc.fontSize(20).text('Расчёт тарифа на электроэнергию', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text('от газопоршневых установок с учётом майнинг-ферм', { align: 'center' });
        doc.moveDown(1);

        // === ДАТА РАСЧЁТА ===
        doc.fontSize(10).text(`Дата расчёта: ${new Date().toLocaleDateString('ru-RU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, { align: 'right' });
        doc.moveDown(1);

        // === ОСНОВНЫЕ ПОКАЗАТЕЛИ ===
        doc.fontSize(14).text('Основные показатели', { underline: true });
        doc.moveDown(0.5);

        const tariff = calculation_data.tariff_per_kwh;
        const savings = calculation_data.savings_vs_grid_percent;
        const mining_profit = calculation_data.mining_profit_monthly;
        const payback = calculation_data.mining_payback_months;

        doc.fontSize(11);
        doc.text(`Тариф для клиента: ${tariff.toFixed(2)} руб/кВт·ч`, { bold: true });
        doc.text(`Экономия vs сетевой тариф: ${savings.toFixed(1)}%`, { bold: true, color: '#10b981' });
        doc.text(`Выручка от майнинга: ${mining_profit.toLocaleString()} руб/мес`, { bold: true });
        doc.text(`Окупаемость майнинг-ферм: ${payback ? payback + ' мес.' : '—'}`, { bold: true });
        doc.moveDown(1);

        // === ПАРАМЕТРЫ РАСЧЁТА ===
        doc.fontSize(14).text('Параметры расчёта', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(11);
        doc.text(`Оборудование: ${equipment_model.name} (${equipment_model.power_kw} кВт)`);
        doc.text(`Тариф на газ: ${input_params.gas_tariff} руб/м³`);
        doc.text(`Сетевой тариф: ${input_params.grid_tariff} руб/кВт·ч`);
        doc.text(`Маржа компании: ${input_params.company_margin}%`);
        doc.text(`Срок контракта: ${input_params.contract_term_months} мес.`);
        doc.text(`Количество майнинг-ферм: ${input_params.mining_farms_count}`);
        doc.moveDown(1);

        // === СТРУКТУРА ТАРИФА ===
        doc.fontSize(14).text('Структура тарифа', { underline: true });
        doc.moveDown(0.5);

        const breakdown = calculation_data.tariff_breakdown;
        doc.fontSize(11);
        doc.text(`Газ: ${breakdown.gas_cost_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.text(`Обслуживание: ${breakdown.service_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.text(`Аренда: ${breakdown.rent_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.text(`Выкуп оборудования: ${breakdown.capex_recovery_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.text(`Майнинг (вычет): -${breakdown.mining_discount_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.text(`Маржа компании: ${breakdown.margin_per_kwh.toFixed(2)} руб/кВт·ч`);
        doc.moveDown(0.5);
        doc.fontSize(12).text(`ИТОГО: ${tariff.toFixed(2)} руб/кВт·ч`, { bold: true });
        doc.moveDown(1);

        // === ОБОРУДОВАНИЕ ===
        doc.fontSize(14).text('Оборудование', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(11);
        doc.text(`Требуется ГПУ: ${calculation_data.equipment_count} шт.`);
        doc.text(`Общая мощность: ${calculation_data.total_power_kw} кВт`);
        doc.text(`Мощность майнинг-ферм: ${calculation_data.mining_power_kw} кВт`);
        doc.moveDown(1);

        // === ЭНЕРГОПОТРЕБЛЕНИЕ ===
        doc.fontSize(14).text('Энергопотребление (в месяц)', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(11);
        doc.text(`Клиент: ${calculation_data.monthly_energy_client_kwh.toLocaleString()} кВт·ч`);
        doc.text(`Майнинг: ${calculation_data.monthly_energy_mining_kwh.toLocaleString()} кВт·ч`);
        doc.text(`Всего: ${calculation_data.monthly_energy_total_kwh.toLocaleString()} кВт·ч`);
        doc.moveDown(1);

        // === ПРОФИЛЬ НАГРУЗКИ (таблица) ===
        doc.fontSize(14).text('Профиль нагрузки по часам', { underline: true });
        doc.moveDown(0.5);

        if (calculation_data.load_profile_original && calculation_data.load_profile_original.length > 0) {
            doc.fontSize(10);
            
            // Заголовки таблицы
            let y = doc.y;
            doc.text('Часы', 50, y, { width: 100 });
            doc.text('Нагрузка клиента, кВт', 150, y, { width: 150 });
            doc.text('Нагрузка с фермами, кВт', 300, y, { width: 150 });
            doc.moveDown(0.5);

            // Данные (показываем каждые 2 часа для компактности)
            const profile = calculation_data.load_profile_original;
            const profileWithMining = calculation_data.load_profile_with_mining;
            
            for (let i = 0; i < profile.length; i += 2) {
                const [hour, load] = profile[i];
                const [_, loadWithMining] = profileWithMining[i] || [hour, load];
                
                y = doc.y;
                doc.text(`${hour}:00`, 50, y, { width: 100 });
                doc.text(load.toString(), 150, y, { width: 150 });
                doc.text(loadWithMining.toString(), 300, y, { width: 150 });
                
                doc.moveDown(0.3);
                
                // Новая страница если нужно
                if (doc.y > 700) {
                    doc.addPage();
                }
            }
        }
        doc.moveDown(1);

        // === ЭКОНОМИЧЕСКИЙ ЭФФЕКТ ===
        doc.fontSize(14).text('Экономический эффект', { underline: true });
        doc.moveDown(0.5);

        const monthly_savings = (input_params.grid_tariff - tariff) * calculation_data.monthly_energy_client_kwh;
        const yearly_savings = monthly_savings * 12;

        doc.fontSize(11);
        doc.text(`Ежемесячная экономия клиента: ${monthly_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} руб.`);
        doc.text(`Ежегодная экономия клиента: ${yearly_savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} руб.`);
        doc.text(`Экономия за срок контракта: ${(yearly_savings * input_params.contract_term_months / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })} руб.`);
        doc.moveDown(1);

        // === КОНТАКТЫ ===
        doc.addPage();
        doc.fontSize(16).text('Контактная информация', { align: 'center', underline: true });
        doc.moveDown(2);

        doc.fontSize(12);
        doc.text('ООО "миниТЭЦ"', { align: 'center' });
        doc.text('Специалисты по энергосервисным контрактам', { align: 'center' });
        doc.moveDown(1);
        doc.text('Телефон: +7 (XXX) XXX-XX-XX', { align: 'center' });
        doc.text('Email: info@minites.ru', { align: 'center' });
        doc.text('Сайт: www.minites.ru', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(10).text('Данный расчёт является предварительным и не является публичной офертой.', { 
            align: 'center', 
            color: '#666' 
        });
        doc.text('Для получения детализированного коммерческого предложения свяжитесь с нами.', { 
            align: 'center', 
            color: '#666' 
        });

        // Завершаем документ
        doc.end();

    } catch (error) {
        console.error('Ошибка генерации PDF:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка генерации PDF-отчёта' 
        });
    }
});

module.exports = router;