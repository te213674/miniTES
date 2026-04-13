import pandas as pd

# Читаем файл с конкурентами
file_path = "список конкурентов по энергосервису.xls"

try:
    # Пытаемся прочитать xls файл
    df = pd.read_excel(file_path, engine='xlrd', header=None)
    
    print("✅ Файл успешно прочитан!")
    print(f"Размер: {df.shape[0]} строк x {df.shape[1]} столбцов")
    
    print("\n" + "="*80)
    print("СПИСОК КОНКУРЕНТОВ ПО ЭНЕРГОСЕРВИСУ")
    print("="*80)
    
    # Показываем все данные
    for idx, row in df.iterrows():
        # Собираем не пустые значения
        values = []
        for val in row:
            if pd.notna(val) and str(val).strip() != '':
                values.append(str(val).strip())
        
        if values and len(values) > 1:  # Показываем только строки с данными
            print(f"\nСтрока {idx + 1}:")
            for i, val in enumerate(values, 1):
                print(f"  {i}. {val}")
    
except Exception as e:
    print(f"❌ Ошибка чтения файла: {e}")
    print("\nПопробуем прочитать как CSV...")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            print(content[:2000])  # Показываем первые 2000 символов
    except:
        pass