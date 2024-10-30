import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

const GuestLoginModal = ({ onClose }) => {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(true);
    const [sessionInput, setSessionInput] = useState('');
    const navigate = useNavigate();

    const handleLogin = () => {
        console.log("Attempting to login with:", { name, avatar, isCreatingRoom, sessionInput });
        
        if (!name || !avatar) {
            alert("Please enter a name and choose an avatar.");
            return;
        }
    
        if (isCreatingRoom) {
            console.log("Creating a new session...");
            fetch('/api/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar })
            })
            .then(response => response.json())
            .then(data => {
                const session_id = data.session_id;
                console.log("Navigating to session with ID:", session_id); // Проверка перед navigate
                navigate(`/session/${session_id}`); // Навигация к сессии
                console.log("Navigation should have triggered"); // Проверка после navigate
            })
            .catch(error => console.error('Error creating session:', error));
        } else {
            const session_id = sessionInput.trim();
            if (!session_id) {
                alert("Please enter a valid session ID.");
                return;
            }
    
            console.log("Joining an existing session with ID:", session_id);
            fetch('/api/join-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatar, session_id })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Navigating to session with ID:", session_id); // Проверка перед navigate
                    navigate(`/session/${session_id}`);
                    console.log("Navigation should have triggered"); // Проверка после navigate
                } else {
                    alert(data.error);
                }
            })
            .catch(error => console.error('Error joining session:', error));
        }
    };
    

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Enter Guest Details</h2>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Enter avatar URL"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                />

                <div>
                    <label>
                        <input
                            type="radio"
                            checked={isCreatingRoom}
                            onChange={() => setIsCreatingRoom(true)}
                        />
                        Create Room
                    </label>
                    <label>
                        <input
                            type="radio"
                            checked={!isCreatingRoom}
                            onChange={() => setIsCreatingRoom(false)}
                        />
                        Join Room
                    </label>
                </div>

                {!isCreatingRoom && (
                    <input
                        type="text"
                        placeholder="Enter session ID"
                        value={sessionInput}
                        onChange={(e) => setSessionInput(e.target.value)}
                    />
                )}

                <button onClick={handleLogin}>Confirm</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default GuestLoginModal;
