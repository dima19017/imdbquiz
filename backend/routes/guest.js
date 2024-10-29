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