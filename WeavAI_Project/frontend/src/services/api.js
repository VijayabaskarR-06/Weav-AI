// src/services/api.js
// Axios API service — connects to FastAPI backend

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// BASE_URL is read from app.json → expo.extra.apiBaseUrl.
// Update that value to your machine's LAN IP so a physical phone running Expo
// Go can reach the FastAPI backend (e.g. http://10.20.17.10:8000).
export const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
  'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('weavai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle 401 — clear token and redirect
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('weavai_token');
      await AsyncStorage.removeItem('weavai_user');
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────
export const authAPI = {
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
};

// ── Measurements ─────────────────────────────────────────────────
export const measureAPI = {
  save: (data) => api.post('/measurements', data),
  getAll: ()   => api.get('/measurements'),
};

// ── Recommendations ──────────────────────────────────────────────
export const recommendAPI = {
  get: (bust, waist, hips, category = 'tops') =>
    api.get('/recommend', { params: { bust, waist, hips, category } }),
};

// ── Brands ───────────────────────────────────────────────────────
export const brandsAPI = {
  getAll: () => api.get('/brands'),
};

// ── Feedback ─────────────────────────────────────────────────────
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
};

export default api;

