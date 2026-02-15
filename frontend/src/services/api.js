// src/services/api.js
// Axios API service — connects to FastAPI backend

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── UPDATE THIS to your machine's IP or deployed URL ──────
// Local development:   'http://10.0.2.2:8000'  (Android emulator)
//                      'http://localhost:8000'  (iOS simulator)
//                      'http://192.168.1.X:8000' (physical device)
// Docker:              'http://localhost:8000'
// Deployed:            'https://your-api.railway.app'
export const BASE_URL = 'http://10.0.2.2:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('weavai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, err => Promise.reject(err));

// Auto-handle 401 — clear session
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['weavai_token', 'weavai_user']);
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────
export const authAPI = {
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  me: () =>
    api.get('/auth/me'),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, new_password) =>
    api.post('/auth/reset-password', { token, new_password }),
};

// ── MEASUREMENTS ──────────────────────────────────────────
export const measureAPI = {
  save: (data) =>
    api.post('/measurements', data),

  getAll: (limit = 10) =>
    api.get(`/measurements?limit=${limit}`),

  getOne: (id) =>
    api.get(`/measurements/${id}`),
};

// ── RECOMMENDATIONS ───────────────────────────────────────
export const recommendAPI = {
  get: (bust, waist, hips, category = 'tops') =>
    api.get('/recommend', { params: { bust, waist, hips, category } }),

  getAllCategories: (bust, waist, hips) =>
    api.get('/recommend/all-categories', { params: { bust, waist, hips } }),

  save: (bust, waist, hips, measurement_id, category = 'tops') =>
    api.post('/recommend/save', null, {
      params: { bust, waist, hips, measurement_id, category }
    }),
};

// ── BRANDS ────────────────────────────────────────────────
export const brandsAPI = {
  getAll: () =>
    api.get('/brands'),

  getSizes: (brandName) =>
    api.get(`/brands/${encodeURIComponent(brandName)}/sizes`),
};

// ── CATEGORIES ────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () =>
    api.get('/categories'),

  getLinks: (slug) =>
    api.get(`/categories/${slug}/links`),
};

// ── FEEDBACK ──────────────────────────────────────────────
export const feedbackAPI = {
  submit: (brand_name, category_slug, recommended_size, actual_fit, notes, rating) =>
    api.post('/feedback', { brand_name, category_slug, recommended_size, actual_fit, notes, rating }),

  getMy: () =>
    api.get('/feedback/my'),
};

// ── HISTORY ───────────────────────────────────────────────
export const historyAPI = {
  get: () => api.get('/history'),
};

// ── HEALTH ────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
