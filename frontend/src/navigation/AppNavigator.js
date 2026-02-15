// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthScreen    from '../screens/AuthScreen';
import HomeScreen    from '../screens/HomeScreen';
import MeasureScreen from '../screens/MeasureScreen';
import ResultsScreen from '../screens/ResultsScreen';
import { C } from '../theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:C.cream }}>
      <ActivityIndicator color={C.gold} size="large"/>
    </View>
  );
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown:false, animation:'slide_from_right' }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen}/>
        ) : (
          <>
            <Stack.Screen name="Home"    component={HomeScreen}/>
            <Stack.Screen name="Measure" component={MeasureScreen}/>
            <Stack.Screen name="Results" component={ResultsScreen}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
