// frontend/components/MainScreen.js
// Импортируются React и необходимые хуки, LanguageContext для управления языком, стили, и версия из package.json
import React, { useState, useEffect, useContext } from 'react';
import './MainScreen.css';
// import { LanguageContext } from '../contexts/LanguageContext';
import packageJson from '../../package.json';

// инициализация MainScreen const MainScreen = () => { /* код компонента */ };
const MainScreen = () => {
    // const { language, setLanguage } = useContext(LanguageContext);
    const version = packageJson.version;
    // Состояние sessionHash хранит уникальный хэш сессии для использования в течение всей сессии пользователя
    const [sessionHash, setSessionHash] = useState('');

    // Генерация или загрузка хэша сессии
    useEffect(() => {
        let hash = localStorage.getItem('sessionHash');
        if (!hash) {
            hash = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('sessionHash', hash);
        }
        setSessionHash(hash);
    }, []);

    return (
        <div className='main-screen'>
            <div className='top-right-buttons'>
                {/* Кнопка "Main Menu" */}
                <button className='main-menu-button'>Main Menu</button>
                {/* Кнопка профиля */}
                <button className='profile-button'>Profile</button>
            </div>
            {/* Выбор языка */}
            <div className="language-select">
                <label>Language: </label>
                {/* <select value={language} onChange={(e) => setLanguage(e.target.value)}> */}
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                {/* </select> */}
            </div>

            {/* Кнопки "Играть как гость" и "Войти через почту/соцсеть" */}
            <div className='action-buttons'>
                <button className='guest-button'>Play as Guest</button>
                <button className='login-button'>Login via Email/Social</button>
            </div>
            {/* Отображение версии и уникального хэша сессии */}
            <div className="info-footer">
                <span>Version: {version}</span>
                <span>Session: {sessionHash}</span>
            </div>
        </div>
    );
};

export default MainScreen;