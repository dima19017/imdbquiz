// frontend/src/HomePage.js
import React from 'react';
import Layout from './Layout';  // Подключаем Layout

const HomePage = () => {
  return (
    <Layout>
      <h1>Welcome to the Quiz Game!</h1>
      {/* Кнопки для создания игры и присоединения к игре */}
      <div className="game-buttons">
        <button className="btn btn-create">Create Game</button>
        <button className="btn btn-join">Join Game</button>
      </div>
    </Layout>
  );
};

export default HomePage;
