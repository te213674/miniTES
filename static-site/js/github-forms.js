/**
 * GitHub Forms Integration for miniTES
 * Отправляет данные форм напрямую в GitHub Issues API
 */

// Конфигурация GitHub
const GITHUB_CONFIG = {
    owner: 'te213674',
    repo: 'miniTES',
    token: ''
};

// Загрузка токена: приоритет config.js → data-api-token → undefined
document.addEventListener('DOMContentLoaded', function() {
    // 1. Приоритет: глобальная переменная из js/config.js
    if (typeof GITHUB_TOKEN !== 'undefined' && GITHUB_TOKEN && GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE') {
        GITHUB_CONFIG.token = GITHUB_TOKEN;
    } else {
        // 2. Fallback: data-api-token атрибут (для обратной совместимости)
        const tokenElement = document.querySelector('[data-api-token]');
        if (tokenElement) {
            const token = tokenElement.getAttribute('data-api-token');
            if (token && token !== 'YOUR_GITHUB_TOKEN') {
                GITHUB_CONFIG.token = token;
            }
        }
    }
    
    if (!GITHUB_CONFIG.token) {
        console.info('GitHub API token not found. Forms will use FormSubmit.co instead. Create js/config.js with your token for GitHub Issues.');
    } else {
        console.log('GitHub API token loaded. Issues integration is active.');
    }
});

/**
 * Создаёт Issue в GitHub
 * @param {Object} data - Данные формы
 * @returns {Promise} - Результат создания Issue
 */
async function createGitHubIssue(data) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`;
    
    const headers = {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    
    const body = JSON.stringify({
        title: data.title,
        body: data.body,
        labels: data.labels || []
    });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при создании Issue');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating GitHub Issue:', error);
        throw error;
    }
}

/**
 * Обрабатывает отправку основной формы контактов
 */
function handleContactForm(form) {
    const formData = new FormData(form);
    
    const data = {
        title: `Заявка с сайта: ${formData.get('name') || 'Аноним'}`,
        body: `
**Контактная информация:**
- **Имя:** ${formData.get('name') || 'Не указано'}
- **Телефон:** ${formData.get('phone') || 'Не указано'}
- **Email:** ${formData.get('email') || 'Не указано'}
- **Компания:** ${formData.get('company') || 'Не указано'}

**Сообщение:**
${formData.get('message') || 'Сообщение отсутствует'}

---
*Заявка отправлена с сайта miniTES ${new Date().toLocaleString('ru-RU')}*
`,
        labels: ['заявка-на-КП', 'контакты']
    };
    
    return createGitHubIssue(data);
}

/**
 * Обрабатывает отправку формы с анализом газа
 */
function handleAnalysisForm(form) {
    const formData = new FormData(form);
    const fileName = formData.get('file') ? formData.get('file').name : 'файл не прикреплён';
    
    const data = {
        title: `Анализ газа от: ${formData.get('name') || 'Аноним'}`,
        body: `
**Контактная информация:**
- **Имя:** ${formData.get('name') || 'Не указано'}
- **Телефон:** ${formData.get('phone') || 'Не указано'}
- **Email:** ${formData.get('email') || 'Не указано'}
- **Компания:** ${formData.get('company') || 'Не указано'}

**Файл анализа:** ${fileName}

**Комментарий:**
${formData.get('message') || 'Комментарий отсутствует'}

---
*Анализ газа отправлен с сайта miniTES ${new Date().toLocaleString('ru-RU')}*

⚠️ **Важно:** Файл не был прикреплён к Issue. Пожалуйста, свяжитесь с клиентом для получения файла.
`,
        labels: ['анализ-газа', 'инженерный-запрос']
    };
    
    return createGitHubIssue(data);
}

/**
 * Инициализация обработчиков форм
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Forms Integration initialized');
    
    // Обработка основной формы контактов
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Отправка...';
            submitButton.disabled = true;
            
            try {
                await handleContactForm(this);
                
                // Успешная отправка
                alert('✅ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
                this.reset();
                
                // Отправка аналитики (если есть)
                if (typeof sendAnalyticsGoal === 'function') {
                    sendAnalyticsGoal('FORM_SUBMIT_MAIN');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                alert('❌ Произошла ошибка при отправке заявки. Пожалуйста, попробуйте снова или свяжитесь с нами по телефону.');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
    
    // Обработка формы анализа газа
    const analysisForm = document.getElementById('analysisForm');
    if (analysisForm) {
        analysisForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Отправка...';
            submitButton.disabled = true;
            
            try {
                await handleAnalysisForm(this);
                
                // Успешная отправка
                alert('✅ Анализ газа успешно отправлен! Наш инженер подготовит расчёт.');
                this.reset();
                closeAnalysisModal();
                
                // Отправка аналитики (если есть)
                if (typeof sendAnalyticsGoal === 'function') {
                    sendAnalyticsGoal('FORM_SUBMIT_ANALYSIS');
                }
            } catch (error) {
                console.error('Analysis form submission error:', error);
                alert('❌ Произошла ошибка при отправке анализа. Пожалуйста, попробуйте снова.');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
});