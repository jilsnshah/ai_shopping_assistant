import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL && !baseURL.endsWith('/api') && baseURL !== '/api') {
    baseURL = `${baseURL.replace(/\/$/, '')}/api`;
}

const api = axios.create({
    baseURL: baseURL,
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
