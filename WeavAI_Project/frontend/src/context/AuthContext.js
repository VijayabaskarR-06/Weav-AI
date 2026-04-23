// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on app start
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

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: tk, user: u } = res.data;
    await AsyncStorage.setItem('weavai_token', tk);
    await AsyncStorage.setItem('weavai_user',  JSON.stringify(u));
    setToken(tk);
    setUser(u);
    return u;
  };

  const signup = async (name, email, password) => {
    const res = await authAPI.signup(name, email, password);
    const { token: tk, user: u } = res.data;
    await AsyncStorage.setItem('weavai_token', tk);
    await AsyncStorage.setItem('weavai_user',  JSON.stringify(u));
    setToken(tk);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('weavai_token');
    await AsyncStorage.removeItem('weavai_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
