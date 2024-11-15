// frontend/src/components/Layout.js
import React from 'react';
import { Link } from 'react-router-dom'; // Для маршрутизации (если нужно)
import './Layout.css'; // Подключаем стили

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          {/* Переключатель языка */}
          <div className="language-switcher">
            <img src="rus.png" alt="Русский" className="language-icon" />
            <img src="en.png" alt="English" className="language-icon" />
          </div>
        </div>
        <div className="header-right">
          {/* Главное меню */}
          <button className="menu-button">Main Menu</button>

          {/* Кнопка профиля */}
          <Link to="/profile">
            <button className="profile-button">
              <img src="path-to-profile-icon.png" alt="Profile" className="profile-icon" />
            </button>
          </Link>

          {/* Кнопка для авторизации, если пользователь не авторизован */}
          <Link to="/login">
            <button className="profile-button">
              <img src="path-to-empty-profile-icon.png" alt="Login" className="profile-icon" />
            </button>
          </Link>
        </div>
      </header>

      {/* Контент (передается как children) */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-right">
          <span>&copy; 2024 Your Website. All Rights Reserved.</span>
          <a href="https://github.com/yourgithub" target="_blank" rel="noopener noreferrer" className="github-link">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
