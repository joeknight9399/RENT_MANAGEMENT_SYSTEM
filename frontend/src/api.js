import axios from 'axios';

// 🤖 DYNAMIC BASE URL: Automatically grabs the current IP address from your browser bar
const currentIP = window.location.hostname;

// Checks if the app is running live on Railway or locally on your machine
const isProduction = currentIP !== 'localhost' && currentIP !== '127.0.0.1';

// Automatically picks the correct cloud backend or local backend
// 🌟 FIXED: Points to your active 'disciplined-truth' deployment node
const baseURL = isProduction
    ? 'https://disciplined-truth-production-41bb.up.railway.app/api/v1'
    : `http://${currentIP}:5000/api/v1`;

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true // Crucial for passing secure headers/cookies through CORS safely
});

// Interceptor: Adds the token to EVERY request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('API Warning: No token found in localStorage!');
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;