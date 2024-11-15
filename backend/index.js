// backend/index.js
const server = require('./server');  // Импортируем сервер из server.js

// Запускаем сервер
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
