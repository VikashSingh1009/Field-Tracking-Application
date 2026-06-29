import axios from 'axios';

const API = axios.create({
    baseURL: 'https://field-tracking-application.onrender.com/api', // backend same rehega
   
    timeout: 15000
});



API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});



API.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);



export default API;

