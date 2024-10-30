// backend/database.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../data/imdbquiz.db');

// Создание таблиц, если они не существуют
db.serialize(() => {
    // Таблица для хранения информации о сессиях
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,           -- Уникальный идентификатор сессии
            status TEXT DEFAULT 'waiting', -- Статус сессии (например, 'waiting', 'active', 'completed')
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица для хранения информации о гостевых игроках
    db.run(`
        CREATE TABLE IF NOT EXISTS guest_players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,            -- Имя гостевого игрока
            avatar TEXT,                   -- URL аватара игрока
            session_id TEXT NOT NULL,      -- Идентификатор сессии, к которой принадлежит игрок
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
    `);
});

module.exports = db;
