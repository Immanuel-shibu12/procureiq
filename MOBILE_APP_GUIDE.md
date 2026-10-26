# MediProcureIQ — Mobile App Guide (Capacitor Android)

MediProcureIQ has been converted into a native Android application using **Capacitor**. 
This wraps the complete React + Vite application (including the **"Experience at the Edge" Welcome Portal**, **Dashboard Analytics**, **Fit & Risk Engine**, **Cloud ML Analytics**, and the **MediProcure AI Chatbot**) into a native Android project with zero code duplication.

---

## 📁 Native Project Location

The Android native project is located at:
```
procureiq/frontend/android/
```

Key configuration files:
* [`capacitor.config.json`](procureiq/frontend/capacitor.config.json): App ID (`com.mediprocure.iq`), App Name (`MediProcureIQ`), and cleartext HTTP settings for local development.
* [`AndroidManifest.xml`](procureiq/frontend/android/app/src/main/AndroidManifest.xml): Configured with `INTERNET` permissions and `usesCleartextTraffic="true"` to communicate with local development servers.
* [`api.js`](procureiq/frontend/src/api.js): Automatically detects mobile runtime and routes API calls to the host machine.

---

## ⚡ Quick Start: Building & Running the Android App

### 1. Ensure the Backend Server is Running
From your computer terminal:
```bash
cd procureiq/backend
npm start
```
*(Backend runs on `http://localhost:5000`)*.

---

### 2. Sync Web Assets to Android
Whenever you modify frontend code, run this command inside `procureiq/frontend`:
```bash
cd procureiq/frontend
npm run mobile:sync
```
*(This builds the Vite web bundle and copies assets into `android/app/src/main/assets/public/`)*.

---

### 3. Open in Android Studio
Run:
```bash
cd procureiq/frontend
npm run mobile:open
```
*Or manually open Android Studio and choose **Open an Existing Project**, navigating to `procureiq/frontend/android`.*

---

### 4. Build the APK or Run on Device

#### Option A: Run on Android Emulator or Physical Phone
1. Connect your Android phone via USB (with **USB Debugging** enabled in Developer Options) or start an Android Virtual Device (AVD) emulator in Android Studio.
2. Click the green **Run (▶)** button in Android Studio toolbar.
3. The app will install and open directly on your device.

#### Option B: Generate Standalone `.apk` File
1. In Android Studio, go to the top menu:
   **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
2. Once compilation finishes, click **locate** in the popup to retrieve your `.apk` file:
   ```
   procureiq/frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. Transfer this `.apk` to any Android phone via WhatsApp, USB, or Google Drive, tap to install, and run!

---

## 🌐 Network Configuration: Connecting Mobile to Backend

| Environment | How It Connects | Configuration |
| :--- | :--- | :--- |
| **Android Emulator** | Connects to `10.0.2.2:5000` | **Automatic!** Handled out of the box in `api.js`. |
| **Physical Phone (Local Wi-Fi)** | Connects to PC IP (`10.3.4.175:5000`) | Ensure phone is on the same Wi-Fi network as PC. |
| **Production / Cloud (GCP)** | Connects to Cloud Run URL | Update URL in app or set `localStorage.setItem('mediprocure_backend_url', 'https://your-cloud-run-url')`. |

---

## 🛠️ Handy Mobile npm Scripts

Inside `procureiq/frontend/`:
* `npm run mobile:sync`: Rebuilds the frontend and updates the Android native project.
* `npm run mobile:open`: Launches Android Studio with the project loaded.
* `npm run mobile:run`: Builds and runs on a connected device via CLI.
