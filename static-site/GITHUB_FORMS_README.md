# Система заявок через GitHub Issues

Эта система отправляет заявки с сайта напрямую в GitHub Issues репозитория miniTES.

## Как это работает

1. Пользователь заполняет форму на сайте
2. JavaScript отправляет данные в GitHub API и создаёт Issue
3. GitHub Actions автоматически отправляет email уведомление на info@minites.ru

## Настройка

### 1. Добавьте GitHub Personal Access Token

**Важно:** Не добавляйте токен напрямую в код! GitHub Secret Scanning заблокирует пуш.

#### Способ 1: Через секрет GitHub Actions (рекомендуется)

1. Создайте Personal Access Token:
   - Перейдите в Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Нажмите "Generate new token (classic)"
   - Выберите scope: `public_repo` (или `repo` для приватных репозиториев)
   - Скопируйте токен (начинается на `ghp_`)

2. Добавьте токен как секрет GitHub Actions:
   - Перейдите в репозиторий → Settings → Secrets and variables → Actions
   - Нажмите "New repository secret"
   - Name: `GITHUB_API_TOKEN`
   - Value: ваш токен (ghp_...)
   - Нажмите "Add secret"

3. Модифицируйте workflow `.github/workflows/email-notification.yml`:
   - Добавьте шаг для передачи токена в переменную окружения
   - Токен будет доступен в GitHub Pages через переменную окружения

#### Способ 2: Локальная вставка (для тестирования)

Для локального тестирования можно временно добавить токен в `contact.html`:
```html
<html lang="ru" data-api-token="ghp_your_token_here">
```

**Не коммитьте токен в репозиторий!** Добавьте `contact.html` в `.gitignore` или используйте `.env` файл.

### 2. Добавьте SMTP секреты для email уведомлений

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте два секрета:
   - `YANDEX_EMAIL`: `bigmazzzzzy@yandex.ru`
   - `YANDEX_PASSWORD`: пароль приложения Яндекс (не от аккаунта!)

### 3. Проверьте работу

1. Откройте `contact.html` в браузере
2. Заполните форму
3. Проверьте:
   - Issue создан в репозитории
   - Email пришёл на info@minites.ru

## Структура Issues

### Заявка на КП
- Labels: `заявка-на-КП`, `контакты`
- Title: `Заявка с сайта: {Имя}`

### Анализ газа
- Labels: `анализ-газа`, `инженерный-запрос`
- Title: `Анализ газа от: {Имя}`

## Файлы

- `static-site/js/github-forms.js` - JavaScript модуль для отправки форм
- `static-site/contact.html` - страница с формой контактов
- `.github/workflows/email-notification.yml` - workflow для email уведомлений
- `GITHUB_SETUP_INSTRUCTIONS.md` - подробная инструкция по настройке

## Безопасность

- Токен не должен храниться в репозитории
- Используйте GitHub Secrets для хранения токена
- GitHub Secret Scanning автоматически обнаружит и заблокирует пуш с токеном