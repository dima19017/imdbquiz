# Перечень файлов для слияния
file_paths = [
    'description.txt',
    'frontend/src/App.js',
    'frontend/src/components/GuestLoginModal.js',
    'frontend/src/components/MainScreen.js',
    'backend/server.js',
    'backend/index.js',
    'backend/database.js',
    'backend/routes/guest.js'
]

# Название итогового файла
output_file = 'combined_output.js'

def merge_files(file_paths, output_file):
    with open(output_file, 'w') as outfile:
        for file_path in file_paths:
            try:
                with open(file_path, 'r') as infile:
                    # Добавляем название файла как комментарий для ясности
                    # outfile.write(f'// ---- {file_path} ----\n')
                    outfile.write(infile.read())
                    outfile.write('\n\n')  # Разделение между файлами
                print(f'Добавлен файл: {file_path}')
            except FileNotFoundError:
                print(f'Файл не найден: {file_path}')

merge_files(file_paths, output_file)
print(f'Все файлы успешно объединены в {output_file}')
