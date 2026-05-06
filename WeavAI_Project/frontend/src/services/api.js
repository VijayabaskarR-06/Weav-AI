
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
export const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
  'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('weavai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
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
export const authAPI = {
  signup: (name, email, password) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
};
export const measureAPI = {
  save: (data) => api.post('/measurements', data),
  getAll: ()   => api.get('/measurements'),
};
export const recommendAPI = {
  get: (bust, waist, hips, category = 'tops', gender = 'female') =>
    api.get('/recommend', { params: { bust, waist, hips, category, gender } }),
};
export const brandsAPI = {
  getAll: () => api.get('/brands'),
};
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
};

export default api;

