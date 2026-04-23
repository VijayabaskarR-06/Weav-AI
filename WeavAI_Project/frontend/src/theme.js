// src/theme.js — Weav AI design tokens
export const C = {
  gold:       '#C9A84C',
  goldLight:  '#E8C97D',
  goldPale:   '#F5EDD0',
  goldDim:    'rgba(201,168,76,0.15)',
  cream:      '#FAF6EE',
  warm:       '#F5EDE0',
  parch:      '#EDE0CE',
  nude:       '#DEC9AE',
  tan:        '#C2A07A',
  espresso:   '#1E120A',
  bark:       '#4A2E14',
  sienna:     '#8B5E2C',
  muted:      '#9E8A72',
  border:     'rgba(30,18,10,0.09)',
  borderGold: 'rgba(201,168,76,0.30)',
  error:      '#A0392B',
  success:    '#2E7D5E',
  white:      '#FFFFFF',
};

export const F = {
  display: 'Cochin',          // iOS serif; falls back to serif on Android
  body:    'System',
};

export const radius = { sm: 11, md: 18, full: 100 };
export const shadow = {
  sm:  { shadowColor:'#1E120A', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, elevation:2 },
  md:  { shadowColor:'#1E120A', shadowOffset:{width:0,height:8}, shadowOpacity:0.11, shadowRadius:20, elevation:5 },
};
