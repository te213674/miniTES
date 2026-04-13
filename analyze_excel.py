import pandas as pd
import os
import glob

# Папка с расчетами
folder = "расчеты энергосервиса"

# Получаем список всех Excel файлов
excel_files = glob.glob(os.path.join(folder, "*.xls")) + glob.glob(os.path.join(folder, "*.xlsx"))

print(f"Найдено файлов: {len(excel_files)}")
for f in excel_files:
    print(f"  - {os.path.basename(f)}")

print("\n" + "="*80)
print("АНАЛИЗ ЦЕНОВЫХ МОДЕЛЕЙ")
print("="*80)

# Анализируем каждый файл
for file_path in excel_files:
    filename = os.path.basename(file_path)
    print(f"\n📊 ФАЙЛ: {filename}")
    print("-" * 60)
    
    try:
        # Читаем файл
        if filename.endswith('.xls'):
            xl = pd.ExcelFile(file_path, engine='xlrd')
        else:
            xl = pd.ExcelFile(file_path, engine='openpyxl')
        
        print(f"  Листы: {xl.sheet_names}")
        
        # Читаем первый лист
        df = pd.read_excel(file_path, sheet_name=0, header=None)
        
        # Выводим размерность
        print(f"  Размер: {df.shape[0]} строк x {df.shape[1]} столбцов")
        
        # Показываем первые 10 строк (ненулевые)
        print("\n  Первые данные:")
        count = 0
        for idx, row in df.iterrows():
            # Пропускаем полностью пустые строки
            if row.dropna().empty:
                continue
            # Показываем первые 10 непустых строк
            if count < 15:
                # Собираем не пустые значения
                values = []
                for val in row:
                    if pd.notna(val) and str(val).strip() != '':
                        values.append(str(val).strip())
                if values:
                    print(f"    {values}")
                    count += 1
        
        # Ищем ключевые слова связанные с ценообразованием
        print("\n  Ключевые финансовые показатели:")
        keywords = ['цена', 'тариф', 'стоимость', 'расход', 'затраты', 'наценка', 
                   'инвестиции', 'выкуп', 'аренда', 'квт', 'мощность', 'газ', 
                   'обслуживание', 'инвестор', 'выплаты']
        
        found_keywords = []
        for keyword in keywords:
            # Ищем в каждом значении
            for idx, row in df.iterrows():
                for val in row:
                    if pd.notna(val) and keyword.lower() in str(val).lower():
                        found_keywords.append(str(val).strip())
                        break
        
        if found_keywords:
            # Убираем дубликаты
            unique_keywords = list(set(found_keywords))[:10]
            for kw in unique_keywords:
                print(f"    • {kw}")
        
    except Exception as e:
        print(f"  Ошибка чтения: {e}")

print("\n" + "="*80)
print("АНАЛИЗ ЗАВЕРШЕН")
print("="*80)