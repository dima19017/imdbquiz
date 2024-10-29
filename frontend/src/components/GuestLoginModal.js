// frontend/components/GuestModal.js
import React, { useState } from "react"; // Импорт React и хуков useState для работы с локальным состоянием
// import './GuestLoginModal.css';

const GuestLoginModal = ({ onClose, onLogin }) => { // Компонент принимает 2 пропса для закрытия окна и для обработки данных гостя
    const [name, setName] = useState('');     // Локальное состояние для хранения имени гостя
    const [avatar, setAvatar] = useState(''); // Локальное состояние для хранения url аватара гостя

    const handleLogin = () => { // вызывается при нажатии кнопки "Join Game"
        if (name && avatar) {
            onLogin({ name, avatar});
            onClose();
        } else {
            alert("Please enter a name and choose an avatar.");
        }
    };

    return (
        <div className="modal-backdrop"> {/* обертка модального окна, создающая затемненный фон */}
            <div className="modal-content"> {/* Контент модального окна */}
                <h2>Enter Guest Details</h2> {/* Поле ввода для имени гостя */}
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)} // onChange - событие срабатывает когда значение в поле ввода изменяется. (e) => setName(e.target.value) - обновляет name в компоненте
                />
                <input                                       //Поле ввода для URL аватара
                    type="text"
                    placeholder="Enter avatar URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                />
                <button onClick={handleLogin}>Join Game</button> {/* Кнопка для подтверждения ввода и начала игры */}
                <button onClick={onClose}>Cancel</button> {/* Кнопка для отмены и закрытия модального окна */}
            </div>
        </div>
    );
};

export default GuestLoginModal;