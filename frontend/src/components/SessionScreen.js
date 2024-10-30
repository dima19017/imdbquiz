// frontend/components/SessionScreen.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

const SessionScreen = () => {
    const { sessionId } = useParams();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        socket.emit('joinSession', sessionId);

        fetch(`/api/session/${sessionId}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.players) {
                    setPlayers(data.players);
                } else {
                    console.error("Unexpected response format:", data);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching session data:', error);
                setLoading(false);
            });

        socket.on('playerJoined', (newPlayer) => {
            setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
        });

        return () => {
            socket.off('playerJoined');
        };
    }, [sessionId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Session ID: {sessionId}</h1>
            <h2>Players in the Session</h2>
            {players.length > 0 ? (
                <ul>
                    {players.map((player, index) => (
                        player && player.name ? ( // Проверка на наличие player и player.name
                            <li key={index}>
                                <strong>Name:</strong> {player.name} <br />
                                <strong>Avatar:</strong> 
                                {player.avatar ? (
                                    <img src={player.avatar} alt="Avatar" width="50" height="50" />
                                ) : (
                                    <span>No Avatar</span>
                                )}
                            </li>
                        ) : (
                            <li key={index}>Invalid player data</li>
                        )
                    ))}
                </ul>
            ) : (
                <p>No players in this session.</p>
            )}
        </div>
    );
};

export default SessionScreen;
