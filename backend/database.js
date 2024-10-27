// Здесь создается подключение к базе данных imdbquiz.db, которая хранится в папке data.
// Если файл imdbquiz.db отсутствует, SQLite создаст его
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/imdbquiz.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT, email TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, playerId INTEGER, startTime TEXT, FOREIGN KEY(playerId) REFERENCES players(id))");
  db.run("CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY, sessionId INTEGER, score INTEGER, FOREIGN KEY(sessionId) REFERENCES sessions(id))");
});

// Этот модуль экспортирует объект db, что позволяет другим файлам взаимодействовать с базой данных через этот подключенный файл
module.exports = db;
