// frontend/components/MainScreen.js
import React, { useState, useEffect, useContext } from 'react'; // Импортируются React и необходимые хуки, LanguageContext для управления языком, стили, и версия из package.json
import './MainScreen.css';
import packageJson from '../../package.json';
import GuestLoginModal from './GuestLoginModal';                // Импортируем компонент вызова окна гостя
// import { LanguageContext } from '../contexts/LanguageContext';

const MainScreen = () => {                                  // инициализация MainScreen const MainScreen = () => { /* код компонента */ };
    const version = packageJson.version;                    // const { language, setLanguage } = useContext(LanguageContext);
    const [sessionHash, setSessionHash] = useState('');     // Состояние sessionHash хранит уникальный хэш сессии для использования в течение всей сессии пользователя
    const [showModal, setShowModal] = useState(false);      // Состояние для управления показом модального окна

    useEffect(() => {                                       // Генерация или загрузка хэша сессии
        let hash = localStorage.getItem('sessionHash');
        if (!hash) {
            hash = Math.random().toString(36).substring(2, 9);
            localStorage.setItem('sessionHash', hash);
        }
        setSessionHash(hash);
    }, []);

    const handleGuestLogin = (guestData) => {                          //функция для обработки гостевого входа, получает данные гостя
        fetch('/api/guest-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestData),
        })
        .then(Response => Response.json())
        .then(data => {
            console.log('Guest added:', data);
            // Здесь будем реализовывать переход в игровую комнату
        })
        .catch(error => console.error('Error:', error));
    };

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
                <button className='guest-button' onClick={() => setShowModal(true)}>Play as Guest</button> {/* При нажатии на Play as Guest открывается модальное окно */}
                <button className='login-button'>Login via Email/Social</button>
            </div>
            {/* Отображение версии и уникального хэша сессии */}
            <div className="info-footer">
                <span>Version: {version}</span>
                <span>Session: {sessionHash}</span>
            </div>

            {showModal && <GuestLoginModal onClose={() => setShowModal(false)} onLogin={handleGuestLogin} />} {/* Рендеринг модального окна, если showModal true */}
        </div>
    );
};

export default MainScreen;