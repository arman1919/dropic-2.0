import axios from 'axios';

const api = axios.create({
  // Используем относительный путь, чтобы работало и локально, и на Vercel
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Добавляем перехватчик запросов
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // Если получаем 401, очищаем токен и перенаправляем на страницу входа
      localStorage.removeItem('userToken');
      // window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
