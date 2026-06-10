import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Points directly to your App.jsx or App.js
import './index.css';    // Your Tailwind/global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);