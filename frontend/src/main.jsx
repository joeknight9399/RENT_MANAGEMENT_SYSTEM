import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // <--- Force it to point to your routing core
import './index.css';         // Your styles import

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);