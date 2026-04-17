import pandas as pd
import os

file_path = "расчеты энергосервиса/расчет 3 ГПУ 2фермы 0наценки выкуп по объему ээ2.xls"

print(f"Анализ файла: {file_path}")

try:
    # Читаем файл
    xl = pd.ExcelFile(file_path, engine='xlrd')
    print(f"Листы: {xl.sheet_names}")
    
    # Читаем первый лист
    df = pd.read_excel(file_path, sheet_name=0, header=None)
    
    # Ищем строки, содержащие "подрядчик", "выплата", "ставка", "инвестор", "выкуп", "тариф"
    print("\nПоиск ключевых строк:")
    for idx, row in df.iterrows():
        row_str = " | ".join([str(val) for val in row if pd.notna(val)])
        if any(keyword in row_str.lower() for keyword in ['одрядчик', 'выплата', 'ставка', 'инвестор', 'выкуп', 'тариф', 'итого']):
            print(f"Строка {idx}: {row_str}")
            
except Exception as e:
    print(f"Ошибка: {e}")
