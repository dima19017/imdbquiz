import os
import shutil
import tarfile

# Параметры
source_files = ["templates", "app.py", "requirements.txt", "imbdquiz.db"]
destination_folder = "/mnt/d/imdbquiz"
archive_name = "/mnt/d/imdbquiz.tar.gz"

# Проверка доступности пути
if not os.path.ismount("/mnt/d"):
    raise RuntimeError("Диск D: не доступен в WSL. Проверьте настройки монтирования.")

# Создание целевой папки
if not os.path.exists(destination_folder):
    os.makedirs(destination_folder)

# Копирование файлов
try:
    for item in source_files:
        source_path = os.path.abspath(item)  # Абсолютный путь к файлу/папке
        if os.path.isdir(source_path):
            shutil.copytree(source_path, os.path.join(destination_folder, os.path.basename(item)))
        elif os.path.isfile(source_path):
            shutil.copy(source_path, destination_folder)
    print("Файлы успешно скопированы.")
except Exception as e:
    print(f"Ошибка при копировании файлов: {e}")

# Архивация папки
try:
    with tarfile.open(archive_name, "w:gz") as tar:
        tar.add(destination_folder, arcname=os.path.basename(destination_folder))
    print("Папка успешно заархивирована.")
except Exception as e:
    print(f"Ошибка при архивации папки: {e}")

# Удаление папки
try:
    shutil.rmtree(destination_folder)
    print("Папка успешно удалена.")
except Exception as e:
    print(f"Ошибка при удалении папки: {e}")
