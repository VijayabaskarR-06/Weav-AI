#!/usr/bin/env node
// Copies the browser demo HTML + config + assets into app/www so Capacitor
// can bundle them into the iOS/Android app. Source of truth lives one
// level up at Weav-AI/WeavAI_FINAL_FIXED.html — edit there, not here.

const fs = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..', '..');      // Weav-AI/
const WWW    = path.resolve(__dirname, '..', 'www');     // Weav-AI/app/www
const SOURCE = path.join(ROOT, 'WeavAI_FINAL_FIXED.html');

if (!fs.existsSync(SOURCE)) {
  console.error('Source HTML not found at', SOURCE);
  process.exit(1);
}

fs.mkdirSync(WWW, { recursive: true });

// Rewrite the index entry: replace the window.location redirect (used on
// the Netlify deployment) with the actual app contents, so the WebView
// boots straight into the demo with no flash.
const html = fs.readFileSync(SOURCE, 'utf8');

// Inject a small native-bridge bootstrap so the page knows it's running
// inside Capacitor and can talk to the Railway backend without a CORS
// preflight (Capacitor WebViews use a capacitor:// or http://localhost
// origin, not the demo's regular https origin).
const nativeShim = `
<script>
  // Detect Capacitor and surface the backend URL the app should call.
  // The demo defaults to localhost:8000 if window.WEAVAI_API_BASE_URL is
  // unset; here we force the Railway production URL for native builds.
  window.WEAVAI_API_BASE_URL = 'https://backend-api-production-243d.up.railway.app';
  window.WEAVAI_PLATFORM = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? 'native' : 'web';
</script>
`;
const patched = html.replace('</head>', nativeShim + '</head>');

fs.writeFileSync(path.join(WWW, 'index.html'), patched);

// PWA manifest for "Add to Home Screen" on iOS Safari and Android Chrome
// (also picked up by Capacitor for app metadata when not overridden).
const manifest = {
  name: 'Weav AI',
  short_name: 'Weav AI',
  description: 'Your personal AI tailor — perfectly sized recommendations across Nike, Adidas, Zara, H&M, Levi\'s.',
  start_url: '/index.html',
  display: 'standalone',
  background_color: '#FAF6EE',
  theme_color: '#0D1B2A',
  orientation: 'portrait',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
  ]
};
fs.writeFileSync(path.join(WWW, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

console.log('Synced HTML → app/www/index.html (' + Math.round(patched.length / 1024) + ' KB)');
