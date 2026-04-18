# Статический сайт калькулятора миниТЭЦ для GitHub Pages

## 📁 Структура проекта

```
static-site/
├── index.html          # Главная страница с калькулятором
├── data/
│   └── equipment.json  # Данные оборудования (вместо БД)
├── js/
│   ├── equipment.js    # Загрузка оборудования
│   └── calculator.js   # Логика калькулятора и PDF
└── README.md           # Этот file
```

## 🚀 Развёртывание на GitHub Pages

### Шаг 1: Настройка Formspree для форм
1. Зарегистрируйтесь на [Formspree](https://formspree.io/)
2. Создайте новую форму
3. Замените `YOUR_FORM_ID` в `index.html` (строка 295) на ваш ID формы

### Шаг 2: Публикация на GitHub Pages

#### Вариант A: Через основную ветку
1. Поместите содержимое папки `static-site/` в корень репозитория
2. В настройках репозитория GitHub:
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: main (или master)
   - Folder: / (root)
3. Нажмите Save

#### Вариант B: Через папку docs
1. Создайте папку `docs` в корне репозитория
2. Скопируйте содержимое `static-site/` в `docs/`
3. В настройках GitHub:
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: main (или master)
   - Folder: /docs

#### Вариант C: Отдельный репозиторий
1. Создайте новый репозиторий (например, `minites-calculator`)
2. Скопируйте содержимое `static-site/` в корень
3. Настройте GitHub Pages как в варианте A

### Шаг 3: Настройка домена (опционально)

1. В настройках GitHub Pages добавьте домен `minites.ru`
2. В DNS настройках домена:
   - Создайте CNAME запись: `www.minites.ru → username.github.io`
   - Или A записи для корневого домена:
     ```
     @ → 185.199.108.153
     @ → 185.199.109.153
     @ → 185.199.110.153
     @ → 185.199.111.153
     ```

## ⚙️ Конфигурация

### Обновление данных оборудования
Отредактируйте `data/equipment.json`:
```json
{
  "equipment": [
    {
      "id": 1,
      "name": "Название модели",
      "manufacturer": "Производитель",
      "power_kw": 100,
      "gas_consumption_per_kwh": 0.25,
      "purchase_price": 3500000,
      "rent_rate_month": 50000,
      "service_cost_per_kwh": 0.5
    }
  ],
  "mining_config": {
    "power_kw": 100,
    "revenue_per_kwh": 3.5,
    "capex_per_kw": 50000
  }
}
```

## 🔧 Особенности

### ✅ Что работает:
- Полностью клиентский калькулятор (без сервера)
- Генерация PDF в браузере
- Адаптивный дизайн
- SEO-оптимизация
- Формы через Formspree
- Все формулы и расчёты сохранены

### ⚠️ Что нужно учесть:
1. **Formspree** - бесплатный тариф ограничен 50 заявками/месяц
2. **PDF генерация** - базовая, без графиков (только текст)
3. **Данные оборудования** - хранятся в JSON файле

## 📊 Аналитика

Добавьте метрики в `index.html` перед закрывающим `</head>`:

```html
<!-- Яндекс.Метрика -->
<script type="text/javascript" >
   // Вставьте код метрики
</script>

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
```

## 🎨 Кастомизация

### Изменение цветов
Все стили используют Tailwind CSS. Для изменения основной цветовой схемы отредактируйте классы в `index.html`.

### Добавление новых полей
1. Добавьте поле в форму в `index.html`
2. Обработайте в `calculator.js` в функции `calculateTariff`
3. Обновите отображение в `displayResults`

## 🔄 Обновление с серверной версии

Если нужно вернуться к серверной версии:
1. Используйте папку `calculator/` с Node.js сервером
2. Настройте VPS/Vercel/Heroku
3. Подключите базу данных

## 📝 Лицензия

© 2026 миниТЭЦ. Все права защищены.