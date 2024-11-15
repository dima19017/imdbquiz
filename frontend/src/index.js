// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Используем BrowserRouter
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Включаем future флаг для React Router
root.render(
  <BrowserRouter future={{ v7_startTransition: true }}>
    <App />
  </BrowserRouter>
);
