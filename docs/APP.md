# Do You Really Know Forsyth? (application guide)

A lightweight, high-craft social friendship quiz web application built with React, TypeScript, Tailwind CSS, Firebase Firestore, and Gemini AI commentary.

---

## Vercel Deployment Guide

Follow these steps to deploy the application on [Vercel](https://vercel.com):

### 1. Push Repository to GitHub
Ensure all code and configurations are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import Repository into Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository and click **Import**.

### 3. Build & Output Settings
Vercel automatically detects Vite. Verify or configure the build settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (or `vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

*(Note: The serverless function under `api/commentary.ts` is automatically discovered by Vercel and deployed to `/api/commentary` without requiring any persistent Express server).*

### 4. Configure Environment Variables
In the Vercel project configuration (**Settings** > **Environment Variables**), add the following:

#### Client-Side Variables (Firebase & Admin Authorization):
- `VITE_FIREBASE_API_KEY`: Your Firebase project API key
- `VITE_FIREBASE_AUTH_DOMAIN`: `your-project-id.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g. `forsyth-quiz-app`)
- `VITE_FIREBASE_STORAGE_BUCKET`: `your-project-id.appspot.com`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase web app ID
- `VITE_ADMIN_UID`: Forsyth's Firebase Auth User UID (from Firebase Console > Authentication > Users)

#### Server-Only Variable (AI Commentary):
- `GEMINI_API_KEY`: Google Gemini API key (kept strictly server-side in `api/commentary.ts`, never prefixed with `VITE_`)

### 5. Redeploy
After saving all environment variables:
1. Go to the **Deployments** tab in Vercel.
2. Click the three dots on the latest deployment and select **Redeploy** (or trigger a new git push).

### 6. Verification Checklist
Once deployed:
1. **Test Commentary Endpoint**:
   - Send a `POST` request to `https://your-domain.vercel.app/api/commentary` with a valid JSON body:
     ```json
     {
       "participantLabel": "Test Friend",
       "mode": "quick",
       "correctCount": 10,
       "totalQuestions": 12,
       "score": 83,
       "tier": "Inner-Circle Material"
     }
     ```
   - Verify it responds with HTTP 200 and commentary (or graceful fallback).
2. **Test Quiz Submission in Incognito Mode**:
   - Open your deployed URL in an Incognito / Private browser window.
   - Complete either **Quick Play** or **Full Challenge** (as Named or Anonymous).
   - Complete or skip the Honest Room.
3. **Verify Admin Dashboard**:
   - In your authenticated admin browser session, navigate to `/#/admin`.
   - Confirm that the new Incognito submission appears in real-time in the admin table.

---

## Local Development

To run the application locally with Express and Vite dev middleware:

```bash
# Install dependencies
npm install

# Start local dev server (port 3000)
npm run dev

# Run automated verification test suite
npm test

# Build for production
npm run build

# Type check
npm run lint
```
