// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import SessionScreen from './components/SessionScreen'; // Подключаем новый компонент

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/session/:sessionId" element={<SessionScreen />} /> {/* Добавляем маршрут для сессии */}
      </Routes>
    </Router>
  );
}

export default App;
