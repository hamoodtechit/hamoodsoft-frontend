# App Development Guide

This document outlines the complete process for building the different versions of the School Management application (PWA, Android APK, and Windows Desktop App).

---

## Method 1: Progressive Web App (PWA)
The easiest way for users to install the application on **both** Mobile and PC.
1. The user navigates to the live website (e.g., `https://test.patwaryinstitute.com`) in Chrome or Edge.
2. They click the **"Install App"** icon in the URL bar (or "Add to Home Screen" on mobile).
3. The app is installed natively on their Start Menu/Homescreen and behaves exactly like a native app.

**No build process is required for this method**, as it is automatically handled by the Next.js PWA plugin.

---

## Method 2: Android Application (APK via Capacitor)

This method wraps the live Next.js website into a downloadable Android `.apk` file.

### Prerequisites
- The Android SDK must be installed at `~/Android/Sdk`.
- **Java 21** must be installed. (We are using a standalone portable version located at `~/jdk-21.0.2`).

### How to Build a New APK
Whenever you change the target URL in `capacitor.config.ts` or add native plugins, you must rebuild the APK.

Run the following commands in your terminal:

```bash
# 1. Ensure Capacitor is synced with the latest config
npx cap sync android

# 2. Tell the terminal where the Android SDK is located
export ANDROID_HOME=~/Android/Sdk

# 3. Ensure Java 21 is used (using the portable JDK we downloaded)
export JAVA_HOME=~/jdk-21.0.2
export PATH=$JAVA_HOME/bin:$PATH

# 4. Go to the Android folder
cd /data/projects/hamoodTechIt/school-frontend/android

# 5. Build the APK
./gradlew assembleDebug
```

Your compiled APK will be located at:
`/data/projects/hamoodTechIt/school-frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## Method 3: Windows Desktop Application (Electron)

This method wraps the live Next.js website into a downloadable Windows `.exe` desktop application.

### Configuration
The target URL is set in the `electron/main.js` file.
```javascript
// Example inside electron/main.js
mainWindow.loadURL("https://test.patwaryinstitute.com"); 
```

### How to Build the `.exe`
Run this command from the root of your frontend project:
```bash
pnpm run electron:build
```

**Understanding the Output:**
- Because you are building on a **Linux** machine, `electron-builder` requires `wine` (Windows Emulator) to compress the app into a final `School Management Setup.exe` installer.
- If your Linux `wine` crashes (e.g., `kernel32.dll` or `syswow64` missing), you have two options:

#### Option A: The Portable Zip (Recommended if Wine is broken)
You do not need to fix Wine! 
1. The command still successfully generated the raw Windows application inside the `/dist-electron/win-unpacked/` folder.
2. Simply copy that `win-unpacked` folder, zip it up (`.zip`), and send it to your Windows users.
3. They can extract the zip and double-click `School Management.exe` to run the app immediately!

#### Option B: Fix Wine to generate the `Setup.exe` installer
If you specifically want the single `Setup.exe` installer file, you must add 32-bit support to your Linux server by running:
```bash
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install -y wine64 wine32
```
Once installed, run `pnpm run electron:build` again.
