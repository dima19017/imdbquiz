// backend/index.js
require('dotenv').config();              // подключает библиотеку dotenv, которая загружает переменные окружения из файла .env в объект process.env. Это позволяет использовать переменные, такие как PORT, в коде без необходимости их жестко задавать. Например, если в .env указано PORT=3000, то process.env.PORT будет равно 3000. Если переменная PORT не задана, используется значение по умолчанию 3000
const express = require('express');      // подключает библиотеку Express, фреймворк для работы с сервером на Node.js. Express упрощает настройку и обработку маршрутов, управление запросами и отправку ответов
const app = express();                    // создает экземпляр Express, который мы используем для настройки сервера. Переменная app будет нашим сервером
const server = require('./server');         // Подключаем основной сервер
const PORT = process.env.PORT || 3000;      // задаем порт для сервера из файла .env, если нет, то используем 3000

app.use(express.json());
app.use('/', server);       //подключаем основной сервер как middleware

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);   // запускает сервер и слушает на указанном порту. Как только сервер запустится, он выведет сообщение в консоль: Server is running on port 3000
});
