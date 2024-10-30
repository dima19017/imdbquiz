// backend/routes/guest.js

const express = require('express');
const router = express.Router();
const db = require('../database');

// Маршрут для подключения к существующей комнате
router.post('/join-session', (req, res) => {
    const { name, avatar, session_id } = req.body;

    // Проверяем, существует ли сессия
    const checkSessionQuery = `SELECT * FROM sessions WHERE id = ?`;
    db.get(checkSessionQuery, [session_id], (err, session) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!session) {
            return res.status(400).json({ error: 'Session does not exist' });
        }

        // Проверяем, есть ли уже игрок с таким именем в этой комнате
        const checkNameQuery = `SELECT * FROM guest_players WHERE name = ? AND session_id = ?`;
        db.get(checkNameQuery, [name, session_id], (err, player) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (player) {
                return res.status(400).json({ error: 'Name already taken in this session. Choose a different name.' });
            }

            // Добавляем нового игрока в сессию
            const addGuestQuery = `INSERT INTO guest_players (name, avatar, session_id) VALUES (?, ?, ?)`;
            db.run(addGuestQuery, [name, avatar, session_id], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to add guest to session' });
                }

                res.json({ success: true });
            });
        });
    });
});

module.exports = router;


//// backend/routes/guest.js
//
//const express = require('express');          // Подключаем Express для создания маршрутов
//const router = express.Router();             // Создаем новый объект маршрутизатора для маршрутов гостевого входа
//const db = require('../database');           // Подключаем SQLite БД через database.js
//const { v4: uuidv4 } = require('uuid');      // Для генерации уникальных ID
//
//router.post ('/guest-login', (req, res) => {                      // Обрабатываем POST-запрос на '/guest-login' для добавления гостя
//    const { name, avatar, session_id } = req.body;                // извлекаем name и avatar из тела запроса. Откуда поступает sessionID??????
//
//    const checkQuery = `SELECT * FROM guest_players WHERE name = ? AND session_id = ?`;          // проверка уникальности гостевого имени в рамках сессии
//    db.get(checkQuery, [name, session_id], (err, row) => {
//        if (err) {
//            return res.status(500).json({ error: 'Database error' });
//        }
//        if (row) {
//            return res.status(400).json({ error: 'This name is already taken in this session'});
//        }
//
//        const insertQuery = `INSERT INTO guest_players (name, avatar, session_id) VALUES (?, ?, ?)`;
//        db.run(insertQuery, [name, avatar, session_id], function(err) {
//            if (err) {
//                console.error(err.message);
//                return res.status(500).json({ error: 'Failed to add guest'});
//            }
//            console.log(`Guest added to database with ID: ${this.lastID}, Name: ${name}, Avatar: ${avatar}`);
//            res.json({ player_id: this.lastID, name, avatar, session_id });       // Успешный ответ с информацией о госте
//        });
//    });
//});
//
//module.exports = router;