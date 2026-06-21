import axios from 'axios';

// Detect if the app is running live or locally
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// 🌟 Route cleanly to your true Express backend service container
const baseURL = isProduction
    ? 'https://rentmanagementsystem-production.up.railway.app/api/v1'
    : 'http://localhost:5000/api/v1';

const api = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Hardened Interceptor Layer: Automatically bakes the token into every outbound request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;