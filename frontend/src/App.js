// frontend/src/App.js
import React from 'react';
import { Route, Routes } from 'react-router-dom';  // Используем Routes вместо Switch
import HomePage from './components/HomePage'; // Импортируем компонент главной страницы

const App = () => {
  return (
    <div className="App">
      <Routes>
        {/* Определяем маршруты */}
        <Route exact path="/" element={<HomePage />} />  {/* Главная страница */}
        {/* Другие маршруты можно добавить здесь */}
      </Routes>
    </div>
  );
};

export default App;
