// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { C, radius, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';
import { measureAPI } from '../services/api';

const BRANDS = ['Nike','Adidas','Puma','H&M','Zara',"Levi's"];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    measureAPI.getAll()
      .then(res => setHistory(res.data.slice(0, 3)))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (user?.name || user?.email || '').split(' ')[0].split('@')[0];
  const initials  = firstName.slice(0, 2).toUpperCase();

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.dot}><Text style={s.dotTxt}>W</Text></View>
          <Text style={s.logoTxt}>WEAV AI</Text>
        </View>
        <View style={s.userRow}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Sign out?','',
            [{text:'Cancel',style:'cancel'},{text:'Sign out',style:'destructive',onPress:logout}])}>
            <Text style={s.signoutTxt}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={s.hero}>
        <View style={s.eyebrowRow}>
          <View style={s.eyebrowLine}/>
          <Text style={s.eyebrow}>YOUR PERSONAL TAILOR</Text>
        </View>
        <Text style={s.heroTitle}>Find Your{'\n'}<Text style={s.heroItalic}>Perfect</Text></Text>
        <Text style={s.heroTitle2}>Fit.</Text>
        <Text style={s.heroDesc}>
          Enter your measurements once. Get your exact size across Nike, Adidas, Puma, H&amp;M, Zara &amp; Levi's — perfectly calibrated, every time.
        </Text>
        <TouchableOpacity style={s.btnDark} onPress={() => navigation.navigate('Measure')}>
          <Text style={s.btnDarkTxt}>BEGIN MEASUREMENT →</Text>
        </TouchableOpacity>
        {history.length > 0 && (
          <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.btnOutlineTxt}>Update My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── History ── */}
      {!loading && history.length > 0 && (
        <View style={s.histCard}>
          <View style={s.histHead}>
            <Text style={s.histTitle}>Previous Profiles</Text>
            <Text style={s.histCount}>{history.length} saved</Text>
          </View>
          {history.map((h, i) => (
            <View key={i} style={s.histItem}>
              <View>
                <Text style={s.histDate}>{formatDate(h.created_at)}</Text>
                <Text style={s.histMeas}>
                  B:{Math.round(h.bust)} W:{Math.round(h.waist)} H:{Math.round(h.hips)} cm
                </Text>
              </View>
              <View style={s.histBodyType}>
                <Text style={s.histBodyTypeTxt}>{h.body_type || '—'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      {loading && <ActivityIndicator color={C.gold} style={{marginTop:20}}/>}

      {/* ── Brand Pills ── */}
      <View style={s.brandsSection}>
        <Text style={s.brandsLbl}>SUPPORTED BRANDS</Text>
        <View style={s.brandPills}>
          {BRANDS.map(b => (
            <View key={b} style={s.brandPill}>
              <Text style={s.brandPillTxt}>{b}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       { flex:1, backgroundColor:C.cream },
  scroll:       { paddingBottom:40 },

  header: {
    paddingTop:56, paddingHorizontal:28, paddingBottom:0,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  logoRow:      { flexDirection:'row', alignItems:'center', gap:9 },
  dot: {
    width:26, height:26, borderRadius:13,
    backgroundColor:C.gold, alignItems:'center', justifyContent:'center',
  },
  dotTxt:       { fontSize:11, fontWeight:'700', color:C.espresso, fontFamily:'serif' },
  logoTxt:      { fontSize:13, fontWeight:'600', letterSpacing:3.5, color:C.espresso },
  userRow:      { alignItems:'flex-end', gap:3 },
  avatar: {
    width:30, height:30, borderRadius:15,
    backgroundColor:C.gold, alignItems:'center', justifyContent:'center',
  },
  avatarTxt:    { fontSize:10, fontWeight:'700', color:C.espresso },
  signoutTxt:   { fontSize:10, color:C.muted, letterSpacing:.5 },

  hero:         { paddingHorizontal:28, paddingTop:36, paddingBottom:8, gap:12 },
  eyebrowRow:   { flexDirection:'row', alignItems:'center', gap:10 },
  eyebrowLine:  { width:20, height:1, backgroundColor:C.gold },
  eyebrow:      { fontSize:10, fontWeight:'700', letterSpacing:3.5, color:C.gold },
  heroTitle:    { fontSize:52, fontWeight:'300', color:C.espresso, lineHeight:52, fontFamily:'serif', letterSpacing:-1 },
  heroItalic:   { fontStyle:'italic', fontWeight:'500', color:C.gold },
  heroTitle2:   { fontSize:40, fontWeight:'300', color:C.bark, fontFamily:'serif', letterSpacing:-1, marginTop:-8 },
  heroDesc:     { fontSize:14, color:C.muted, lineHeight:24, maxWidth:310 },
  btnDark: {
    backgroundColor:C.espresso, borderRadius:radius.sm,
    paddingVertical:16, alignItems:'center', ...shadow.sm,
  },
  btnDarkTxt:   { fontSize:12, fontWeight:'700', letterSpacing:2, color:C.cream },
  btnOutline: {
    borderWidth:1.5, borderColor:C.border, borderRadius:radius.sm,
    paddingVertical:13, alignItems:'center',
  },
  btnOutlineTxt:{ fontSize:12, fontWeight:'600', letterSpacing:1, color:C.bark },

  histCard: {
    marginHorizontal:28, marginTop:16,
    backgroundColor:C.warm, borderRadius:radius.md,
    borderWidth:1, borderColor:C.border, padding:18, gap:10,
  },
  histHead:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  histTitle:    { fontSize:16, fontWeight:'600', color:C.espresso, fontFamily:'serif' },
  histCount:    { fontSize:11, color:C.muted },
  histItem: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    backgroundColor:C.cream, borderRadius:radius.sm,
    borderWidth:1, borderColor:C.border, padding:12,
  },
  histDate:     { fontSize:11, color:C.muted, marginBottom:2 },
  histMeas:     { fontSize:13, color:C.bark, fontWeight:'600' },
  histBodyType: {
    backgroundColor:C.goldDim, borderRadius:100,
    borderWidth:1, borderColor:C.borderGold, paddingHorizontal:10, paddingVertical:3,
  },
  histBodyTypeTxt: { fontSize:10, color:C.gold, fontWeight:'700' },

  brandsSection: { paddingHorizontal:28, marginTop:24 },
  brandsLbl:    { fontSize:10, letterSpacing:3, color:C.muted, fontWeight:'700', marginBottom:10 },
  brandPills:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  brandPill: {
    backgroundColor:C.warm, borderWidth:1, borderColor:C.border,
    borderRadius:100, paddingHorizontal:14, paddingVertical:6,
  },
  brandPillTxt: { fontSize:11, fontWeight:'600', color:C.bark },
});
