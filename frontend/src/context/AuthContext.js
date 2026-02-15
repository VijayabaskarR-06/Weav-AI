// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await AsyncStorage.getItem('weavai_token');
        const savedUser  = await AsyncStorage.getItem('weavai_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: tk, user: u } = res.data;
    await AsyncStorage.setItem('weavai_token', tk);
    await AsyncStorage.setItem('weavai_user',  JSON.stringify(u));
    setToken(tk);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const res = await authAPI.signup(name, email, password);
    const { token: tk, user: u } = res.data;
    await AsyncStorage.setItem('weavai_token', tk);
    await AsyncStorage.setItem('weavai_user',  JSON.stringify(u));
    setToken(tk);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['weavai_token', 'weavai_user']);
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
      await AsyncStorage.setItem('weavai_user', JSON.stringify(res.data));
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
