# Настройка форм для отправки заявок через GitHub Issues

## Проблема
Ранее формы работали через GitHub Issues API. После добавления `forms.js` (FormSubmit.co) возник конфликт обработчиков, и формы перестали работать.

## Что было исправлено

### 1. Убран конфликт скриптов
- **`static-site/index.html`**: удалён `forms.js`, оставлен только `github-forms.js`
- **`static-site/contact.html`**: убран устаревший `data-api-token` с недействительным токеном

### 2. Текущая архитектура
- `github-forms.js` — основной обработчик форм (отправка в GitHub Issues)
- `config.js` — файл с настройками (токен GitHub)
- `forms.js` — **НЕ ИСПОЛЬЗУЕТСЯ** (можно удалить)

## Как настроить формы для работы

### Вариант 1: GitHub Issues (рекомендуется)

1. **Создайте персональный токен GitHub:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - Права: `repo` (для доступа к Issues)
   - Скопируйте токен (начинается на `ghp_`)

2. **Настройте `static-site/js/config.js`:**
   ```javascript
   var GITHUB_TOKEN = 'ghp_ваш_токен_здесь';
   ```

3. **Активируйте GitHub Issues в репозитории:**
   - GitHub репозиторий → Settings → Features → Issues → ✅ Enabled

4. **Проверьте работу:**
   - Откройте `index.html` или `contact.html`
   - Заполните форму и отправьте
   - Заявка появится в GitHub Issues с метками

### Вариант 2: FormSubmit.co (альтернатива)

Если не хотите использовать GitHub Issues:

1. **Верните `forms.js` в HTML:**
   ```html
   <script src="js/forms.js"></script>
   ```

2. **Удалите `github-forms.js` из HTML**

3. **Настройте email в `forms.js`:**
   - Замените `info@minites.ru` на реальный email

4. **Первая активация:**
   - Отправьте тестовую заявку
   - Подтвердите email в письме от FormSubmit.co

## Структура файлов

```
static-site/
├── index.html          # Главная страница
├── contact.html        # Страница контактов
├── js/
│   ├── config.js       # Конфигурация (токен GitHub)
│   ├── app.js          # Основная логика
│   ├── github-forms.js # Обработчик форм → GitHub Issues
│   ├── forms.js        # Обработчик форм → FormSubmit.co (НЕ ИСПОЛЬЗУЕТСЯ)
│   ├── calculator.js   # Калькулятор
│   └── equipment.js    # Оборудование
└── css/
    └── styles.css      # Стили
```

## Важные примечания

1. **Безопасность токена:**
   - `config.js` добавлен в `.gitignore`
   - Токен не должен попадать в публичный репозиторий
   - При деплое на хостинг создайте `config.js` вручную

2. **Ограничения GitHub Issues:**
   - Токен имеет права на создание Issues
   - Не используйте токен с правами администратора
   - При компрометации — немедленно отзовите токен

3. **Если формы не работают:**
   - Откройте консоль браузера (F12)
   - Проверьте наличие ошибки "GitHub API token not found"
   - Убедитесь, что `config.js` содержит валидный токен

## Контакты для связи

При проблемах с настройкой:
- Проверьте `cline_docs/activeContext.md`
- Читайте `static-site/GITHUB_FORMS_README.md`