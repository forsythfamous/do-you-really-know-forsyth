# Firebase Setup & Cloud Firestore Deployment Guide for Forsyth

This document details the exact steps Forsyth must complete in the Firebase Console to activate cloud synchronization for **Do You Really Know Forsyth?**.

---

## 1. Firebase Console Setup Steps

### Step A: Create or Open Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or select an existing project) and name it (e.g. `forsyth-quiz`).
3. Google Analytics can be enabled or disabled according to preference.

### Step B: Enable Cloud Firestore
1. In the left navigation, open **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a cloud region close to your friends (e.g., `nam5 / us-central` or `eur3 / europe-west`).
4. Select **Start in production mode** (our `firestore.rules` will secure the data).
5. Click **Create**.

### Step C: Enable Authentication Providers
1. In the left navigation, open **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Click **Anonymous**, toggle **Enable**, and click **Save**. *(Critical: This allows friends to submit results securely without seeing any login screen).*
   - Click **Add new provider > Email/Password**, toggle **Enable** (leave Email link disabled), and click **Save**. *(Used for Forsyth's admin login).*

### Step D: Create Forsyth's Admin User
1. Under **Authentication > Users**, click **Add user**.
2. Enter Forsyth's private administrator email and a strong password.
3. Once created, copy the generated **User UID** column value (e.g., `u8Zk29...`).
4. Save this UID for the next step.

### Step E: Obtain Web App Configuration
1. Go to **Project Settings** (gear icon in the top left).
2. Under the **General** tab, scroll down to **Your apps** and click the **Web icon (`</>`)**.
3. Register the app (e.g. `Do You Really Know Forsyth Web`).
4. Firebase will display `firebaseConfig` with:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 2. Environment Variables Configuration

Set these environment variables in your hosting environment (or local `.env`):

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Forsyth's Admin UID copied from Firebase Auth Users table:
VITE_ADMIN_UID="your-admin-user-uid"
```

---

## 3. Deploying Firestore Security Rules

1. In `firestore.rules`, replace `REPLACE_WITH_FORSYTH_ADMIN_UID` with your actual User UID from Step 1D:
   ```javascript
   request.auth.uid == 'your-admin-user-uid'
   ```
2. Either:
   - **Option A (Firebase Console)**: Go to **Firestore Database > Rules** tab, paste the entire content of `firestore.rules`, and click **Publish**.
   - **Option B (Firebase CLI)**: Run `firebase deploy --only firestore:rules`.

---

## 4. Testing Submissions from a Second Device / Browser

1. Open the public app URL on a second phone or in an incognito window.
2. Select either **Quick Play** or **Full Challenge**.
3. Choose either **Named** or **Anonymous**.
4. Complete the quiz and optionally submit or skip the Honest Room.
5. On Forsyth's admin device:
   - Navigate to `/#/admin`.
   - Log in with your admin email and password.
   - The admin badge will indicate **Cloud Connected**.
   - The submission will appear in the dashboard list and aggregate analytics immediately.
