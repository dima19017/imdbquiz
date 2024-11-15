// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Инициализация dotenv для работы с переменными окружения
dotenv.config();

const app = express();

// Используем мидлвары
app.use(cors());
app.use(express.json());

// Пример маршрута
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from backend' });
});

// Экспортируем сервер для запуска
module.exports = app;
