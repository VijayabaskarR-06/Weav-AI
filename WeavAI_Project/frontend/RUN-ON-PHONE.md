# Run Weav AI on your phone

Two paths — pick whichever fits your moment.

| | **Expo Go QR (fastest)** | **APK file** |
|---|---|---|
| Install | Expo Go app from Play Store / App Store | Sideload .apk directly |
| Build time | None — instant | ~8 min (Expo cloud builds it) |
| Latest HTML changes | Live as you save | Need to rebuild |
| Works offline | No (needs dev server running) | Yes |
| Network requirement | Phone + Mac on internet (or same Wi-Fi) | Just to download the APK once |

---

## A) Expo Go — scan a QR code

### 1. Get Expo Go on your phone
- **Android:** [Play Store → Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iPhone:** [App Store → Expo Go](https://apps.apple.com/app/expo-go/id982107779)

Make sure your phone's Expo Go is up-to-date — older versions don't support SDK 54.

### 2. Start the dev server on the Mac

```bash
cd /Users/vijayabaskar/weavailive/Weav-AI/WeavAI_Project/frontend
npm install        # one time only
npm start          # uses --tunnel so phone doesn't need same Wi-Fi
```

Terminal prints a giant QR code in ASCII art and a URL like `exp://u.expo.dev/...`.

### 3. Scan it

- **Android:** Open Expo Go → "Scan QR Code" tab → point at the terminal.
- **iPhone:** Open the iOS Camera app → point at the QR → tap the "Open in Expo Go" banner that appears.

App boots in ~5–15 seconds. The full HTML demo loads inside the native WebView — identical fonts, gold/navy theme, PhotoFit, sizing.

Press `r` in the terminal to reload; press `Cmd+S` on the HTML and changes flow through automatically.

### Troubleshooting

| Problem | Fix |
|---|---|
| "This project uses SDK 54 which is not supported by this version of Expo Go" | Update Expo Go from the store, or temporarily switch to `npm start:lan` (which uses LAN — your phone must be on the same Wi-Fi) |
| "Network response timed out" | Try `npm start:lan` instead of `npm start`. The tunnel can be slow; LAN is faster if you're on the same Wi-Fi. |
| QR scan opens browser instead of Expo Go | On Android, scan from inside Expo Go's "Scan QR Code" tab, not the system camera. |
| White screen after splash | Run `npm run prebundle` to regenerate `src/htmlBundle.js` from the latest HTML, then restart. |

---

## B) APK file (cloud-built, no Android Studio needed)

EAS Build is Expo's hosted CI. It compiles the Android APK on Expo's servers, you download a `.apk` link when it's done. **Free tier: 30 builds/month.**

### One-time setup

```bash
cd /Users/vijayabaskar/weavailive/Weav-AI/WeavAI_Project/frontend
npx eas login                  # sign in / create Expo account (free)
npx eas init --non-interactive # links this project to your Expo account
```

### Build the APK

```bash
npm run build:apk
# (equivalent to:  eas build --platform android --profile preview)
```

You'll see:
```
✔ Build started, it may take a few minutes to complete.
You can monitor the build at https://expo.dev/accounts/<you>/projects/weavai/builds/<id>
```

Wait ~8 minutes. When done, the same URL has a big **Download** button → `application-<id>.apk`.

### Install on your phone

1. Email/AirDrop/USB the .apk to your phone, or just open the EAS build URL on your phone and tap **Download**.
2. Tap the .apk → Android will warn "install from unknown sources" — go to **Settings → Apps → Special Access → Install Unknown Apps → Chrome (or Files)** and allow it.
3. Tap Install. Weav AI now appears as a normal app on your home screen.

### Rebuilding after HTML changes

Just re-run:
```bash
npm run build:apk
```
The `prebundle` script automatically picks up `WeavAI_FINAL_FIXED.html` → `src/htmlBundle.js` so every build has the latest design and sizing logic.

---

## What's in this app vs. the browser demo?

| Feature | Browser demo | Expo Go / APK |
|---|---|---|
| Splash screen, gradient bg, animations | ✅ | ✅ (identical) |
| Cormorant Garamond + Jost fonts | ✅ | ✅ (loaded from Google Fonts the first launch, cached after) |
| Sizing algorithm (center-weighted) | ✅ | ✅ |
| PhotoFit body scanner | ✅ | ✅ (uses native camera via WebView's `<input capture>`) |
| Style DNA, Fit Heat Map | ✅ | ✅ |
| Google Sign-In | ✅ | ⚠️ Disabled in WebView origin — use email/password instead |
| LocalStorage persistence | ✅ | ✅ (the WebView has its own localStorage on-device) |
| Backend (Railway FastAPI + MySQL) | ✅ | ✅ |

---

## File map

- `App.js` — Expo wrapper. ~70 lines. WebView config + back-button handler.
- `src/htmlBundle.js` — auto-generated; the entire `WeavAI_FINAL_FIXED.html` as a JS string.
- `scripts/bundle-html.js` — regenerates `src/htmlBundle.js` (runs automatically before `npm start` / `build:apk`).
- `app.json` — Expo config (name, bundle ids, iOS/Android permission strings, splash bg colour).
- `eas.json` — build profiles (development / preview / production).
