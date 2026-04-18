# DEPLOY GUIDE: Финальная интеграция 12 LSI + E-E-A-T

## Какие файлы заменить

### 1. FINAL_index.html → static-site/index.html
Замените `static-site/index.html` на `FINAL_index.html`

**Что добавлено:**
- H1: "Снижение тарифа на электроэнергию: аренда мини-ТЭЦ, экономия до 40%"
- Meta title/description обновлены из texts.md §1
- LSI: electric power rental, сокращение расходов на энергоресурсы, управление ценовыми рисками энергии, двухставочный тариф, мощность и энергия, total cost of ownership, долгосрочная аренда станции, операционная аренда, performance contract, ESCO модель
- E-E-A-T: Блок формул (LCOE/NPV/IRR/TCO) — Expertise
- E-E-A-T: Блок кейсов с цифрами (5 отраслей) — Experience
- Schema.org: Organization + Service + FAQPage + BreadcrumbList

### 2. FINAL_services.html → static-site/services.html
Замените `static-site/services.html` на `FINAL_services.html`

**Что добавлено:**
- H1: "Услуги miniTES: энергосервис и электроснабжение предприятия"
- Meta title/description обновлены из texts.md §4 + §5
- LSI: энергетическое обследование, балансировка мощности, performance contract, ESCO модель
- E-E-A-T: Сравнительные таблицы (ЭСК vs Аренда vs Покупка vs Сеть)
- E-E-A-T: Отраслевые кейсы, законодательные ссылки (44-ФЗ, 223-ФЗ, 261-ФЗ)
- Schema.org: Service (Энергосервисный контракт + Электроснабжение) + BreadcrumbList

### 3. sitemap.xml → static-site/sitemap.xml
Добавьте/замените `static-site/sitemap.xml`

**Что добавлено:**
- URL: https://minites.ru/services.html
- Все основные страницы сайта

## Инструкция по деплою

### Вариант A: Локальная замена
1. Скопируйте `FINAL_index.html` → `static-site/index.html`
2. Скопируйте `FINAL_services.html` → `static-site/services.html`
3. Скопируйте `sitemap.xml` → `static-site/sitemap.xml`
4. Закоммитьте изменения: `git add static-site/ && git commit -m "SEO: 12 LSI + E-E-A-T integration"`
5. Отправьте: `git push`

### Вариант B: GitHub Pages (авто-деплой)
1. Выполните шаги из Варианта A
2. GitHub Actions автоматически задеплоит изменения
3. Проверьте сайт через 2-3 минуты

## Проверка после деплоя

1. Откройте https://minites.ru/ — проверьте H1, meta, контент
2. Откройте https://minites.ru/services.html — проверьте H1, meta, контент
3. Проверьте Schema.org через https://validator.schema.org/
4. Проверьте LSI-слова через поиск в исходном коде страницы

## 12 LSI-слов (проверка)

| # | LSI-слово | Страница | Статус |
|---|-----------|----------|--------|
| 1 | electric power rental | index.html | ✅ |
| 2 | долгосрочная аренда станции | index.html | ✅ |
| 3 | операционная аренда | index.html | ✅ |
| 4 | сокращение расходов на энергоресурсы | index.html | ✅ |
| 5 | управление ценовыми рисками энергии | index.html | ✅ |
| 6 | двухставочный тариф | index.html | ✅ |
| 7 | мощность и энергия | index.html | ✅ |
| 8 | total cost of ownership | index.html | ✅ |
| 9 | performance contract | index.html + services.html | ✅ |
| 10 | ESCO модель | index.html + services.html | ✅ |
| 11 | энергетическое обследование | services.html | ✅ |
| 12 | балансировка мощности | services.html | ✅ |

## Что НЕ было изменено

- ✅ JS калькулятор (js/calculator.js) — 100% сохранён
- ✅ JS заявки (js/github-forms.js) — 100% сохранён
- ✅ CSS стили (css/styles.css) — 100% сохранён
- ✅ Архитектура HTML — структура, классы, ID не изменены
- ✅ Навигация, футер, мобильное меню — без изменений