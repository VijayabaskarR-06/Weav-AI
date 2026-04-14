// src/screens/MeasureScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { C, radius, shadow } from '../theme';
import { measureAPI, recommendAPI } from '../services/api';

const TOTAL = 3;
const BODY_TYPES = [
  {id:'Hourglass',i:'⌛'},{id:'Pear',i:'🍐'},{id:'Apple',i:'🍎'},
  {id:'Rectangle',i:'▭'},{id:'Athletic',i:'⚡'},{id:'Curvy',i:'〜'},
];

export default function MeasureScreen({ navigation }) {
  const [step,  setStep]  = useState(1);
  const [unit,  setUnit]  = useState('cm');
  const [busy,  setBusy]  = useState(false);
  const [errs,  setErrs]  = useState({});
  const [form,  setForm]  = useState({ height:'',weight:'',age:'',bust:'',waist:'',hips:'',bodyType:'' });

  const set = (k, v) => { setForm(p => ({...p,[k]:v})); setErrs(p => ({...p,[k]:null})); };
  const toCm = v => unit === 'in' ? (parseFloat(v)||0)*2.54 : (parseFloat(v)||0);

  const validate = () => {
    const e = {};
    if (step===1){ if(!form.height)e.height='Required'; if(!form.weight)e.weight='Required'; if(!form.age)e.age='Required'; }
    if (step===2){ if(!form.bust)e.bust='Required'; if(!form.waist)e.waist='Required'; if(!form.hips)e.hips='Required'; }
    setErrs(e); return Object.keys(e).length===0;
  };

  const next = async () => {
    if (!validate()) return;
    if (step < TOTAL) { setStep(s => s+1); return; }
    setBusy(true);
    const payload = {
      bust:      toCm(form.bust),
      waist:     toCm(form.waist),
      hips:      toCm(form.hips),
      height:    toCm(form.height),
      weight:    parseFloat(form.weight)||0,
      age:       parseInt(form.age)||0,
      body_type: form.bodyType || null,
      unit,
    };
    try {
      // 1. Save measurements to MySQL
      const mRes = await measureAPI.save(payload);
      const measurementId = mRes.data.id;

      // 2. Get recommendations from all brands
      const rRes = await recommendAPI.get(payload.bust, payload.waist, payload.hips, 'tops');

      // 3. Save recommendations to DB
      await recommendAPI.save(payload.bust, payload.waist, payload.hips, measurementId, 'tops');

      // 4. Navigate to results
      navigation.navigate('Results', {
        measurements: { ...payload, bodyType: form.bodyType || 'Not specified' },
        recommendations: rRes.data.recommendations,
        measurementId,
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Could not save. Please check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const FI = ({ label, field, ph, hint, keyboard='numeric' }) => (
    <View style={s.nf}>
      <Text style={s.nfLbl}>{label}</Text>
      <View style={[s.nfWrap, errs[field] && s.nfErr]}>
        <TextInput
          style={s.nfInp}
          placeholder={ph}
          placeholderTextColor={C.nude}
          value={form[field]}
          onChangeText={v => set(field, v)}
          keyboardType={keyboard}
          returnKeyType="done"
        />
        <View style={s.nfUnit}>
          <Text style={s.nfUnitTxt}>{field==='weight'?(unit==='cm'?'KG':'LBS'):unit.toUpperCase()}</Text>
        </View>
      </View>
      {errs[field] && <Text style={s.errTxt}>⚠ {errs[field]}</Text>}
      {hint && <Text style={s.hintTxt}>{hint}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={s.screen}>
        {/* Topbar */}
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={step===1?()=>navigation.goBack():()=>setStep(s=>s-1)}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.stepCt}>{step} / {TOTAL}</Text>
          {step < TOTAL
            ? <TouchableOpacity onPress={()=>setStep(s=>s+1)}><Text style={s.skipTxt}>Skip</Text></TouchableOpacity>
            : <View style={{width:40}}/>
          }
        </View>

        {/* Progress */}
        <View style={s.prog}>
          {Array.from({length:TOTAL}).map((_,i) => (
            <View key={i} style={[s.pbSeg, i<step-1&&s.pbDone, i===step-1&&s.pbNow]}/>
          ))}
        </View>

        {/* Head */}
        <View style={s.head}>
          <Text style={s.ey}>{step===1?'BASIC DETAILS':step===2?'BODY MEASUREMENTS':'BODY TYPE'}</Text>
          <Text style={s.ttl}>{step===1?'Tell us about yourself':step===2?'Your measurements':'Your body type'}</Text>
          <Text style={s.sub}>{step===1?'Calibrates your size across every brand.':step===2?'Measure in a relaxed posture for accuracy.':'Optional — helps fine-tune recommendations.'}</Text>
        </View>

        <ScrollView style={{flex:1}} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {step===1&&<>
            <View style={s.unitRow}>
              <Text style={s.unitLbl}>Units of measure</Text>
              <View style={s.unitPills}>
                <TouchableOpacity style={[s.uPill,unit==='cm'&&s.uPillOn]} onPress={()=>setUnit('cm')}><Text style={[s.uPillTxt,unit==='cm'&&s.uPillTxtOn]}>cm/kg</Text></TouchableOpacity>
                <TouchableOpacity style={[s.uPill,unit==='in'&&s.uPillOn]} onPress={()=>setUnit('in')}><Text style={[s.uPillTxt,unit==='in'&&s.uPillTxtOn]}>in/lbs</Text></TouchableOpacity>
              </View>
            </View>
            <FI label="HEIGHT" field="height" ph={unit==='cm'?'165':'65'} hint="Standing height without shoes"/>
            <View style={s.twoCol}>
              <View style={{flex:1}}><FI label="WEIGHT" field="weight" ph={unit==='cm'?'60':'132'}/></View>
              <View style={{flex:1}}><FI label="AGE" field="age" ph="26"/></View>
            </View>
            <View style={s.tip}><Text style={s.tipIc}>✦</Text><Text style={s.tipTxt}> Saved securely in MySQL. Never shared.</Text></View>
          </>}

          {step===2&&<>
            <View style={s.guideCard}>
              <View style={s.guideLeg}>
                {[{c:'#C9A84C',l:'Bust',d:'Fullest part of chest'},{c:'#1A3A5C',l:'Waist',d:'Narrowest point'},{c:'#0D1B2A',l:'Hips',d:'Widest point'}].map(({c,l,d})=>(
                  <View key={l} style={s.guideItem}><View style={[s.gdot,{backgroundColor:c}]}/><View><Text style={s.gtx}>{l}</Text><Text style={s.gsd}>{d}</Text></View></View>
                ))}
              </View>
            </View>
            <FI label="BUST / CHEST" field="bust"  ph={unit==='cm'?'88':'34.5'} hint="Keep tape parallel to the ground"/>
            <FI label="WAIST"        field="waist" ph={unit==='cm'?'70':'27.5'} hint="At the natural waistline"/>
            <FI label="HIPS"         field="hips"  ph={unit==='cm'?'96':'37.5'} hint="Stand with feet together"/>
          </>}

          {step===3&&<>
            <View style={s.btGrid}>
              {BODY_TYPES.map(bt=>(
                <TouchableOpacity key={bt.id} style={[s.btCard,form.bodyType===bt.id&&s.btCardSel]} onPress={()=>set('bodyType',bt.id)}>
                  <Text style={s.btIc}>{bt.i}</Text>
                  <Text style={[s.btNm,form.bodyType===bt.id&&s.btNmSel]}>{bt.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.tip}><Text style={s.tipIc}>◇</Text><Text style={s.tipTxt}> Your measurements alone are enough for accuracy.</Text></View>
          </>}
        </ScrollView>

        {/* Footer */}
        <View style={s.foot}>
          <TouchableOpacity style={[s.btnGold,busy&&s.btnDis]} onPress={next} disabled={busy}>
            {busy
              ? <ActivityIndicator color={C.navy} size="small"/>
              : <Text style={s.btnGoldTxt}>{step===TOTAL?'GENERATE & SAVE MY PROFILE →':'CONTINUE →'}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:{ flex:1,backgroundColor:C.cream },
  topBar:{ paddingTop:52,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  backBtn:{ width:40,height:40,borderRadius:20,borderWidth:1.5,borderColor:C.border,alignItems:'center',justifyContent:'center' },
  backTxt:{ fontSize:16,color:C.navy },
  stepCt:{ fontFamily:'serif',fontSize:16,fontWeight:'600',color:C.muted },
  skipTxt:{ fontSize:12,color:C.muted },
  prog:{ flexDirection:'row',gap:4,paddingHorizontal:24,marginTop:16 },
  pbSeg:{ flex:1,height:2,backgroundColor:C.nude,borderRadius:100 },
  pbDone:{ backgroundColor:C.gold },
  pbNow:{ backgroundColor:C.gold2 },
  head:{ paddingHorizontal:24,marginTop:20 },
  ey:{ fontSize:10,letterSpacing:3,color:C.gold,fontWeight:'700',marginBottom:7 },
  ttl:{ fontFamily:'serif',fontSize:32,fontWeight:'700',color:C.navy,marginBottom:4 },
  sub:{ fontSize:13,color:C.muted,lineHeight:19 },
  body:{ paddingHorizontal:24,paddingTop:16,paddingBottom:20,gap:13 },
  unitRow:{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:radius.sm,padding:12 },
  unitLbl:{ fontSize:13,color:C.muted,fontWeight:'500' },
  unitPills:{ flexDirection:'row',backgroundColor:C.cream,borderWidth:1,borderColor:C.border,borderRadius:100,padding:3,gap:2 },
  uPill:{ paddingVertical:5,paddingHorizontal:13,borderRadius:100 },
  uPillOn:{ backgroundColor:C.navy },
  uPillTxt:{ fontSize:11,fontWeight:'700',color:C.muted },
  uPillTxtOn:{ color:C.cream },
  twoCol:{ flexDirection:'row',gap:10 },
  nf:{ gap:5 },
  nfLbl:{ fontSize:10,letterSpacing:2,color:C.navy3,fontWeight:'700' },
  nfWrap:{ flexDirection:'row',alignItems:'stretch',borderWidth:1.5,borderColor:C.border,borderRadius:radius.sm,overflow:'hidden',backgroundColor:C.cream },
  nfErr:{ borderColor:C.error },
  nfInp:{ flex:1,padding:13,fontFamily:'serif',fontSize:26,fontWeight:'700',color:C.navy },
  nfUnit:{ paddingHorizontal:13,backgroundColor:C.warm,borderLeftWidth:1.5,borderLeftColor:C.border,justifyContent:'center' },
  nfUnitTxt:{ fontSize:10,fontWeight:'700',letterSpacing:1,color:C.muted },
  errTxt:{ fontSize:11,color:C.error,fontWeight:'600' },
  hintTxt:{ fontSize:12,color:C.muted,fontStyle:'italic' },
  guideCard:{ backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:radius.md,padding:16 },
  guideLeg:{ gap:10 },
  guideItem:{ flexDirection:'row',alignItems:'center',gap:9 },
  gdot:{ width:7,height:7,borderRadius:3.5 },
  gtx:{ fontSize:13,color:C.navy2,fontWeight:'700' },
  gsd:{ fontSize:11,color:C.muted },
  btGrid:{ flexDirection:'row',flexWrap:'wrap',gap:8 },
  btCard:{ width:'30%',padding:14,borderRadius:radius.sm,borderWidth:1.5,borderColor:C.border,backgroundColor:C.cream,alignItems:'center' },
  btCardSel:{ borderColor:C.gold,backgroundColor:'rgba(201,168,76,0.08)' },
  btIc:{ fontSize:20,marginBottom:5 },
  btNm:{ fontSize:11,fontWeight:'700',color:C.navy2,textAlign:'center' },
  btNmSel:{ color:C.navy3 },
  tip:{ backgroundColor:'rgba(201,168,76,0.07)',borderWidth:1,borderColor:'rgba(201,168,76,0.16)',borderRadius:radius.sm,padding:12,flexDirection:'row',alignItems:'center' },
  tipIc:{ fontSize:13,color:C.gold },
  tipTxt:{ fontSize:12,color:C.navy3,lineHeight:17,flex:1 },
  foot:{ padding:18,paddingBottom:34,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.cream },
  btnGold:{ backgroundColor:C.gold,borderRadius:radius.sm,paddingVertical:16,alignItems:'center',...shadow.md },
  btnDis:{ opacity:.65 },
  btnGoldTxt:{ fontSize:13,fontWeight:'700',letterSpacing:2.5,color:C.navy },
});
