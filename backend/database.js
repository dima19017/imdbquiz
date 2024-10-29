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
