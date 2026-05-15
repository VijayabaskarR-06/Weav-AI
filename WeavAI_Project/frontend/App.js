import React, { useRef, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import htmlBundle from './src/htmlBundle';

// The whole app is the existing single-file demo running inside a native
// WebView. Same design, same fonts, same colours, same PhotoFit pipeline
// — but in a real installable iOS/Android app you can put on your phone.
export default function App() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Match the demo's parchment background so there's no white flash.
  useEffect(() => { SystemUI.setBackgroundColorAsync('#FAF6EE').catch(() => {}); }, []);

  // Android: hardware back button → WebView history (so the demo's modals
  // and wizard steps unwind naturally).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webRef.current) { webRef.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    // Plain View (no SafeAreaView wrapping). The WebView extends edge-to-edge
    // under the status bar / notch / home indicator. The HTML inside handles
    // its own inset via CSS `env(safe-area-inset-top|bottom)` so the header
    // sits at the proper height on every device — not pushed 50–95 px down
    // by a stack of doubled-up safe-area paddings.
    <View style={styles.root}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <WebView
        ref={webRef}
        source={{ html: htmlBundle, baseUrl: 'https://weavai.local/' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        cacheEnabled
        setSupportMultipleWindows={false}
        onLoadEnd={() => setLoading(false)}
        androidLayerType="hardware"
        onMessage={() => {}}
        style={styles.web}
      />
      {loading && (
        <View pointerEvents="none" style={styles.loader}>
          <ActivityIndicator color="#C9A84C" size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FAF6EE' },
  web:    { flex: 1, backgroundColor: '#FAF6EE' },
  loader: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FAF6EE',
  },
});
