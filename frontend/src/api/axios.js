import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy in vite.config.js handles this
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If we get a 401, redirect to login
            // Check if we are already on login page to avoid loops
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
