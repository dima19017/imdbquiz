// backend/server.js
const express = require('express');
const router = express.Router();
const guestRoutes = require('./routes/guest');

router.use('/api', guestRoutes);       // Добавляем маршруты для гостевого входа

module.exports = router;