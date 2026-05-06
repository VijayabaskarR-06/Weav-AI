import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { C, radius, shadow } from '../theme';
import { measureAPI, recommendAPI } from '../services/api';

const TOTAL = 4;
const BODY_TYPES_FEMALE = [
  {id:'Hourglass',icon:'⌛'}, {id:'Pear',icon:'🍐'},
  {id:'Apple',icon:'🍎'},     {id:'Rectangle',icon:'▭'},
  {id:'Athletic',icon:'⚡'},  {id:'Curvy',icon:'〜'},
];
const BODY_TYPES_MALE = [
  {id:'Trapezoid',icon:'◆'},        {id:'Inverted Triangle',icon:'▽'},
  {id:'Rectangle',icon:'▭'},        {id:'Triangle',icon:'△'},
  {id:'Athletic',icon:'⚡'},        {id:'Oval',icon:'○'},
];

const FI = ({
  label, field, ph, hint, keyboardType = 'numeric',
  value, onChange, error, unit,
}) => (
  <View style={s.fieldGrp}>
    <Text style={s.fieldLbl}>{label}</Text>
    <View style={[s.fieldWrap, error && s.fieldErr]}>
      <TextInput
        style={s.fieldNum}
        placeholder={ph}
        placeholderTextColor={C.nude}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        returnKeyType="done"
      />
      <View style={s.fieldUnit}>
        <Text style={s.fieldUnitTxt}>
          {field === 'weight' ? (unit === 'cm' ? 'kg' : 'lbs') : unit}
        </Text>
      </View>
    </View>
    {error && <Text style={s.errTxt}>⚠ {error}</Text>}
    {hint && <Text style={s.hintTxt}>{hint}</Text>}
  </View>
);

export default function MeasureScreen({ navigation }) {
  const [step,  setStep]  = useState(1);
  const [unit,  setUnit]  = useState('cm');
  const [busy,  setBusy]  = useState(false);
  const [errs,  setErrs]  = useState({});
  const [form,  setForm]  = useState({
    gender:'',
    height:'', weight:'', age:'',
    bust:'', waist:'', hips:'',
    bodyType:'',
  });

  const isMale  = form.gender === 'male';
  const bodyTypes = isMale ? BODY_TYPES_MALE : BODY_TYPES_FEMALE;
  const bustLabel = isMale ? 'CHEST' : 'BUST / CHEST';

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrs(p => ({...p,[k]:null})); };
  const toCm = v => unit==='in'  ? (parseFloat(v)||0)*2.54     : (parseFloat(v)||0);
  const toKg = v => unit==='lbs' ? (parseFloat(v)||0)*0.453592 : (parseFloat(v)||0);

  const validate = () => {
    const e = {};
    if (step===1) {
      if (!form.gender) e.gender='Please select your gender';
    }
    if (step===2) {
      if (!form.height) e.height='Required';
      if (!form.weight) e.weight='Required';
      if (!form.age)    e.age   ='Required';
    }
    if (step===3) {
      if (!form.bust)  e.bust ='Required';
      if (!form.waist) e.waist='Required';
      if (!form.hips)  e.hips ='Required';
    }
    setErrs(e);
    return Object.keys(e).length===0;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < TOTAL) { setStep(s => s+1); return; }
    setBusy(true);
    const payload = {
      bust:   toCm(form.bust),
      waist:  toCm(form.waist),
      hips:   toCm(form.hips),
      height: toCm(form.height),
      weight: toKg(form.weight),
      age:    parseInt(form.age)||0,
      body_type: form.bodyType || 'Not specified',
      gender: form.gender,
      unit,
    };
    try {
      await measureAPI.save(payload);
      const res = await recommendAPI.get(
        payload.bust, payload.waist, payload.hips, 'tops', payload.gender
      );
      navigation.navigate('Results', {
        measurements:    payload,
        recommendations: res.data.recommendations,
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const fiProps = (field) => ({
    field,
    value: form[field],
    onChange: (v) => set(field, v),
    error: errs[field],
    unit,
  });

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={s.screen}>

        
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={step===1 ? ()=>navigation.goBack() : ()=>setStep(s=>s-1)}
          >
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.stepCtr}>{step} / {TOTAL}</Text>
          {step < TOTAL
            ? <TouchableOpacity onPress={() => setStep(s=>s+1)}><Text style={s.skipTxt}>Skip</Text></TouchableOpacity>
            : <View style={{width:40}}/>
          }
        </View>

        
        <View style={s.progTrack}>
          {Array.from({length:TOTAL}).map((_,i) => (
            <View key={i} style={[s.progSeg, i<step ? s.progDone : i===step-1 ? s.progActive : null]}/>
          ))}
        </View>


        <View style={s.head}>
          <Text style={s.headEy}>
            {step===1?'WHO ARE YOU':step===2?'BASIC DETAILS':step===3?'BODY MEASUREMENTS':'BODY TYPE'}
          </Text>
          <Text style={s.headTitle}>
            {step===1?'Tell us your gender':step===2?'Tell us about yourself':step===3?'Your measurements':'Your body type'}
          </Text>
          <Text style={s.headSub}>
            {step===1?'So we show you only the right brand pages and size charts.':
             step===2?'Helps calibrate your size across every brand.':
             step===3?'Measure in a relaxed posture for accuracy.':
             'Optional — helps fine-tune your recommendations.'}
          </Text>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.bodyContent} keyboardShouldPersistTaps="handled">
          {step===1 && (
            <>
              <View style={s.genderRow}>
                {[
                  {id:'female', label:'Women', sub:'Tops, dresses, sports bras, bottoms', icon:'♀'},
                  {id:'male',   label:'Men',   sub:'T-shirts, shirts, jeans, hoodies',    icon:'♂'},
                ].map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[s.genderCard, form.gender===g.id && s.genderCardSel]}
                    onPress={() => set('gender', g.id)}
                  >
                    <Text style={[s.genderIcon, form.gender===g.id && s.genderIconSel]}>{g.icon}</Text>
                    <Text style={[s.genderLabel, form.gender===g.id && s.genderLabelSel]}>{g.label}</Text>
                    <Text style={s.genderSub}>{g.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errs.gender && <Text style={s.errTxt}>⚠ {errs.gender}</Text>}
              <View style={s.tipBox}>
                <Text style={s.tipTxt}>✦  Sizing differs between men's and women's clothing — picking the right one is essential for accurate matches.</Text>
              </View>
            </>
          )}

          {step===2 && (
            <>

              <View style={s.unitRow}>
                <Text style={s.unitLbl}>Units of measure</Text>
                <View style={s.unitPills}>
                  <TouchableOpacity style={[s.uPill, unit==='cm'&&s.uPillAct]} onPress={()=>setUnit('cm')}>
                    <Text style={[s.uPillTxt, unit==='cm'&&s.uPillTxtAct]}>cm / kg</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.uPill, unit==='in'&&s.uPillAct]} onPress={()=>setUnit('in')}>
                    <Text style={[s.uPillTxt, unit==='in'&&s.uPillTxtAct]}>in / lbs</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <FI label="HEIGHT"  ph={unit==='cm'?'165':'65'}  hint="Standing height without shoes" {...fiProps('height')}/>
              <View style={s.twoCol}>
                <View style={{flex:1}}><FI label="WEIGHT" ph={unit==='cm'?'60':'132'} {...fiProps('weight')}/></View>
                <View style={{flex:1}}><FI label="AGE"    ph="26" {...fiProps('age')}/></View>
              </View>
              <View style={s.tipBox}>
                <Text style={s.tipTxt}>✦  Your data is stored securely in our MySQL database and never shared.</Text>
              </View>
            </>
          )}

          {step===3 && (
            <>

              <View style={s.guideCard}>
                <View style={s.guideLegend}>
                  {[
                    {color:'#C9A84C',label:isMale?'Chest':'Bust',sub:isMale?'Fullest part of chest':'Fullest part of bust'},
                    {color:'#8B5E2C',label:'Waist',sub:'Narrowest point'},
                    {color:'#1E120A',label:'Hips',sub:'Widest point'},
                  ].map(({color,label,sub}) => (
                    <View key={label} style={s.legItem}>
                      <View style={[s.legDot,{backgroundColor:color}]}/>
                      <View>
                        <Text style={s.legTxt}>{label}</Text>
                        <Text style={s.legSub}>{sub}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              <FI label={bustLabel}    ph={unit==='cm'?(isMale?'96':'88'):(isMale?'38':'34.5')} hint="Keep tape parallel to the ground" {...fiProps('bust')}/>
              <FI label="WAIST"        ph={unit==='cm'?(isMale?'82':'70'):(isMale?'32':'27.5')} hint="At the natural waistline" {...fiProps('waist')}/>
              <FI label="HIPS"         ph={unit==='cm'?(isMale?'98':'96'):(isMale?'38.5':'37.5')} hint="Stand with feet together" {...fiProps('hips')}/>
            </>
          )}

          {step===4 && (
            <>
              <View style={s.bodyGrid}>
                {bodyTypes.map(bt => (
                  <TouchableOpacity
                    key={bt.id}
                    style={[s.bodyCard, form.bodyType===bt.id && s.bodyCardSel]}
                    onPress={() => set('bodyType', bt.id)}
                  >
                    <Text style={s.bodyIc}>{bt.icon}</Text>
                    <Text style={[s.bodyNm, form.bodyType===bt.id && s.bodyNmSel]}>{bt.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.tipBox}>
                <Text style={s.tipTxt}>◇  Your measurements alone are enough. Body type further refines the fit.</Text>
              </View>
            </>
          )}
        </ScrollView>

        
        <View style={s.foot}>
          <TouchableOpacity style={[s.btnGold, busy&&s.btnDisabled]} onPress={next} disabled={busy}>
            {busy
              ? <ActivityIndicator color={C.espresso} size="small"/>
              : <Text style={s.btnGoldTxt}>
                  {step===TOTAL?'GENERATE & SAVE MY PROFILE →':'CONTINUE →'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex:1, backgroundColor:C.cream },
  topBar: {
    paddingTop:56, paddingHorizontal:24, paddingBottom:0,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  backBtn: {
    width:38, height:38, borderRadius:19,
    borderWidth:1.5, borderColor:C.border,
    alignItems:'center', justifyContent:'center',
  },
  backTxt:      { fontSize:16, color:C.espresso },
  stepCtr:      { fontSize:10, letterSpacing:2.5, color:C.muted, fontWeight:'700' },
  skipTxt:      { fontSize:12, color:C.muted },

  progTrack:    { flexDirection:'row', gap:4, paddingHorizontal:24, marginTop:18 },
  progSeg:      { flex:1, height:1.5, backgroundColor:C.nude, borderRadius:100 },
  progDone:     { backgroundColor:C.gold },
  progActive:   { backgroundColor:C.goldLight },

  head:         { paddingHorizontal:24, marginTop:20 },
  headEy:       { fontSize:10, letterSpacing:3, color:C.gold, fontWeight:'700', marginBottom:6 },
  headTitle:    { fontSize:30, fontWeight:'500', color:C.espresso, fontFamily:'serif', marginBottom:4 },
  headSub:      { fontSize:13, color:C.muted, lineHeight:20 },

  body:         { flex:1 },
  bodyContent:  { paddingHorizontal:24, paddingTop:18, paddingBottom:20, gap:14 },

  unitRow: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor:C.warm, borderRadius:radius.sm,
    borderWidth:1, borderColor:C.border, padding:12,
  },
  unitLbl:      { fontSize:12, color:C.muted, fontWeight:'500' },
  unitPills:    { flexDirection:'row', backgroundColor:C.cream, borderRadius:100, padding:3, gap:2, borderWidth:1, borderColor:C.border },
  uPill:        { paddingVertical:5, paddingHorizontal:13, borderRadius:100 },
  uPillAct:     { backgroundColor:C.espresso },
  uPillTxt:     { fontSize:11, fontWeight:'600', color:C.muted },
  uPillTxtAct:  { color:C.cream },

  twoCol:       { flexDirection:'row', gap:10 },

  fieldGrp:     { gap:5 },
  fieldLbl:     { fontSize:10, letterSpacing:2, color:C.sienna, fontWeight:'700' },
  fieldWrap: {
    flexDirection:'row', alignItems:'stretch',
    borderWidth:1.5, borderColor:C.border,
    borderRadius:radius.sm, overflow:'hidden', backgroundColor:C.cream,
  },
  fieldErr:     { borderColor:C.error },
  fieldNum:     { flex:1, padding:14, fontSize:22, color:C.espresso, fontFamily:'serif', fontWeight:'600' },
  fieldUnit: {
    paddingHorizontal:13, backgroundColor:C.warm,
    borderLeftWidth:1.5, borderLeftColor:C.border,
    justifyContent:'center',
  },
  fieldUnitTxt: { fontSize:10, fontWeight:'700', color:C.muted, letterSpacing:1 },
  errTxt:       { fontSize:11, color:C.error, fontWeight:'500' },
  hintTxt:      { fontSize:12, color:C.muted, fontStyle:'italic' },

  guideCard: {
    backgroundColor:C.warm, borderRadius:radius.md,
    borderWidth:1, borderColor:C.border, padding:18,
  },
  guideLegend:  { gap:10 },
  legItem:      { flexDirection:'row', alignItems:'center', gap:10 },
  legDot:       { width:8, height:8, borderRadius:4 },
  legTxt:       { fontSize:13, color:C.bark, fontWeight:'600' },
  legSub:       { fontSize:11, color:C.muted },

  genderRow:    { flexDirection:'row', gap:12 },
  genderCard: {
    flex:1, padding:18, borderRadius:radius.md,
    borderWidth:1.5, borderColor:C.border, backgroundColor:C.cream,
    alignItems:'center', gap:6,
  },
  genderCardSel:{ borderColor:C.gold, backgroundColor:'rgba(201,168,76,0.08)' },
  genderIcon:   { fontSize:36, color:C.bark, marginBottom:4 },
  genderIconSel:{ color:C.sienna },
  genderLabel:  { fontSize:16, fontWeight:'700', color:C.espresso, fontFamily:'serif' },
  genderLabelSel:{ color:C.sienna },
  genderSub:    { fontSize:11, color:C.muted, textAlign:'center' },

  bodyGrid: {
    flexDirection:'row', flexWrap:'wrap', gap:9,
  },
  bodyCard: {
    width:'30%', padding:14, borderRadius:radius.sm,
    borderWidth:1.5, borderColor:C.border, backgroundColor:C.cream,
    alignItems:'center',
  },
  bodyCardSel:  { borderColor:C.gold, backgroundColor:'rgba(201,168,76,0.07)' },
  bodyIc:       { fontSize:20, marginBottom:5 },
  bodyNm:       { fontSize:10, fontWeight:'600', color:C.bark, textAlign:'center', letterSpacing:.5 },
  bodyNmSel:    { color:C.sienna },

  tipBox: {
    backgroundColor:'rgba(201,168,76,0.07)',
    borderWidth:1, borderColor:'rgba(201,168,76,0.18)',
    borderRadius:radius.sm, padding:13,
  },
  tipTxt:       { fontSize:12, color:C.sienna, lineHeight:18 },

  foot: {
    padding:20, paddingBottom:36,
    borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.cream,
  },
  btnGold: {
    backgroundColor:C.gold, borderRadius:radius.sm,
    paddingVertical:16, alignItems:'center', ...shadow.md,
  },
  btnDisabled:  { opacity:0.7 },
  btnGoldTxt:   { fontSize:12, fontWeight:'700', letterSpacing:2, color:C.espresso },
});
