// src/screens/ResultsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { C, radius, shadow } from '../theme';
import { recommendAPI, feedbackAPI } from '../services/api';

const CATS = [
  {id:'tops',l:'Tops',s:'✦'},{id:'bottoms',l:'Bottoms',s:'◆'},
  {id:'dresses',l:'Dresses',s:'◇'},{id:'sports_bras',l:'Sports Bras',s:'○'},
  {id:'hoodies',l:'Hoodies',s:'▽'},{id:'accessories',l:'Accessories',s:'❋'},
  {id:'outerwear',l:'Outerwear',s:'◈'},{id:'footwear',l:'Footwear',s:'◎'},
];
const FIT_OPTS = [
  {v:'perfect',l:'✓ Perfect'},
  {v:'slightly_small',l:'Slightly Small'},
  {v:'too_small',l:'Too Small'},
  {v:'slightly_large',l:'Slightly Large'},
  {v:'too_large',l:'Too Large'},
];

export default function ResultsScreen({ route, navigation }) {
  const { measurements, recommendations: initRecs, measurementId } = route.params;
  const [cat,     setCat]     = useState('tops');
  const [recs,    setRecs]    = useState(initRecs || []);
  const [catBusy, setCatBusy] = useState(false);
  const [fbModal, setFbModal] = useState(null);
  const [fit,     setFit]     = useState('');
  const [notes,   setNotes]   = useState('');
  const [fbBusy,  setFbBusy]  = useState(false);

  const fmtLen = v => measurements.unit === 'in' ? `${(v/2.54).toFixed(1)}"` : `${Math.round(v)} cm`;
  const activeCat = CATS.find(c => c.id === cat);

  const switchCat = useCallback(async (newCat) => {
    if (newCat === cat) return;
    setCat(newCat); setCatBusy(true);
    try {
      const res = await recommendAPI.get(measurements.bust, measurements.waist, measurements.hips, newCat);
      setRecs(res.data.recommendations);
      // Save new recommendations
      if (measurementId) {
        await recommendAPI.save(measurements.bust, measurements.waist, measurements.hips, measurementId, newCat);
      }
    } catch {
      Alert.alert('Error', 'Could not load sizes. Check your connection.');
    } finally { setCatBusy(false); }
  }, [cat, measurements, measurementId]);

  const openShop = (url) => Linking.openURL(url).catch(() => Alert.alert('Error','Could not open link.'));

  const submitFeedback = async () => {
    if (!fit) { Alert.alert('Select fit','Please select how the item fits.'); return; }
    setFbBusy(true);
    try {
      await feedbackAPI.submit(fbModal.brand, cat, fbModal.size, fit, notes || null, null);
      Alert.alert('Thank you!','Your feedback helps improve recommendations.');
      setFbModal(null); setFit(''); setNotes('');
    } catch { Alert.alert('Error','Could not save feedback.'); }
    finally { setFbBusy(false); }
  };

  return (
    <View style={s.screen}>
      {/* DB saved banner */}
      <View style={s.dbBar}>
        <View style={s.dbDot}/><Text style={s.dbTxt}>SAVED TO MYSQL DATABASE</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Topbar */}
        <View style={s.topBar}>
          <View style={s.logoRow}>
            <View style={s.dot}><Text style={s.dotTxt}>W</Text></View>
            <Text style={s.brand}>WEAV AI</Text>
          </View>
          <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.editBtnTxt}>EDIT</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.eyRow}><View style={s.eyLine}/><Text style={s.ey}>SIZE PROFILE READY</Text></View>
          <Text style={s.ttl}>Your exact</Text>
          <Text style={s.ttlItalic}>sizes, curated.</Text>
          <View style={s.measStrip}>
            {[{l:'Bust',v:fmtLen(measurements.bust)},{l:'Waist',v:fmtLen(measurements.waist)},{l:'Hips',v:fmtLen(measurements.hips)},{l:'Type',v:measurements.bodyType||'—'}].map(({l,v})=>(
              <View key={l} style={s.mChip}><Text style={s.mLbl}>{l} </Text><Text style={s.mVal}>{v}</Text></View>
            ))}
          </View>
        </View>

        {/* Size overview grid */}
        <View style={s.szGrid}>
          <View style={s.szHead}><View style={s.szDot}/><Text style={s.szHeadTxt}>ALL-BRAND OVERVIEW · TAP TO SHOP</Text></View>
          <View style={s.szCells}>
            {recs.map(r => (
              <TouchableOpacity key={r.brand} style={s.szCell} onPress={() => openShop(r.shop_url)}>
                <Text style={s.szBrand}>{r.brand}</Text>
                <Text style={s.szSize}>{r.size}</Text>
                <Text style={s.szConf}>{r.confidence}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category tabs */}
        <View style={s.secDiv}><View style={s.secLn}/><Text style={s.secLb}>Shop by category</Text><View style={s.secLn}/></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATS.map(c => (
            <TouchableOpacity key={c.id} style={[s.cTab, cat===c.id&&s.cTabOn]} onPress={() => switchCat(c.id)}>
              <Text style={[s.cTabTxt, cat===c.id&&s.cTabTxtOn]}>{c.s} {c.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Brand cards */}
        <View style={s.brandList}>
          {catBusy ? (
            <ActivityIndicator color={C.gold} style={{marginVertical:24}}/>
          ) : recs.map(r => (
            <View key={r.brand} style={s.bcard}>
              <TouchableOpacity style={s.bcBody} onPress={() => openShop(r.shop_url)} activeOpacity={.8}>
                <View style={s.bcMono}><Text style={s.bcMonoTxt}>{r.logo}</Text></View>
                <View style={s.bcInfo}>
                  <Text style={s.bcName}>{r.brand}</Text>
                  <Text style={s.bcSub}>Women's {activeCat?.l} · Official Store</Text>
                  <Text style={s.bcConf}>Confidence: {r.confidence}%</Text>
                </View>
                <View style={s.bcBadge}>
                  <Text style={s.bcBl}>YOUR SIZE</Text>
                  <Text style={s.bcBv}>{r.size}</Text>
                </View>
              </TouchableOpacity>
              <View style={s.bcFoot}>
                <TouchableOpacity style={s.fbBtn} onPress={()=>{setFbModal({brand:r.brand,size:r.size});setFit('');setNotes('')}}>
                  <Text style={s.fbBtnTxt}>Rate Fit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.shopBtn} onPress={() => openShop(r.shop_url)}>
                  <Text style={s.shopBtnTxt}>SHOP NOW ↗</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('Measure')}>
            <Text style={s.btnGhostTxt}>← REMEASURE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnNavy} onPress={() => navigation.navigate('Home')}>
            <Text style={s.btnNavyTxt}>HOME</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal visible={!!fbModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHandle}/>
            <Text style={s.modalTtl}>How did it fit?</Text>
            <Text style={s.modalSub}>{fbModal?.brand} — Size {fbModal?.size}</Text>
            <View style={s.fitOpts}>
              {FIT_OPTS.map(f => (
                <TouchableOpacity key={f.v} style={[s.fitOpt, fit===f.v&&s.fitOptSel]} onPress={()=>setFit(f.v)}>
                  <Text style={[s.fitOptTxt, fit===f.v&&s.fitOptTxtSel]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={s.notesInp}
              placeholder="Optional notes…"
              placeholderTextColor={C.nude}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.mCancel} onPress={() => setFbModal(null)}><Text style={s.mCancelTxt}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.mSubmit} onPress={submitFeedback} disabled={fbBusy}>
                {fbBusy ? <ActivityIndicator color={C.navy} size="small"/> : <Text style={s.mSubmitTxt}>SUBMIT FEEDBACK</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:{ flex:1,backgroundColor:C.cream },
  dbBar:{ flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(26,107,74,0.07)',paddingVertical:7,paddingHorizontal:20,borderBottomWidth:1,borderBottomColor:C.border },
  dbDot:{ width:5,height:5,borderRadius:2.5,backgroundColor:C.success },
  dbTxt:{ fontSize:10,fontWeight:'700',color:C.success,letterSpacing:1.5 },
  topBar:{ paddingTop:16,paddingHorizontal:22,flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  logoRow:{ flexDirection:'row',alignItems:'center',gap:9 },
  dot:{ width:26,height:26,borderRadius:6,backgroundColor:C.gold,alignItems:'center',justifyContent:'center' },
  dotTxt:{ fontFamily:'serif',fontSize:11,fontWeight:'700',color:C.navy },
  brand:{ fontFamily:'serif',fontSize:16,fontWeight:'700',letterSpacing:4,color:C.navy },
  editBtn:{ borderWidth:1.5,borderColor:C.border,borderRadius:100,paddingVertical:6,paddingHorizontal:12 },
  editBtnTxt:{ fontSize:10,fontWeight:'700',letterSpacing:1.5,color:C.navy2 },
  hero:{ paddingHorizontal:22,paddingTop:16,paddingBottom:14,borderBottomWidth:1,borderBottomColor:C.border },
  eyRow:{ flexDirection:'row',alignItems:'center',gap:8,marginBottom:8 },
  eyLine:{ width:14,height:1,backgroundColor:C.gold },
  ey:{ fontSize:10,letterSpacing:3.5,color:C.gold,fontWeight:'700' },
  ttl:{ fontFamily:'serif',fontSize:34,fontWeight:'600',color:C.navy,lineHeight:32 },
  ttlItalic:{ fontFamily:'serif',fontSize:34,fontWeight:'600',color:C.navy3,fontStyle:'italic',marginBottom:10 },
  measStrip:{ flexDirection:'row',flexWrap:'wrap',gap:6 },
  mChip:{ flexDirection:'row',backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:100,paddingHorizontal:11,paddingVertical:4 },
  mLbl:{ fontSize:11,color:C.muted },
  mVal:{ fontSize:11,color:C.navy,fontWeight:'700' },
  szGrid:{ marginHorizontal:20,marginTop:14,borderWidth:1,borderColor:C.border,borderRadius:radius.sm,overflow:'hidden' },
  szHead:{ flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.warm,padding:10,borderBottomWidth:1,borderBottomColor:C.border },
  szDot:{ width:5,height:5,borderRadius:2.5,backgroundColor:C.gold },
  szHeadTxt:{ fontSize:9,letterSpacing:2,color:C.muted,fontWeight:'700' },
  szCells:{ flexDirection:'row',flexWrap:'wrap' },
  szCell:{ width:'33.33%',padding:12,alignItems:'center',gap:2,borderRightWidth:1,borderBottomWidth:1,borderColor:C.border,backgroundColor:C.cream },
  szBrand:{ fontSize:9,fontWeight:'700',letterSpacing:.8,color:C.muted },
  szSize:{ fontFamily:'serif',fontSize:24,fontWeight:'700',color:C.navy },
  szConf:{ fontSize:9,color:C.gold,fontWeight:'700' },
  secDiv:{ flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:20,marginVertical:4 },
  secLn:{ flex:1,height:1,backgroundColor:C.border },
  secLb:{ fontSize:10,letterSpacing:2,color:C.muted,fontWeight:'700' },
  catRow:{ paddingHorizontal:20,gap:7,paddingVertical:10 },
  cTab:{ flexDirection:'row',alignItems:'center',gap:5,paddingVertical:8,paddingHorizontal:14,borderRadius:100,borderWidth:1.5,borderColor:C.border,backgroundColor:C.cream },
  cTabOn:{ backgroundColor:C.navy,borderColor:C.navy },
  cTabTxt:{ fontSize:11,fontWeight:'700',color:C.muted },
  cTabTxtOn:{ color:C.cream },
  brandList:{ paddingHorizontal:20,gap:10 },
  bcard:{ backgroundColor:C.cream,borderWidth:1.5,borderColor:C.border,borderRadius:radius.md,overflow:'hidden',...shadow.sm },
  bcBody:{ flexDirection:'row',alignItems:'center',padding:15,gap:12 },
  bcMono:{ width:44,height:44,borderRadius:12,borderWidth:1.5,borderColor:C.border,backgroundColor:C.warm,alignItems:'center',justifyContent:'center' },
  bcMonoTxt:{ fontFamily:'serif',fontSize:12,fontWeight:'700',color:C.navy2,letterSpacing:1 },
  bcInfo:{ flex:1 },
  bcName:{ fontFamily:'serif',fontSize:19,fontWeight:'700',color:C.navy },
  bcSub:{ fontSize:11,color:C.muted },
  bcConf:{ fontSize:11,color:C.gold,fontWeight:'600',marginTop:1 },
  bcBadge:{ backgroundColor:C.warm,borderWidth:1,borderColor:C.border,borderRadius:10,padding:10,alignItems:'center',minWidth:54 },
  bcBl:{ fontSize:8,fontWeight:'700',letterSpacing:1.5,color:C.muted,marginBottom:2 },
  bcBv:{ fontFamily:'serif',fontSize:24,fontWeight:'700',color:C.navy,lineHeight:24 },
  bcFoot:{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:10,paddingHorizontal:15,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.warm },
  fbBtn:{ borderWidth:1,borderColor:C.border,borderRadius:100,paddingVertical:6,paddingHorizontal:14 },
  fbBtnTxt:{ fontSize:11,color:C.muted,fontWeight:'600' },
  shopBtn:{ flexDirection:'row',alignItems:'center',gap:4 },
  shopBtnTxt:{ fontSize:11,fontWeight:'700',letterSpacing:1,color:C.gold },
  footer:{ flexDirection:'row',gap:10,padding:20,paddingBottom:34,borderTopWidth:1,borderTopColor:C.border,marginTop:14 },
  btnGhost:{ flex:1,padding:13,backgroundColor:C.warm,borderWidth:1.5,borderColor:C.border,borderRadius:radius.sm,alignItems:'center' },
  btnGhostTxt:{ fontSize:11,fontWeight:'700',letterSpacing:1.5,color:C.navy2 },
  btnNavy:{ flex:2,padding:13,backgroundColor:C.navy,borderRadius:radius.sm,alignItems:'center',...shadow.sm },
  btnNavyTxt:{ fontSize:11,fontWeight:'700',letterSpacing:1.5,color:C.cream },
  modalOverlay:{ flex:1,backgroundColor:'rgba(13,27,42,0.5)',justifyContent:'flex-end' },
  modalCard:{ backgroundColor:C.cream,borderTopLeftRadius:28,borderTopRightRadius:28,padding:28,gap:14 },
  modalHandle:{ width:36,height:4,backgroundColor:C.nude,borderRadius:100,alignSelf:'center',marginBottom:-4 },
  modalTtl:{ fontFamily:'serif',fontSize:24,fontWeight:'700',color:C.navy },
  modalSub:{ fontSize:13,color:C.muted,marginTop:-8 },
  fitOpts:{ flexDirection:'row',flexWrap:'wrap',gap:8 },
  fitOpt:{ paddingVertical:8,paddingHorizontal:14,borderRadius:100,borderWidth:1.5,borderColor:C.border,backgroundColor:C.cream },
  fitOptSel:{ backgroundColor:C.gold,borderColor:C.gold },
  fitOptTxt:{ fontSize:12,color:C.muted,fontWeight:'700' },
  fitOptTxtSel:{ color:C.navy },
  notesInp:{ borderWidth:1.5,borderColor:C.border,borderRadius:radius.sm,padding:12,fontSize:14,color:C.navy,minHeight:68,textAlignVertical:'top' },
  modalBtns:{ flexDirection:'row',gap:10 },
  mCancel:{ flex:1,padding:13,backgroundColor:C.warm,borderWidth:1.5,borderColor:C.border,borderRadius:radius.sm,alignItems:'center' },
  mCancelTxt:{ fontSize:12,fontWeight:'700',color:C.navy2 },
  mSubmit:{ flex:2,padding:13,backgroundColor:C.gold,borderRadius:radius.sm,alignItems:'center' },
  mSubmitTxt:{ fontSize:12,fontWeight:'700',letterSpacing:1,color:C.navy },
});
