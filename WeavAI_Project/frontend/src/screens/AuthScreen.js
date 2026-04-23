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

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrs(p => ({...p,[k]:null})); };

  const validate = () => {
    const e = {};
    if (mode==='signup' && !form.name.trim()) e.name = 'Full name is required';
    if (!form.email.includes('@'))             e.email = 'Enter a valid email';
    if (form.password.length < 6)             e.password = 'Minimum 6 characters';
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
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ label, field, placeholder, secure, keyboardType }) => (
    <View style={s.fieldGrp}>
      <Text style={s.fieldLbl}>{label}</Text>
      <View style={[s.fieldWrap, errs[field] && s.fieldWrapErr]}>
        <TextInput
          style={s.fieldInp}
          placeholder={placeholder}
          placeholderTextColor={C.nude}
          value={form[field]}
          onChangeText={v => set(field, v)}
          secureTextEntry={secure && !showPw}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
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
    <KeyboardAvoidingView
      style={{flex:1}}
      behavior={Platform.OS==='ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.screen} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Gold Top Panel ── */}
        <View style={s.top}>
          <View style={s.seal}>
            <View style={s.sealInner}>
              <Text style={s.sealLetter}>W</Text>
            </View>
          </View>
          <Text style={s.wordmark}>WEAV AI</Text>
          <Text style={s.tagline}>Your Personal Tailor</Text>
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, mode==='login' && s.tabAct]}   onPress={() => { setMode('login');  setErrs({}); }}>
            <Text style={[s.tabTxt, mode==='login'  && s.tabTxtAct]}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, mode==='signup' && s.tabAct]}  onPress={() => { setMode('signup'); setErrs({}); }}>
            <Text style={[s.tabTxt, mode==='signup' && s.tabTxtAct]}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>

        {/* ── Form ── */}
        <View style={s.body}>
          {mode==='signup' && <Field label="FULL NAME"  field="name"     placeholder="e.g. Ananya Kaushal"/>}
          <Field label="EMAIL ADDRESS" field="email"    placeholder="your@email.com" keyboardType="email-address"/>
          <Field label="PASSWORD"      field="password" placeholder="Minimum 6 characters" secure/>
          {mode==='signup' && <Field label="CONFIRM PASSWORD" field="confirm" placeholder="Re-enter password" secure/>}

          {mode==='login' && (
            <TouchableOpacity style={s.forgotRow}>
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[s.btnGold, busy && s.btnDisabled]} onPress={submit} disabled={busy}>
            {busy
              ? <ActivityIndicator color={C.espresso} size="small"/>
              : <Text style={s.btnGoldTxt}>{mode==='login' ? 'SIGN IN TO WEAV AI →' : 'CREATE MY ACCOUNT →'}</Text>
            }
          </TouchableOpacity>

          <View style={s.divRow}>
            <View style={s.divLn}/><Text style={s.divTxt}>or</Text><View style={s.divLn}/>
          </View>

          <TouchableOpacity
            style={s.authSwitch}
            onPress={() => { setMode(m => m==='login'?'signup':'login'); setErrs({}); }}
          >
            <Text style={s.switchTxt}>
              {mode==='login'
                ? <Text>New to Weav AI? <Text style={s.switchLink}>Create free account</Text></Text>
                : <Text>Already have an account? <Text style={s.switchLink}>Sign in</Text></Text>
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
  screen:       { flex:1, backgroundColor:C.cream },
  scroll:       { flexGrow:1 },

  // Top gold-espresso panel
  top: {
    backgroundColor:'#1E120A',
    paddingTop:72, paddingBottom:44,
    alignItems:'center',
  },
  seal: {
    width:76, height:76, borderRadius:38,
    borderWidth:1.5, borderColor:'rgba(201,168,76,0.3)',
    backgroundColor:'rgba(201,168,76,0.07)',
    alignItems:'center', justifyContent:'center',
    marginBottom:18,
  },
  sealInner: {
    width:54, height:54, borderRadius:27,
    backgroundColor:C.gold,
    alignItems:'center', justifyContent:'center',
    ...shadow.md,
  },
  sealLetter:   { fontSize:24, fontWeight:'700', color:C.espresso, fontFamily:'serif' },
  wordmark: {
    fontSize:32, fontWeight:'300', letterSpacing:8,
    color:C.goldLight, fontFamily:'serif',
    marginBottom:6,
  },
  tagline:      { fontSize:13, fontStyle:'italic', color:'rgba(245,237,208,0.45)', letterSpacing:2 },

  // Tabs
  tabs:         { flexDirection:'row', borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:C.cream },
  tab:          { flex:1, paddingVertical:15, alignItems:'center', position:'relative' },
  tabAct:       { borderBottomWidth:2, borderBottomColor:C.gold },
  tabTxt:       { fontSize:11, fontWeight:'700', letterSpacing:2, color:C.muted },
  tabTxtAct:    { color:C.espresso },

  // Form body
  body:         { padding:28, gap:16 },

  fieldGrp:     { gap:5 },
  fieldLbl:     { fontSize:10, fontWeight:'700', letterSpacing:2, color:C.sienna },
  fieldWrap: {
    flexDirection:'row', alignItems:'center',
    borderWidth:1.5, borderColor:C.border,
    borderRadius:radius.sm, backgroundColor:C.cream,
    overflow:'hidden',
  },
  fieldWrapErr: { borderColor:C.error },
  fieldInp:     { flex:1, padding:15, fontSize:15, color:C.espresso },
  eyeBtn:       { padding:14 },
  eyeTxt:       { fontSize:14, color:C.muted },
  errTxt:       { fontSize:11, color:C.error, fontWeight:'500' },

  forgotRow:    { alignItems:'flex-end' },
  forgotTxt:    { fontSize:12, color:C.muted },

  btnGold: {
    backgroundColor:C.gold, borderRadius:radius.sm,
    paddingVertical:17, alignItems:'center',
    ...shadow.md,
  },
  btnDisabled:  { opacity:0.7 },
  btnGoldTxt:   { fontSize:12, fontWeight:'700', letterSpacing:2, color:C.espresso },

  divRow:       { flexDirection:'row', alignItems:'center', gap:12 },
  divLn:        { flex:1, height:1, backgroundColor:C.border },
  divTxt:       { fontSize:11, color:C.muted, letterSpacing:1, fontWeight:'600' },

  authSwitch:   { alignItems:'center' },
  switchTxt:    { fontSize:13, color:C.muted },
  switchLink:   { color:C.gold, fontWeight:'700' },

  terms:        { fontSize:11, color:C.muted, textAlign:'center', lineHeight:18, fontStyle:'italic' },
});
