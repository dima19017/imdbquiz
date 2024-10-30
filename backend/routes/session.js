// backend/routes/session.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const db = require('../database');
const { io } = require('../server'); // Импортируем io из server.js

// Маршрут для создания новой сессии и добавления первого игрока
router.post('/create-session', (req, res) => {
    const { name, avatar } = req.body;
    const session_id = uuidv4();

    // Создаем сессию и добавляем первого гостя
    const createSessionQuery = `INSERT INTO sessions (id, status) VALUES (?, 'waiting')`;
    db.run(createSessionQuery, [session_id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to create session' });
        }

        const addGuestQuery = `INSERT INTO guest_players (name, avatar, session_id) VALUES (?, ?, ?)`;
        db.run(addGuestQuery, [name, avatar, session_id], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to add guest to session' });
            }

            res.json({ session_id });
        });
    });
});

router.post('/join-session', (req, res) => {
    const { name, avatar, session_id } = req.body;

    // Проверка, существует ли сессия
    const checkSessionQuery = `SELECT * FROM sessions WHERE id = ?`;
    db.get(checkSessionQuery, [session_id], (err, session) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!session) return res.status(400).json({ error: 'Session does not exist' });

        // Добавляем игрока
        const addGuestQuery = `INSERT INTO guest_players (name, avatar, session_id) VALUES (?, ?, ?)`;
        db.run(addGuestQuery, [name, avatar, session_id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to add guest' });

            // Отправляем уведомление всем игрокам в сессии
            io.to(session_id).emit('playerJoined', { name, avatar });
            res.json({ success: true });
        });
    });
});

module.exports = router;


//// backend/routes/session.js
//
//const express = require('express');          // Подключаем Express для создания маршрутов
//const router = express.Router();             // Создаем новый объект маршрутизатора для маршрутов гостевого входа
//const db = require('../database');           // Подключаем SQLite БД через database.js
//const { v4: uuidv4 } = require('uuid');      // Для генерации уникальных ID
//
//router.post('/create-session', (req, res) => {
//    const session_id = uuidv4();
//
//    const query = `INSERT INTO sessions (id, status) VALUES (?, 'waiting')`;
//    db.run(query, [session_id], function(err) {
//        if (err) {
//            console.error(err.message);
//            return res.status(500).json({ error: 'Failed to create session' });
//        }
//
//        res.json({ session_id });
//    });
//});
//
//router.get('/session/:session_id', (req, res) => {
//    const session_id = req.params.session_id;
//
//    if (!session_id) {
//        return res.status(400).json({ error: 'Invalid session ID' });
//    }
//
//    const sessionQuery = `
//        SELECT guest_players.name AS guest_name, guest_players.avatar AS guest_avatar,
//            players.name AS registered_name, players.avatar AS registered_avatar
//        FROM session_players
//        LEFT JOIN guest_players ON session_players.player_id = guest_players.id AND session_players.player_type = 'guest'
//        LEFT JOIN players ON session_players.player_id = players.id AND session_players.player_type = 'registered'
//        WHERE session_players.session_id = ?
//        `;
//
//    db.all(sessionQuery, [session_id], (err, rows) => {
//        if (err) {
//            console.error(err.message);
//            return res.status(500).json({ error: 'Failed to retrieve session data' });
//        }
//
//        const players = row.map(row => ({
//            name: row.guest_name || row.registered_name,
//            avatar: row.guest_avatar || row.registered_avatar
//            type: row.guest_name ? 'guest' : 'registered'
//        }));
//
//        res.json({ session_id, players });
//        })
//    });
//
//module.exports = router;