// src/screens/ResultsScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking, Alert, Modal, TextInput,
} from 'react-native';
import { C, radius, shadow } from '../theme';
import { recommendAPI, feedbackAPI } from '../services/api';

const CATS = [
  {id:'tops',label:'Tops',sym:'✦'},
  {id:'bottoms',label:'Bottoms',sym:'◆'},
  {id:'dresses',label:'Dresses',sym:'◇'},
  {id:'sports_bras',label:'Sports Bras',sym:'○'},
  {id:'hoodies',label:'Hoodies',sym:'▽'},
];

const FIT_OPTIONS = ['perfect','slightly_small','too_small','slightly_large','too_large'];

export default function ResultsScreen({ route, navigation }) {
  const { measurements, recommendations: initRecs } = route.params;
  const [cat,   setCat]   = useState('tops');
  const [recs,  setRecs]  = useState(initRecs);
  const [catLoading, setCatLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null); // {brand, size}
  const [fit,   setFit]   = useState('');
  const [notes, setNotes] = useState('');

  const fmtLen = v => measurements.unit==='in'
    ? `${(v/2.54).toFixed(1)}"`
    : `${Math.round(v)} cm`;

  const switchCat = async (newCat) => {
    if (newCat===cat) return;
    setCat(newCat); setCatLoading(true);
    try {
      const res = await recommendAPI.get(
        measurements.bust, measurements.waist, measurements.hips, newCat
      );
      setRecs(res.data.recommendations);
    } catch (_) {
      Alert.alert('Error','Could not load sizes for this category.');
    } finally { setCatLoading(false); }
  };

  const openShop = (url) => Linking.openURL(url).catch(()=>Alert.alert('Error','Could not open link.'));

  const submitFeedback = async () => {
    if (!fit) { Alert.alert('Select your fit','Please select how the item fits.'); return; }
    try {
      await feedbackAPI.submit({
        brand: feedbackModal.brand,
        category: cat,
        recommended_size: feedbackModal.size,
        actual_fit: fit,
        notes,
      });
      Alert.alert('Thank you!','Your feedback helps improve our recommendations.');
      setFeedbackModal(null); setFit(''); setNotes('');
    } catch (_) {
      Alert.alert('Error','Could not submit feedback.');
    }
  };

  return (
    <View style={s.screen}>
      {/* DB saved indicator */}
      <View style={s.dbBar}>
        <View style={s.dbDot}/>
        <Text style={s.dbTxt}>PROFILE SAVED · MYSQL DATABASE</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Top */}
        <View style={s.topBar}>
          <View style={s.logoRow}>
            <View style={s.dot}><Text style={s.dotTxt}>W</Text></View>
            <Text style={s.logoTxt}>WEAV AI</Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.editTxt}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.eyebrowRow}>
            <View style={s.eyebrowLine}/>
            <Text style={s.eyebrow}>SIZE PROFILE READY</Text>
          </View>
          <Text style={s.heroTitle}>Your exact</Text>
          <Text style={s.heroItalic}>sizes, curated.</Text>
          <View style={s.measStrip}>
            {[
              {l:'Bust',  v:fmtLen(measurements.bust)},
              {l:'Waist', v:fmtLen(measurements.waist)},
              {l:'Hips',  v:fmtLen(measurements.hips)},
              {l:'Type',  v:measurements.body_type||'—'},
            ].map(({l,v})=>(
              <View key={l} style={s.measTag}>
                <Text style={s.measLbl}>{l} </Text>
                <Text style={s.measVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Size overview grid */}
        <View style={s.gridWrap}>
          <View style={s.gridHead}>
            <View style={s.gridDot}/>
            <Text style={s.gridHeadTxt}>ALL-BRAND OVERVIEW · TAP TO SHOP</Text>
          </View>
          <View style={s.grid}>
            {recs.map(r => (
              <TouchableOpacity key={r.brand} style={s.gridCell} onPress={() => openShop(r.shop_url)}>
                <Text style={s.gcBrand}>{r.brand}</Text>
                <Text style={s.gcSize}>{r.size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category tabs */}
        <View style={s.divRow}><View style={s.divLn}/><Text style={s.divTxt}>Shop by category</Text><View style={s.divLn}/></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {CATS.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.catTab, cat===c.id && s.catTabAct]}
              onPress={() => switchCat(c.id)}
            >
              <Text style={[s.catTabTxt, cat===c.id && s.catTabTxtAct]}>{c.sym} {c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Brand cards */}
        <View style={s.brandList}>
          {(catLoading ? initRecs : recs).map(r => (
            <View key={r.brand} style={s.brandCard}>
              <View style={s.bcMain}>
                <View style={s.bcMono}><Text style={s.bcMonoTxt}>{r.logo}</Text></View>
                <View style={s.bcInfo}>
                  <Text style={s.bcName}>{r.brand}</Text>
                  <Text style={s.bcSub}>Women's {CATS.find(c=>c.id===cat)?.label} · Official Store</Text>
                </View>
                <View style={s.bcBadge}>
                  <Text style={s.bcBl}>YOUR SIZE</Text>
                  <Text style={s.bcBv}>{r.size}</Text>
                </View>
              </View>
              <View style={s.bcFoot}>
                <TouchableOpacity
                  style={s.feedbackBtn}
                  onPress={() => { setFeedbackModal({brand:r.brand,size:r.size}); setFit(''); setNotes(''); }}
                >
                  <Text style={s.feedbackBtnTxt}>Rate Fit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.shopBtn} onPress={() => openShop(r.shop_url)}>
                  <Text style={s.shopBtnTxt}>SHOP NOW ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.foot}>
          <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.btnGhostTxt}>← REMEASURE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnDark} onPress={() => navigation.navigate('Home')}>
            <Text style={s.btnDarkTxt}>GO HOME</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal visible={!!feedbackModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>How did it fit?</Text>
            <Text style={s.modalSub}>
              {feedbackModal?.brand} — Recommended size: <Text style={{color:C.gold,fontWeight:'700'}}>{feedbackModal?.size}</Text>
            </Text>
            <View style={s.fitOptions}>
              {FIT_OPTIONS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[s.fitOpt, fit===f && s.fitOptSel]}
                  onPress={() => setFit(f)}
                >
                  <Text style={[s.fitOptTxt, fit===f && s.fitOptTxtSel]}>
                    {f.replace(/_/g,' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.notesInp}
              placeholder="Optional notes..."
              placeholderTextColor={C.nude}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setFeedbackModal(null)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmit} onPress={submitFeedback}>
                <Text style={s.modalSubmitTxt}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex:1, backgroundColor:C.cream },
  scroll:    { flex:1 },

  dbBar: {
    flexDirection:'row', alignItems:'center', gap:8,
    backgroundColor:C.warm, paddingVertical:7, paddingHorizontal:20,
    borderBottomWidth:1, borderBottomColor:C.border,
  },
  dbDot:    { width:6, height:6, borderRadius:3, backgroundColor:C.gold },
  dbTxt:    { fontSize:9, letterSpacing:2, color:C.muted, fontWeight:'700' },

  topBar: {
    paddingTop:20, paddingHorizontal:24,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
  },
  logoRow:  { flexDirection:'row', alignItems:'center', gap:8 },
  dot:      { width:22, height:22, borderRadius:11, backgroundColor:C.gold, alignItems:'center', justifyContent:'center' },
  dotTxt:   { fontSize:9, fontWeight:'700', color:C.espresso, fontFamily:'serif' },
  logoTxt:  { fontSize:12, fontWeight:'600', letterSpacing:3.5, color:C.espresso },
  editBtn:  { borderWidth:1.5, borderColor:C.border, borderRadius:100, paddingVertical:6, paddingHorizontal:12 },
  editTxt:  { fontSize:10, fontWeight:'700', letterSpacing:1.5, color:C.bark },

  hero:     { paddingHorizontal:24, paddingTop:18, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border },
  eyebrowRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  eyebrowLine:{ width:14, height:1, backgroundColor:C.gold },
  eyebrow:  { fontSize:10, letterSpacing:3.5, color:C.gold, fontWeight:'700' },
  heroTitle:{ fontSize:34, fontWeight:'400', color:C.espresso, fontFamily:'serif', lineHeight:34 },
  heroItalic:{ fontSize:34, fontWeight:'400', color:C.sienna, fontFamily:'serif', fontStyle:'italic', marginBottom:12 },
  measStrip:{ flexDirection:'row', flexWrap:'wrap', gap:6 },
  measTag:  { flexDirection:'row', backgroundColor:C.warm, borderWidth:1, borderColor:C.border, borderRadius:100, paddingHorizontal:12, paddingVertical:5 },
  measLbl:  { fontSize:11, color:C.muted },
  measVal:  { fontSize:11, color:C.espresso, fontWeight:'700' },

  gridWrap: { margin:18, borderWidth:1, borderColor:C.border, borderRadius:radius.sm, overflow:'hidden' },
  gridHead: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:C.warm, padding:10, borderBottomWidth:1, borderBottomColor:C.border },
  gridDot:  { width:5, height:5, borderRadius:2.5, backgroundColor:C.gold },
  gridHeadTxt:{ fontSize:9, letterSpacing:2, color:C.muted, fontWeight:'700' },
  grid:     { flexDirection:'row', flexWrap:'wrap' },
  gridCell: { width:'33.33%', padding:12, alignItems:'center', gap:3, borderRightWidth:1, borderBottomWidth:1, borderColor:C.border, backgroundColor:C.cream },
  gcBrand:  { fontSize:9, fontWeight:'700', letterSpacing:1, color:C.muted },
  gcSize:   { fontSize:22, fontWeight:'700', color:C.espresso, fontFamily:'serif' },

  divRow:   { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:24, marginVertical:4 },
  divLn:    { flex:1, height:1, backgroundColor:C.border },
  divTxt:   { fontSize:10, letterSpacing:2, color:C.muted, fontWeight:'600' },

  catScroll:{ paddingHorizontal:24, gap:7, paddingVertical:10 },
  catTab:   { paddingVertical:7, paddingHorizontal:14, borderRadius:100, borderWidth:1.5, borderColor:C.border, backgroundColor:C.cream },
  catTabAct:{ backgroundColor:C.espresso, borderColor:C.espresso },
  catTabTxt:{ fontSize:11, fontWeight:'600', color:C.muted },
  catTabTxtAct:{ color:C.cream },

  brandList:{ paddingHorizontal:20, gap:10 },
  brandCard:{ backgroundColor:C.cream, borderWidth:1.5, borderColor:C.border, borderRadius:radius.md, overflow:'hidden', ...shadow.sm },
  bcMain:   { flexDirection:'row', alignItems:'center', padding:16, gap:13 },
  bcMono:   { width:42, height:42, borderRadius:12, backgroundColor:C.warm, borderWidth:1.5, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  bcMonoTxt:{ fontSize:11, fontWeight:'700', color:C.bark, letterSpacing:1 },
  bcInfo:   { flex:1 },
  bcName:   { fontSize:18, fontWeight:'600', color:C.espresso, fontFamily:'serif' },
  bcSub:    { fontSize:11, color:C.muted },
  bcBadge:  { backgroundColor:C.warm, borderWidth:1, borderColor:C.border, borderRadius:radius.sm, paddingHorizontal:12, paddingVertical:8, alignItems:'center', minWidth:54 },
  bcBl:     { fontSize:8, fontWeight:'700', letterSpacing:1.5, color:C.muted, marginBottom:2 },
  bcBv:     { fontSize:22, fontWeight:'700', color:C.espresso, fontFamily:'serif', lineHeight:22 },
  bcFoot:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10, paddingHorizontal:16, borderTopWidth:1, borderTopColor:C.border, backgroundColor:C.warm },
  feedbackBtn:{ borderWidth:1, borderColor:C.border, borderRadius:100, paddingVertical:6, paddingHorizontal:14 },
  feedbackBtnTxt:{ fontSize:11, color:C.muted, fontWeight:'600' },
  shopBtn:  { flexDirection:'row', alignItems:'center', gap:6 },
  shopBtnTxt:{ fontSize:10, fontWeight:'700', letterSpacing:1, color:C.gold },

  foot:     { flexDirection:'row', gap:10, padding:20, paddingBottom:36, borderTopWidth:1, borderTopColor:C.border, marginTop:18 },
  btnGhost: { flex:1, padding:13, backgroundColor:C.warm, borderRadius:radius.sm, borderWidth:1.5, borderColor:C.border, alignItems:'center' },
  btnGhostTxt:{ fontSize:11, fontWeight:'700', letterSpacing:1.5, color:C.bark },
  btnDark:  { flex:2, padding:13, backgroundColor:C.espresso, borderRadius:radius.sm, alignItems:'center' },
  btnDarkTxt:{ fontSize:11, fontWeight:'700', letterSpacing:1.5, color:C.cream },

  // Feedback modal
  modalOverlay:{ flex:1, backgroundColor:'rgba(30,18,10,0.5)', justifyContent:'flex-end' },
  modalCard:   { backgroundColor:C.cream, borderTopLeftRadius:24, borderTopRightRadius:24, padding:28, gap:14 },
  modalTitle:  { fontSize:22, fontWeight:'600', color:C.espresso, fontFamily:'serif' },
  modalSub:    { fontSize:13, color:C.muted },
  fitOptions:  { flexDirection:'row', flexWrap:'wrap', gap:8 },
  fitOpt:      { paddingVertical:7, paddingHorizontal:14, borderRadius:100, borderWidth:1.5, borderColor:C.border },
  fitOptSel:   { backgroundColor:C.gold, borderColor:C.gold },
  fitOptTxt:   { fontSize:12, color:C.muted, fontWeight:'600', textTransform:'capitalize' },
  fitOptTxtSel:{ color:C.espresso },
  notesInp: {
    borderWidth:1.5, borderColor:C.border, borderRadius:radius.sm,
    padding:12, fontSize:14, color:C.espresso, minHeight:70, textAlignVertical:'top',
  },
  modalBtns:   { flexDirection:'row', gap:10 },
  modalCancel: { flex:1, padding:13, backgroundColor:C.warm, borderRadius:radius.sm, borderWidth:1.5, borderColor:C.border, alignItems:'center' },
  modalCancelTxt:{ fontSize:12, fontWeight:'700', color:C.bark },
  modalSubmit: { flex:2, padding:13, backgroundColor:C.gold, borderRadius:radius.sm, alignItems:'center' },
  modalSubmitTxt:{ fontSize:12, fontWeight:'700', color:C.espresso },
});
