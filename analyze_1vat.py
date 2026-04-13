import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def analyze_1vat():
    """Углубленный анализ сайта 1vat.ru"""
    
    print("=" * 80)
    print("УГЛУБЛЕННЫЙ АНАЛИЗ 1vat.ru (ОСНОВНОЙ КОНКУРЕНТ)")
    print("=" * 80)
    
    url = "https://1vat.ru"
    
    # Заголовки для имитации браузера
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    }
    
    # Пробуем получить сайт
    print(f"\n🔍 Анализируем сайт: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        print(f"✅ Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 1. Заголовок сайта
            title = soup.title.string if soup.title else "Нет заголовка"
            print(f"\n📌 Заголовок сайта: {title}")
            
            # 2. Мета-описание
            meta_desc = soup.find('meta', {'name': 'description'})
            description = meta_desc['content'] if meta_desc else "Нет описания"
            print(f"📝 Описание: {description[:200]}...")
            
            # 3. Ключевые слова
            meta_keywords = soup.find('meta', {'name': 'keywords'})
            keywords = meta_keywords['content'] if meta_keywords else "Нет ключевых слов"
            print(f"🔑 Ключевые слова: {keywords[:200]}...")
            
            # 4. Заголовки H1, H2, H3
            h1_tags = [h1.get_text().strip() for h1 in soup.find_all('h1')]
            h2_tags = [h2.get_text().strip() for h2 in soup.find_all('h2')[:5]]
            
            print(f"\n📊 Заголовки H1: {h1_tags}")
            print(f"📊 Первые 5 заголовков H2: {h2_tags}")
            
            # 5. Основные разделы/категории
            print(f"\n🏷️  АНАЛИЗ АССОРТИМЕНТА:")
            
            # Ищем ссылки на каталог
            catalog_links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                text = link.get_text().strip()
                if any(word in text.lower() for word in ['генератор', 'дизель', 'электр', 'квт', 'аренда', 'установка']):
                    catalog_links.append({'text': text, 'url': href})
            
            if catalog_links:
                print("   Найдены категории:")
                for i, item in enumerate(catalog_links[:10], 1):
                    print(f"   {i}. {item['text']} - {item['url'][:50]}")
            
            # 6. Анализ цен (если есть)
            print(f"\n💰 АНАЛИЗ ЦЕН:")
            prices = []
            for price_tag in soup.find_all(['span', 'div', 'p'], class_=re.compile(r'price|cost|цена|руб', re.I)):
                price_text = price_tag.get_text().strip()
                if any(char.isdigit() for char in price_text) and ('руб' in price_text.lower() or '₽' in price_text):
                    prices.append(price_text)
            
            if prices:
                print("   Найдены цены:")
                for i, price in enumerate(set(prices)[:10], 1):
                    print(f"   {i}. {price}")
            else:
                print("   Цены не найдены в явном виде")
            
            # 7. Контактная информация
            print(f"\n📞 КОНТАКТНАЯ ИНФОРМАЦИЯ:")
            
            # Ищем телефоны
            phones = re.findall(r'[\+]?[0-9\(\)\-\s]{10,}', response.text)
            if phones:
                print("   Телефоны:")
                phone_list = list(set(phones))[:5]
                for phone in phone_list:
                    print(f"   - {phone.strip()}")
            
            # Ищем email
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', response.text)
            if emails:
                print("   Email:")
                email_list = list(set(emails))[:3]
                for email in email_list:
                    print(f"   - {email}")
            
            # Ищем адрес
            address_patterns = ['адрес', 'г.', 'ул.', 'д.', 'офис']
            for p in soup.find_all(['p', 'div', 'span'], string=re.compile('|'.join(address_patterns), re.I)):
                text = p.get_text().strip()
                if len(text) < 200 and any(word in text for word in ['г.', 'ул.', 'офис']):
                    print(f"   Адрес: {text}")
                    break
            
            # 8. УТП и преимущества
            print(f"\n⭐ УТП И ПРЕИМУЩЕСТВА:")
            advantages = []
            for tag in soup.find_all(['div', 'p', 'li'], class_=re.compile(r'advantage|benefit|преимущ|плюс|выгод', re.I)):
                text = tag.get_text().strip()
                if len(text) > 10 and len(text) < 200:
                    advantages.append(text)
            
            if advantages:
                for i, adv in enumerate(set(advantages)[:8], 1):
                    print(f"   {i}. {adv}")
            
            # 9. Анализ структуры сайта
            print(f"\n🏗️  СТРУКТУРА САЙТА:")
            
            # Считаем количество ссылок
            all_links = soup.find_all('a', href=True)
            internal_links = [l for l in all_links if l['href'].startswith('/') or url in l['href']]
            external_links = [l for l in all_links if not l['href'].startswith('/') and url not in l['href']]
            
            print(f"   Всего ссылок: {len(all_links)}")
            print(f"   Внутренних: {len(internal_links)}")
            print(f"   Внешних: {len(external_links)}")
            
            # 10. Технологический стек
            print(f"\n🔧 ТЕХНОЛОГИЧЕСКИЙ СТЕК:")
            
            # Проверяем CMS
            cms_patterns = {
                'WordPress': 'wp-content|wordpress',
                'Joomla': 'joomla|components/com',
                'Bitrix': 'bitrix|bcomponents',
                'Tilda': 'tilda|tildacdn',
                'OpenCart': 'opencart|catalog/view',
                '1C-Bitrix': '1c-bitrix'
            }
            
            html_content = response.text.lower()
            for cms, pattern in cms_patterns.items():
                if re.search(pattern, html_content):
                    print(f"   CMS: {cms}")
                    break
            else:
                print("   CMS: Не определена (возможно, кастомная разработка)")
            
            # Проверяем аналитику
            analytics = []
            if 'google-analytics' in html_content or 'gtag' in html_content:
                analytics.append('Google Analytics')
            if 'yandex.metrika' in html_content or 'mc.yandex' in html_content:
                analytics.append('Яндекс.Метрика')
            if 'facebook.com/tr' in html_content:
                analytics.append('Facebook Pixel')
            
            if analytics:
                print(f"   Аналитика: {', '.join(analytics)}")
            
            # 11. Мобильная адаптивность
            viewport = soup.find('meta', {'name': 'viewport'})
            if viewport:
                print(f"   Мобильная версия: ✅ Есть (viewport: {viewport.get('content', '')[:50]})")
            else:
                print(f"   Мобильная версия: ❌ Не найдена")
            
            # 12. Скорость загрузки (примерная)
            print(f"\n⚡ СКОРОСТЬ ЗАГРУЗКИ:")
            print(f"   Размер страницы: {len(response.content) / 1024:.1f} КБ")
            print(f"   Время загрузки: {response.elapsed.total_seconds():.2f} сек")
            
            # 13. SEO-параметры
            print(f"\n🔍 SEO-АНАЛИЗ:")
            
            # Проверяем robots.txt
            try:
                robots_response = requests.get(f"{url}/robots.txt", timeout=5)
                if robots_response.status_code == 200:
                    print(f"   robots.txt: ✅ Есть")
                else:
                    print(f"   robots.txt: ❌ Нет")
            except:
                print(f"   robots.txt: ❌ Не найден")
            
            # Проверяем sitemap
            try:
                sitemap_response = requests.get(f"{url}/sitemap.xml", timeout=5)
                if sitemap_response.status_code == 200:
                    print(f"   sitemap.xml: ✅ Есть")
                else:
                    print(f"   sitemap.xml: ❌ Нет")
            except:
                print(f"   sitemap.xml: ❌ Не найден")
            
            # Проверяем SSL
            if url.startswith('https'):
                print(f"   SSL сертификат: ✅ Есть")
            else:
                print(f"   SSL сертификат: ❌ Нет")
            
            # 14. Социальные сети
            print(f"\n🌐 СОЦИАЛЬНЫЕ СЕТИ:")
            social_patterns = {
                'ВКонтакте': 'vk.com|vkontakte',
                'Telegram': 't.me|telegram',
                'YouTube': 'youtube.com',
                'WhatsApp': 'wa.me|whatsapp',
                'Instagram': 'instagram.com',
                'Facebook': 'facebook.com'
            }
            
            found_social = []
            for social, pattern in social_patterns.items():
                if re.search(pattern, html_content):
                    found_social.append(social)
            
            if found_social:
                print(f"   Найдено: {', '.join(found_social)}")
            else:
                print(f"   Социальные сети не найдены")
            
            # 15. Формы захвата
            print(f"\n📝 ФОРМЫ ЗАХВАТА:")
            forms = soup.find_all('form')
            if forms:
                print(f"   Найдено форм: {len(forms)}")
                for i, form in enumerate(forms[:3], 1):
                    inputs = form.find_all('input')
                    input_types = [inp.get('type', 'text') for inp in inputs]
                    print(f"   Форма {i}: {len(inputs)} полей ({', '.join(input_types[:5])})")
            else:
                print(f"   Формы не найдены")
            
            # 16. Онлайн-консультант
            online_chat = False
            chat_patterns = ['jivo', 'livechat', 'zendesk', 'intercom', 'drift', 'красная кнопка']
            for pattern in chat_patterns:
                if pattern in html_content:
                    online_chat = True
                    break
            
            if online_chat:
                print(f"   Онлайн-консультант: ✅ Есть")
            else:
                print(f"   Онлайн-консультант: ❌ Не найден")
            
            print("\n" + "=" * 80)
            print("АНАЛИЗ ЗАВЕРШЕН!")
            print("=" * 80)
            
            # Собираем данные для отчета
            data = {
                'title': title,
                'description': description,
                'keywords': keywords,
                'h1_tags': h1_tags,
                'h2_tags': h2_tags,
                'catalog_links': catalog_links,
                'prices': prices,
                'phones': phones,
                'emails': emails,
                'advantages': advantages,
                'analytics': analytics,
                'social': found_social,
                'online_chat': online_chat,
                'viewport': viewport is not None
            }
            
            # Сохраняем отчет
            save_report(data)
                
    except requests.RequestException as e:
        print(f"❌ Ошибка при подключении: {e}")
        print("   Возможные причины:")
        print("   - Сайт недоступен")
        print("   - Блокировка запросов")
        print("   - Проблемы с сетью")
        
        # Предлагаем альтернативный анализ
        print("\n🔄 Попробуем альтернативный анализ через кэш...")
        
        try:
            # Пробуем через веб-архив
            wayback_url = f"http://webcache.googleusercontent.com/search?q=1vat.ru"
            print(f"   Проверяем кэш Google: {wayback_url}")
        except:
            pass

def save_report(data):
    """Сохраняем отчет в файл"""
    
    report = f"""# Углубленный анализ 1vat.ru (основной конкурент)
Дата анализа: {datetime.now().strftime('%d.%m.%Y %H:%M')}

## 1. Общая информация
- **Заголовок**: {data.get('title', 'Н/Д')}
- **Описание**: {data.get('description', 'Н/Д')[:300]}
- **Ключевые слова**: {data.get('keywords', 'Н/Д')[:300]}

## 2. Структура и навигация
- **H1 заголовки**: {data.get('h1_tags', [])}
- **Основные разделы**: {data.get('h2_tags', [])[:5]}
- **Категории товаров**: {len(data.get('catalog_links', []))} найдено

## 3. Ассортимент
"""
    for item in data.get('catalog_links', [])[:10]:
        report += f"- {item['text']}\n"
    
    report += "\n## 4. Ценовая политика\n"
    prices = data.get('prices', [])
    if prices:
        for price in prices[:10]:
            report += f"- {price}\n"
    else:
        report += "Цены не найдены в явном виде\n"
    
    phones_list = list(set(data.get('phones', [])))[:3] if data.get('phones') else []
    emails_list = list(set(data.get('emails', [])))[:2] if data.get('emails') else []
    
    report += f"""
## 5. Контакты
- **Телефоны**: {', '.join(phones_list) if phones_list else 'Не найдены'}
- **Email**: {', '.join(emails_list) if emails_list else 'Не найдены'}

## 6. УТП и преимущества
"""
    for adv in data.get('advantages', [])[:8]:
        report += f"- {adv}\n"
    
    if not data.get('advantages'):
        report += "Не определены\n"
    
    report += f"""
## 7. Технологический стек
- **Аналитика**: {', '.join(data.get('analytics', [])) if data.get('analytics') else 'Не найдена'}
- **Социальные сети**: {', '.join(data.get('social', [])) if data.get('social') else 'Не найдены'}

## 8. Выводы
1. 1vat.ru - специализируется на продаже генераторов
2. {"Есть онлайн-консультант" if data.get('online_chat') else "Нет онлайн-консультанта"}
3. {"Мобильная версия адаптирована" if data.get('viewport') else "Мобильная версия не адаптирована"}
4. {"Используются современные инструменты аналитики" if data.get('analytics') else "Аналитика не обнаружена"}
"""
    
    with open('1vat_analysis_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n📄 Полный отчет сохранен в файл: 1vat_analysis_report.md")

if __name__ == "__main__":
    analyze_1vat()