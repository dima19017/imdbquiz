// backend/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Импортируем CORS
const app = express();
const db = require('./database');
const sessionRoutes = require('./routes/session');
const guestRoutes = require('./routes/guest');
const PORT = process.env.PORT || 3000;

// Настройки CORS
app.use(cors({
    origin: 'http://localhost:3001', // Разрешаем запросы только с этого источника
    methods: ['GET', 'POST'],        // Указываем допустимые HTTP методы
    credentials: true                // Разрешаем передачу кук
}));

app.use(express.json());
app.use('/api', sessionRoutes);
app.use('/api', guestRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3001', // Настройки CORS для Socket.IO
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinSession', (sessionId) => {
        socket.join(sessionId);
        io.to(sessionId).emit('playerJoined');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, io };
