# Weav AI — Native App

This folder wraps the existing browser demo (`Weav-AI/WeavAI_FINAL_FIXED.html`) in a real native shell using **Capacitor**, so the same HTML/CSS/JS you've been polishing renders inside a real iOS and Android app — identical fonts, colours, animations, PhotoFit, everything.

## What's inside

```
app/
├── package.json            ← Capacitor + plugin deps
├── capacitor.config.json   ← app id, splash, status bar, camera permissions
├── scripts/sync-web.js     ← copies WeavAI_FINAL_FIXED.html → www/ + patches API base URL
├── www/                    ← what gets bundled into the apps (auto-generated)
├── ios/                    ← native Xcode project (Swift Package Manager)
└── android/                ← native Gradle project
```

The HTML at `Weav-AI/WeavAI_FINAL_FIXED.html` is the source of truth. The sync script:
1. Copies it to `www/index.html`
2. Forces `WEAVAI_API_BASE_URL` to the Railway backend so the WebView talks to production by default

So you keep editing the single HTML file — every native build picks up your latest changes.

---

## One-time setup

```bash
cd Weav-AI/app
npm install            # already done; re-run if you nuke node_modules
```

For Android builds, install **Android Studio** (and let it download SDK + an emulator). For iOS, you need **Xcode 15+** — you already have Xcode 26.

---

## Run on the iOS Simulator (fastest)

```bash
cd Weav-AI/app
npm run ios:open       # syncs, then opens Xcode
```

Then in Xcode:
1. Top-left: pick a simulator (e.g. *iPhone 16 Pro*)
2. Hit ▶ Run
3. App boots straight into the WeavAI demo, native splash → straight to splash screen of the demo

## Run on your iPhone (sideload via USB)

1. Plug your iPhone in, unlock it, "Trust this computer."
2. `npm run ios:open`
3. Xcode → top-left, pick your device instead of a simulator.
4. Project settings → **Signing & Capabilities** → tick "Automatically manage signing" and pick a Team (your Apple ID works — Free tier gives you a 7-day sideload).
5. Hit ▶ Run. First time, your phone will refuse — go to *Settings → General → VPN & Device Management → trust your developer cert.*

You now have **Weav AI** on your home screen as a real app, identical to the demo.

## Run on Android

Once Android Studio is installed:
```bash
npm run android:open   # opens Android Studio
```
Hit ▶ Run on an emulator or a USB-connected phone (enable Developer Options + USB debugging on the phone first).

---

## Iterate fast: live reload to your phone

Capacitor can point the WebView at your dev machine over your local network, so every save in `WeavAI_FINAL_FIXED.html` reflects on the phone instantly.

```bash
# In one terminal, serve the file:
cd Weav-AI
python3 -m http.server 5500

# Find your machine's IP on the Wi-Fi network:
ipconfig getifaddr en0       # e.g. 10.20.17.10
```

Then add this temporarily to `app/capacitor.config.json` under `"server"`:
```json
"url": "http://10.20.17.10:5500/WeavAI_FINAL_FIXED.html",
"cleartext": true
```

Re-run `npm run ios` and the app will fetch the HTML over your LAN. Edit the HTML, refresh inside the app. Remove the `url` key before shipping.

---

## Backend & DB

The app already points at **https://backend-api-production-243d.up.railway.app** (your Railway FastAPI). The HTML's existing auth, profile save, history, and feedback endpoints work through that base URL.

If you want to run the backend locally instead:
```bash
cd ../WeavAI_Project
docker compose up -d db phpmyadmin    # MySQL on :3306, phpMyAdmin on :8080
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000
```

Then edit `scripts/sync-web.js` and change `WEAVAI_API_BASE_URL` to `http://10.20.17.10:8000` (your machine's LAN IP, not `localhost` — the phone needs a routable address). Run `npm run sync`.

---

## App icon & splash

Drop a 1024×1024 PNG at `app/resources/icon.png` and run:
```bash
npx @capacitor/assets generate
```
That regenerates every platform-specific icon and splash from the single source.

---

## Ship to the App Store / Play Store

Once you're happy with how it runs on-device:

**iOS:**
1. Apple Developer Program ($99/year)
2. Xcode → Product → Archive → Distribute App → App Store Connect
3. Submit through App Store Connect (review ~24–48h)

**Android:**
1. Google Play Console ($25 one-time)
2. Android Studio → Build → Generate Signed Bundle → AAB
3. Upload to Play Console (review ~few hours)

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cap not found` | `cd app && npm install` |
| iOS build "no signing certificate" | Xcode → Signing & Capabilities → pick your Team |
| White screen on launch | Did you re-run `npm run sync` after editing the HTML? |
| PhotoFit "Loading AI model…" forever on iOS | MediaPipe wasm needs network — make sure the device has Wi-Fi the first time |
| Network requests blocked on Android | `capacitor.config.json` → `"allowMixedContent": true` only for local dev with HTTP backends |
| 7-day sideload expires | Re-run `npm run ios` and re-trust on phone, or pay $99 for a proper provisioning profile |

---

## File-by-file recap

- **WeavAI_FINAL_FIXED.html** (one level up) — the entire app: UI, sizing algorithm, PhotoFit (MediaPipe), Style DNA, Fit Heat Map
- **scripts/sync-web.js** — copies HTML into `www/`, patches the API base URL, writes the PWA manifest
- **capacitor.config.json** — splash + status bar + camera permission strings (shown in iOS prompts)
- **ios/App/App.xcodeproj** — open this in Xcode
- **android/** — open this folder in Android Studio
