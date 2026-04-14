// src/screens/HomeScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { C, radius, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';
import { measureAPI, healthAPI } from '../services/api';

const BRANDS = ['Nike','Adidas','Puma','H&M','Zara',"Levi's"];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [dbOnline,  setDbOnline]  = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [hRes, hRes2] = await Promise.all([
        measureAPI.getAll(3),
        healthAPI.check().catch(() => ({ data: { status:'unhealthy' } })),
      ]);
      setHistory(hRes.data.measurements || []);
      setDbOnline(hRes2.data.status === 'healthy');
    } catch (err) {
      setDbOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };
  const firstName = (user?.name || user?.email || '').split(' ')[0].split('@')[0];
  const initials  = firstName.slice(0, 2).toUpperCase();
  const fmtDate   = (iso) => iso ? new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—';

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ paddingBottom:40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold}/>}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.dot}><Text style={s.dotTxt}>W</Text></View>
          <Text style={s.brand}>WEAV AI</Text>
        </View>
        <View style={s.userArea}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initials}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Sign Out','Are you sure?',[
            {text:'Cancel',style:'cancel'},
            {text:'Sign Out',style:'destructive',onPress:logout}
          ])}>
            <Text style={s.soTxt}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DB Status */}
      {dbOnline !== null && (
        <View style={[s.dbBanner, dbOnline ? s.dbOk : s.dbErr]}>
          <View style={[s.dbDot, { backgroundColor: dbOnline ? C.success : C.error }]}/>
          <Text style={[s.dbTxt, { color: dbOnline ? C.success : C.error }]}>
            {dbOnline ? 'MySQL Database · Connected' : 'Database offline — check backend'}
          </Text>
        </View>
      )}

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.ey}>Your Personal Tailor</Text>
        <Text style={s.title}>Find Your{'\n'}<Text style={s.titleGold}>Perfect</Text></Text>
        <Text style={s.title2}>Fit.</Text>

        <View style={s.statsRow}>
          <View style={s.statChip}><Text style={s.statNum}>6</Text><Text style={s.statLbl}>Brands</Text></View>
          <View style={s.statChip}><Text style={s.statNum}>8</Text><Text style={s.statLbl}>Categories</Text></View>
          <View style={s.statChip}><Text style={s.statNum}>95%</Text><Text style={s.statLbl}>Accuracy</Text></View>
        </View>

        <Text style={s.desc}>One measurement profile. Your exact size across Nike, Adidas, Puma, H&M, Zara & Levi's.</Text>

        <TouchableOpacity style={s.btnNavy} onPress={() => navigation.navigate('Measure')}>
          <Text style={s.btnNavyTxt}>BEGIN MEASUREMENT →</Text>
        </TouchableOpacity>
        {history.length > 0 && (
          <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.btnOutlineTxt}>Update My Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Measurement history from DB */}
      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop:24 }}/>
      ) : history.length > 0 ? (
        <View style={s.histCard}>
          <View style={s.histHead}>
            <Text style={s.histTitle}>My Saved Profiles</Text>
            <Text style={s.histCount}>{history.length} saved in DB</Text>
          </View>
          {history.map((h, i) => (
            <TouchableOpacity
              key={h.id || i}
              style={s.histItem}
              onPress={() => navigation.navigate('Results', {
                measurements: { bust:parseFloat(h.bust), waist:parseFloat(h.waist), hips:parseFloat(h.hips), height:parseFloat(h.height||0), unit:h.unit||'cm', bodyType:h.body_type||'—' },
                measurementId: h.id,
              })}
            >
              <View>
                <Text style={s.histDate}>{fmtDate(h.created_at)}</Text>
                <Text style={s.histMeas}>
                  B:{Math.round(h.bust||0)} W:{Math.round(h.waist||0)} H:{Math.round(h.hips||0)} cm
                </Text>
                {h.body_type && <Text style={s.histBt}>{h.body_type}</Text>}
              </View>
              <Text style={s.histArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Brand pills */}
      <View style={s.brandsSection}>
        <Text style={s.brandsLbl}>SUPPORTED BRANDS</Text>
        <View style={s.brandPills}>
          {BRANDS.map(b => <View key={b} style={s.pill}><Text style={s.pillTxt}>{b}</Text></View>)}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:C.cream },
  header:{ paddingTop:52,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  logoRow:{ flexDirection:'row',alignItems:'center',gap:9 },
  dot:{ width:28,height:28,borderRadius:8,backgroundColor:C.gold,alignItems:'center',justifyContent:'center' },
  dotTxt:{ fontFamily:'serif',fontSize:13,fontWeight:'700',color:C.navy },
  brand:{ fontFamily:'serif',fontSize:17,fontWeight:'700',letterSpacing:4,color:C.navy },
  userArea:{ alignItems:'flex-end',gap:3 },
  avatar:{ width:28,height:28,borderRadius:14,backgroundColor:C.navy,alignItems:'center',justifyContent:'center' },
  avatarTxt:{ fontSize:10,fontWeight:'700',color:'#fff' },
  soTxt:{ fontSize:10,color:C.muted },
  dbBanner:{ flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:24,paddingVertical:7,marginTop:8 },
  dbOk:{ backgroundColor:'rgba(26,107,74,0.06)' }, dbErr:{ backgroundColor:'rgba(192,57,43,0.06)' },
  dbDot:{ width:6,height:6,borderRadius:3 },
  dbTxt:{ fontSize:11,fontWeight:'700',letterSpacing:1 },
  hero:{ paddingHorizontal:24,paddingTop:28,paddingBottom:8,gap:10 },
  ey:{ fontSize:10,letterSpacing:4,color:C.gold,fontWeight:'700',textTransform:'uppercase' },
  title:{ fontFamily:'serif',fontSize:54,fontWeight:'700',lineHeight:50,letterSpacing:-1.5,color:C.navy },
  titleGold:{ fontStyle:'italic',color:C.gold },
  title2:{ fontFamily:'serif',fontSize:44,fontWeight:'700',color:C.navy2,letterSpacing:-1.5,marginTop:-6 },
  statsRow:{ flexDirection:'row',gap:8 },
  statChip:{ flex:1,backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:radius.sm,padding:12,alignItems:'center' },
  statNum:{ fontFamily:'serif',fontSize:22,fontWeight:'700',color:C.navy },
  statLbl:{ fontSize:10,color:C.muted,fontWeight:'600',letterSpacing:.5 },
  desc:{ fontSize:14,color:C.muted,lineHeight:22 },
  btnNavy:{ backgroundColor:C.navy,borderRadius:radius.sm,paddingVertical:16,alignItems:'center',...shadow.sm },
  btnNavyTxt:{ fontSize:13,fontWeight:'700',letterSpacing:2.5,color:C.cream },
  btnOutline:{ borderWidth:1.5,borderColor:C.border,borderRadius:radius.sm,paddingVertical:13,alignItems:'center' },
  btnOutlineTxt:{ fontSize:13,fontWeight:'600',letterSpacing:1,color:C.navy2 },
  histCard:{ marginHorizontal:24,marginTop:16,backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:radius.md,padding:16,gap:8 },
  histHead:{ flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4 },
  histTitle:{ fontFamily:'serif',fontSize:16,fontWeight:'700',color:C.navy },
  histCount:{ fontSize:11,color:C.muted },
  histItem:{ backgroundColor:C.cream,borderWidth:1,borderColor:C.border,borderRadius:radius.sm,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  histDate:{ fontSize:11,color:C.muted,marginBottom:2 },
  histMeas:{ fontSize:13,fontWeight:'700',color:C.navy },
  histBt:{ fontSize:11,color:C.muted,marginTop:1 },
  histArrow:{ fontSize:20,color:C.gold },
  brandsSection:{ paddingHorizontal:24,marginTop:20 },
  brandsLbl:{ fontSize:10,letterSpacing:3,color:C.muted,fontWeight:'700',marginBottom:10 },
  brandPills:{ flexDirection:'row',flexWrap:'wrap',gap:7 },
  pill:{ backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:100,paddingHorizontal:14,paddingVertical:6 },
  pillTxt:{ fontSize:12,fontWeight:'600',color:C.navy2 },
});
