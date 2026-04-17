/**
 * miniTES.ru — Forms Handler
 * Отправка форм через FormSubmit.co (основной) + GitHub Issues (резерв)
 */

document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // FormSubmit.co — основная отправка
    // ==========================================
    
    /**
     * Инициализирует форму на FormSubmit.co
     * @param {HTMLFormElement} formElement - форма
     * @param {Object} options - настройки
     */
    function initFormSubmit(formElement, options) {
        if (!formElement) return;

        const formAction = 'https://formsubmit.co/' + (options.email || '');
        const successMessage = options.successMessage || 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.';
        const analyticsGoal = options.analyticsGoal || '';

        // Устанавливаем action
        formElement.setAttribute('action', formAction);
        
        // Добавляем скрытые поля для улучшения email
        addHiddenField(formElement, '_subject', options.subject || 'Заявка с сайта miniTES.ru');
        addHiddenField(formElement, '_captcha', 'false'); // отключаем captcha (опционально)
        addHiddenField(formElement, '_template', 'box'); // красивый шаблон письма

        // Обработка отправки
        formElement.addEventListener('submit', function(e) {
            e.preventDefault();

            // Валидация
            if (typeof validateForm === 'function' && !validateForm(formElement)) {
                return;
            }

            // Блокируем кнопку
            const submitBtn = formElement.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.textContent = 'Отправка...';
                submitBtn.disabled = true;
            }

            // Собираем данные FormData
            const formData = new FormData(formElement);

            // Добавляем страницу-источник
            formData.append('_after', window.location.href);
            
            // Отправляем через fetch для контроля
            fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(function(response) {
                if (response.ok) {
                    // Успех
                    if (typeof showFormSuccess === 'function') {
                        showFormSuccess(successMessage);
                    }
                    formElement.reset();
                    
                    // Аналитика
                    if (analyticsGoal && typeof gtag === 'function') {
                        gtag('event', 'generate_lead', { form_name: analyticsGoal });
                    }
                    if (analyticsGoal && typeof ym === 'function') {
                        // Яндекс.Метрика - замените ID счётчика
                        try { ym(XXXXXXXX, 'reachGoal', analyticsGoal); } catch(e) {}
                    }
                } else {
                    throw new Error('Ошибка сервера: ' + response.status);
                }
            })
            .catch(function(error) {
                console.error('FormSubmit error:', error);
                alert('Произошла ошибка при отправке. Пожалуйста, попробуйте ещё раз или позвоните нам.');
            })
            .finally(function() {
                if (submitBtn) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        });
    }

    /**
     * Добавляет скрытое поле в форму
     */
    function addHiddenField(form, name, value) {
        let field = form.querySelector('input[name="' + name + '"]');
        if (!field) {
            field = document.createElement('input');
            field.type = 'hidden';
            field.name = name;
            form.appendChild(field);
        }
        field.value = value;
    }

    // ==========================================
    // Инициализация всех форм на странице
    // ==========================================

    // 1. Главная форма CTA (на лендинге)
    var ctaForm = document.getElementById('cta-form');
    if (ctaForm) {
        initFormSubmit(ctaForm, {
            email: 'info@minites.ru',  // ЗАМЕНИТЕ на реальный email!
            subject: 'Запрос расчёта выгоды — miniTES.ru',
            successMessage: 'Запрос принят! Мы подготовим индивидуальный расчёт и свяжемся с вами.',
            analyticsGoal: 'CTA_MAIN'
        });
    }

    // 2. Форма контактов
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        initFormSubmit(contactForm, {
            email: 'info@minites.ru',
            subject: 'Сообщение с формы контактов — miniTES.ru',
            successMessage: 'Сообщение отправлено! Мы ответим в течение 1 рабочего дня.',
            analyticsGoal: 'FORM_CONTACT'
        });
    }

    // 3. Форма в калькуляторе (лид после расчёта)
    var leadForm = document.getElementById('lead-form');
    if (leadForm) {
        // Для калькулятора тоже используем FormSubmit.co
        leadForm.setAttribute('action', 'https://formsubmit.co/info@minites.ru');
        addHiddenField(leadForm, '_subject', 'Расчёт калькулятора — заявка на КП — miniTES.ru');
        addHiddenField(leadForm, '_template', 'box');

        leadForm.addEventListener('submit', function(e) {
            // Сохраняем данные расчёта
            if (window.currentCalculationData) {
                var calcDataField = document.getElementById('calculation-data');
                if (calcDataField) {
                    calcDataField.value = JSON.stringify(window.currentCalculationData);
                }
            }
            // Форма отправится стандартно через FormSubmit.co
        });

        // Успешная обработка (если FormSubmit редиректит обратно)
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('formsubmit') === 'success') {
            if (typeof showFormSuccess === 'function') {
                showFormSuccess('Расчёт отправлен! Мы подготовим детальное коммерческое предложение.');
            }
            // Чистим URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }

});