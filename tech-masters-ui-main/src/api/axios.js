import axios from 'axios';

// ✅ Automatically switches between your local backend and your live deployed backend!
// If VITE_API_URL is not set (like on your local machine), it defaults to localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL, 
});

// Automatically add the Token to every request if we are logged in
api.interceptors.request.use((config) => {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (error) {
        console.error("Error parsing user token from local storage", error);
    }
    return config;
});

export default api;