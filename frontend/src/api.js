import axios from 'axios';

// 🤖 DYNAMIC BASE URL: Automatically grabs the current IP address from your browser bar
const currentIP = window.location.hostname;

const api = axios.create({
    baseURL: `http://${currentIP}:5000/api/v1`,
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