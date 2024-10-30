// Мультиплеерный квиз, где игроки соревнуются в угадывании фильма по подсказкам. Игра проходит в три раунда, каждый содержит фиксированные подсказки, и игрокам дается 13 секунд на ответ в каждом раунде. Чем раньше игрок угадает фильм, тем больше очков он получает. Таблица лидеров обновляется по итогам игры.
// 
// # Подробная механика
// ## Главный экран
// На заднем фоне крутятся картинки или постеры из фильмов
// слева сверху кнопка main menu
// По центру две кнопки аутентификации как гость и через что-нибудь еще по типу почты, пароля, или через соц.сеть
// слева сверху выбор языка
// Снизу справа версия игры и уникальный хэш сессии
// 
// ## Экран сессии
// На этом экране создатель сессии может выбрать категорию игры, например: топ 500 фильмов, фильм ужасов и т.д.
// На этом экране находится номер комнаты и ссылка на комнату через которые можно позвать игроков
// Приглашенные игроки добавляются в комнату и отображаются ниже
// также есть кнопка выхода из комнаты
// Если при подключении по ссылке игрок не зарегистрирован ему предлагается пройти регистрацию как гость или через что-то
// Игру может начать только создатель сессии игровой
// будущая фича - чат
// 
// ## Экран игры
// На экране видны все игроки где нибудь снизу
// Номер раунда
// показано 7 мест для подсказок
// начинается первый раунд игры состоящий из трех итераций
// в первой итерации открывают три подсказки
// после этого игроки пишут свои ответы
// если кто-то не отправил ответ или отправил пустой - он может попытать удачу в следующем
// если игрок отправил ответ, его ответ заносится в систему и после того как ответы от всех игроков будут получены
// или закончатся раунды - начинается подсчет очков
// При получении ответов от всех игроков стоит немедленно переходить к следующей итерации, чтобы избегать простоя и сохранить интерес
// показывается правильный ответ, и в зависимости от того угадал игрок или нет, а также от того в каком раунде
// игроку начисляются очки
// показываются промежуточные очки и игра переходит в следующий раунд

// frontend/src/App.js

import React from 'react';
// import { LanguageProvider } from './contexts/LanguageContext';
import MainScreen from './components/MainScreen';

function App() {
  return (
    <MainScreen />
  );
}

export default App;


// frontend/components/GuestModal.js
import React, { useState } from "react"; // Импорт React и хуков useState для работы с локальным состоянием
// import './GuestLoginModal.css';

const GuestLoginModal = ({ onClose, onLogin }) => { // Компонент принимает 2 пропса для закрытия окна и для обработки данных гостя
    const [name, setName] = useState('');     // Локальное состояние для хранения имени гостя
    const [avatar, setAvatar] = useState(''); // Локальное состояние для хранения url аватара гостя

    const handleLogin = () => { // вызывается при нажатии кнопки "Join Game"
        if (name && avatar) {
            onLogin({ name, avatar});
            onClose();
        } else {
            alert("Please enter a name and choose an avatar.");
        }
    };

    return (
        <div className="modal-backdrop"> {/* обертка модального окна, создающая затемненный фон */}
            <div className="modal-content"> {/* Контент модального окна */}
                <h2>Enter Guest Details</h2> {/* Поле ввода для имени гостя */}
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)} // onChange - событие срабатывает когда значение в поле ввода изменяется. (e) => setName(e.target.value) - обновляет name в компоненте
                />
                <input                                       //Поле ввода для URL аватара
                    type="text"
                    placeholder="Enter avatar URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                />
                <button onClick={handleLogin}>Join Game</button> {/* Кнопка для подтверждения ввода и начала игры */}
                <button onClick={onClose}>Cancel</button> {/* Кнопка для отмены и закрытия модального окна */}
            </div>
        </div>
    );
};

export default GuestLoginModal;

// frontend/components/MainScreen.js
import React, { useState, useEffect, useContext } from 'react'; // Импортируются React и необходимые хуки, LanguageContext для управления языком, стили, и версия из package.json
import './MainScreen.css';
import packageJson from '../../package.json';
import GuestLoginModal from './GuestLoginModal';                // Импортируем компонент вызова окна гостя
// import { LanguageContext } from '../contexts/LanguageContext';

const MainScreen = () => {                                  // инициализация MainScreen const MainScreen = () => { /* код компонента */ };
    const version = packageJson.version;                    // const { language, setLanguage } = useContext(LanguageContext);
    const [sessionHash, setSessionHash] = useState('');     // Состояние sessionHash хранит уникальный хэш сессии для использования в течение всей сессии пользователя
    const [showModal, setShowModal] = useState(false);      // Состояние для управления показом модального окна

    useEffect(() => {                                       // Генерация или загрузка хэша сессии
        let hash = localStorage.getItem('sessionHash');
        if (!hash) {
            hash = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('sessionHash', hash);
        }
        setSessionHash(hash);
    }, []);

    const handleGuestLogin = (guestData) => {                          //функция для обработки гостевого входа, получает данные гостя
        fetch('/api/guest-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestData),
        })
        .then(Response => Response.json())
        .then(data => {
            console.log('Guest added:', data);
            // Здесь будем реализовывать переход в игровую комнату
        })
        .catch(error => console.error('Error:', error));
    };

    return (
        <div className='main-screen'>
            <div className='top-right-buttons'>
                {/* Кнопка "Main Menu" */}
                <button className='main-menu-button'>Main Menu</button>
                {/* Кнопка профиля */}
                <button className='profile-button'>Profile</button>
            </div>
            {/* Выбор языка */}
            <div className="language-select">
                <label>Language: </label>
                {/* <select value={language} onChange={(e) => setLanguage(e.target.value)}> */}
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                {/* </select> */}
            </div>

            {/* Кнопки "Играть как гость" и "Войти через почту/соцсеть" */}
            <div className='action-buttons'>
                <button className='guest-button' onClick={() => setShowModal(true)}>Play as Guest</button> {/* При нажатии на Play as Guest открывается модальное окно */}
                <button className='login-button'>Login via Email/Social</button>
            </div>
            {/* Отображение версии и уникального хэша сессии */}
            <div className="info-footer">
                <span>Version: {version}</span>
                <span>Session: {sessionHash}</span>
            </div>

            {showModal && <GuestLoginModal onClose={() => setShowModal(false)} onLogin={handleGuestLogin} />} {/* Рендеринг модального окна, если showModal true */}
        </div>
    );
};

export default MainScreen;

// backend/server.js
const express = require('express');
const router = express.Router();
const guestRoutes = require('./routes/guest');

router.use('/api', guestRoutes);       // Добавляем маршруты для гостевого входа

module.exports = router;

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


// backend/database.js
const sqlite3 = require('sqlite3').verbose();           // Здесь создается подключение к базе данных imdbquiz.db, которая хранится в папке data.
const path = require('path');                           // Импортируем модуль path

const dbPath = path.resolve(__dirname, '../data', "imdbquiz.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT, avatar TEXT, email TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, playerId INTEGER, startTime TEXT, FOREIGN KEY(playerId) REFERENCES players(id))");
  db.run("CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY, sessionId INTEGER, score INTEGER, FOREIGN KEY(sessionId) REFERENCES sessions(id))");
  console.log('Connecting to database at:', dbPath);
});

// Этот модуль экспортирует объект db, что позволяет другим файлам взаимодействовать с базой данных через этот подключенный файл
module.exports = db;


// backend/routes/guest.js

const express = require('express');          // Подключаем Express для создания маршрутов
const router = express.Router();             // Создаем новый объект маршрутизатора для маршрутов гостевого входа
const db = require('../database');           // Подключаем SQLite БД через database.js

router.post ('/guest-login', (req, res) => { // Обрабатываем POST-запрос на '/guest-login' для добавления гостя
    const { name, avatar } = req.body;                // извлекаем name и avatar из тела запроса

    const query = `INSERT INTO players (name, avatar) VALUES (?, ?)`;

    db.run(query, [name, avatar], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to add guest'});
        }
        console.log(`Guest added to database with ID: ${this.lastID}, Name: ${name}, Avatar: ${avatar}`);
        res.json({ playerId: this.lastID, name, avatar });
    });
});

module.exports = router;

