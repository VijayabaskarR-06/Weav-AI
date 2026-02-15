// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C, radius, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode,   setMode]   = useState('login');
  const [busy,   setBusy]   = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form,   setForm]   = useState({ name:'', email:'', password:'', confirm:'' });
  const [errs,   setErrs]   = useState({});

  const set = (k, v) => { setForm(p => ({...p, [k]:v})); setErrs(p => ({...p, [k]:null})); };

  const validate = () => {
    const e = {};
    if (mode==='signup' && !form.name.trim()) e.name = 'Full name is required';
    if (!form.email.includes('@'))             e.email = 'Enter a valid email address';
    if (form.password.length < 6)             e.password = 'Minimum 6 characters required';
    if (mode==='signup' && form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await signup(form.name.trim(), form.email.trim(), form.password);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Check your connection.';
      Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ label, field, placeholder, secure, keyboard = 'default' }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLbl}>{label}</Text>
      <View style={[s.fieldBox, errs[field] && s.fieldBoxErr]}>
        <TextInput
          style={s.fieldIn}
          placeholder={placeholder}
          placeholderTextColor={C.nude}
          value={form[field]}
          onChangeText={v => set(field, v)}
          secureTextEntry={secure && !showPw}
          keyboardType={keyboard}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          autoCorrect={false}
          returnKeyType={field === 'confirm' ? 'done' : 'next'}
          onSubmitEditing={field === 'confirm' || (mode === 'login' && field === 'password') ? submit : undefined}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPw(p => !p)} style={s.eyeBtn}>
            <Text style={s.eyeTxt}>{showPw ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {errs[field] && <Text style={s.errTxt}>⚠ {errs[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Navy hero panel */}
        <View style={s.hero}>
          {/* Diamond Needle Logo */}
          <View style={s.spinRing}>
            <View style={s.logoCore}>
              <Text style={s.logoW}>W</Text>
            </View>
          </View>
          <Text style={s.wordmark}>WEAV AI</Text>
          <Text style={s.tagline}>Your Personal Tailor</Text>
          <View style={s.demoHint}>
            <Text style={s.demoTxt}>Demo: <Text style={s.demoB}>test@weavai.com</Text> / <Text style={s.demoB}>test123</Text></Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, mode==='login'  && s.tabOn]} onPress={() => { setMode('login');  setErrs({}); }}>
            <Text style={[s.tabTxt, mode==='login'  && s.tabTxtOn]}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, mode==='signup' && s.tabOn]} onPress={() => { setMode('signup'); setErrs({}); }}>
            <Text style={[s.tabTxt, mode==='signup' && s.tabTxtOn]}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>

        <View style={s.form}>
          {mode==='signup' && <Field label="FULL NAME"      field="name"     placeholder="e.g. Ananya Kaushal"/>}
          <Field label="EMAIL ADDRESS" field="email"    placeholder="your@email.com" keyboard="email-address"/>
          <Field label="PASSWORD"      field="password" placeholder="Min. 6 characters" secure/>
          {mode==='signup' && <Field label="CONFIRM PASSWORD" field="confirm" placeholder="Re-enter password" secure/>}

          {mode==='login' && (
            <TouchableOpacity style={s.forgotRow}>
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.btnGold, busy && s.btnDis]} onPress={submit} disabled={busy} activeOpacity={.85}>
            {busy
              ? <ActivityIndicator color={C.navy} size="small"/>
              : <Text style={s.btnGoldTxt}>{mode==='login' ? 'SIGN IN TO WEAV AI →' : 'CREATE MY ACCOUNT →'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.switchRow} onPress={() => { setMode(m => m==='login'?'signup':'login'); setErrs({}); }}>
            <Text style={s.switchTxt}>
              {mode==='login'
                ? <>New to Weav AI? <Text style={s.switchLink}>Create free account</Text></>
                : <>Already have an account? <Text style={s.switchLink}>Sign in</Text></>
              }
            </Text>
          </TouchableOpacity>

          {mode==='signup' && (
            <Text style={s.terms}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
              Your measurements are stored securely and never shared.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex:1, backgroundColor:C.cream },
  scroll: { flexGrow:1 },
  hero: {
    background:'#0D1B2A',
    backgroundColor:'#0D1B2A',
    paddingTop:64, paddingBottom:40,
    alignItems:'center', gap:12,
  },
  spinRing: {
    width:88, height:88, borderRadius:44,
    borderWidth:1.5, borderColor:'rgba(201,168,76,0.22)',
    alignItems:'center', justifyContent:'center',
    marginBottom:4,
  },
  logoCore: {
    width:64, height:64, borderRadius:32,
    backgroundColor:C.gold,
    alignItems:'center', justifyContent:'center',
    ...shadow.md,
  },
  logoW:    { fontFamily:'serif', fontSize:28, fontWeight:'700', color:C.navy },
  wordmark: { fontSize:38, fontWeight:'700', letterSpacing:5, color:C.gold2, fontFamily:'serif' },
  tagline:  { fontSize:13, fontStyle:'italic', color:'rgba(245,237,208,0.45)', letterSpacing:3 },
  demoHint: {
    flexDirection:'row', alignItems:'center',
    backgroundColor:'rgba(201,168,76,0.10)',
    borderWidth:1, borderColor:'rgba(201,168,76,0.18)',
    borderRadius:100, paddingHorizontal:14, paddingVertical:5, marginTop:4,
  },
  demoTxt:  { fontSize:11, color:'rgba(245,237,208,0.55)' },
  demoB:    { color:C.gold2, fontWeight:'700' },

  tabs:   { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:C.cream },
  tab:    { flex:1, paddingVertical:14, alignItems:'center' },
  tabOn:  { borderBottomWidth:2, borderBottomColor:C.gold },
  tabTxt: { fontSize:11, fontWeight:'700', letterSpacing:2, color:C.muted },
  tabTxtOn:{ color:C.navy },

  form:     { padding:24, gap:14 },
  fieldWrap:{ gap:5 },
  fieldLbl: { fontSize:10, fontWeight:'700', letterSpacing:2, color:C.navy3 },
  fieldBox: {
    flexDirection:'row', alignItems:'center',
    borderWidth:1.5, borderColor:C.border,
    borderRadius:radius.sm, backgroundColor:C.cream, overflow:'hidden',
  },
  fieldBoxErr:{ borderColor:C.error },
  fieldIn:  { flex:1, padding:14, fontSize:15, fontWeight:'600', color:'#8B5E2C' },
  eyeBtn:   { padding:12 },
  eyeTxt:   { fontSize:14 },
  errTxt:   { fontSize:11, color:C.error, fontWeight:'600' },

  forgotRow:{ alignItems:'flex-end', marginTop:-6 },
  forgotTxt:{ fontSize:12, color:C.muted },

  btnGold: {
    backgroundColor:C.gold, borderRadius:radius.sm,
    paddingVertical:17, alignItems:'center',
    ...shadow.md,
  },
  btnDis:   { opacity:.65 },
  btnGoldTxt:{ fontSize:13, fontWeight:'700', letterSpacing:2.5, color:C.navy },

  switchRow:{ alignItems:'center', paddingVertical:6 },
  switchTxt:{ fontSize:13, color:C.muted },
  switchLink:{ color:C.gold, fontWeight:'700' },

  terms:  { fontSize:11, color:C.muted, textAlign:'center', lineHeight:17, fontStyle:'italic' },
});
