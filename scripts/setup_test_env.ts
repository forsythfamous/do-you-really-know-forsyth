// Supply mock Firebase configuration internally so tests are independent of
// developer secrets and pass cleanly from a fresh clone or exported ZIP without a .env file.
if (!process.env.VITE_FIREBASE_API_KEY) {
  process.env.VITE_FIREBASE_API_KEY = 'mock-firebase-api-key-test-12345';
}
if (!process.env.VITE_FIREBASE_PROJECT_ID) {
  process.env.VITE_FIREBASE_PROJECT_ID = 'mock-quiz-project-test';
}
if (!process.env.VITE_FIREBASE_APP_ID) {
  process.env.VITE_FIREBASE_APP_ID = '1:1234567890:web:mock123456';
}
if (!process.env.VITE_ADMIN_UID) {
  process.env.VITE_ADMIN_UID = 'mock-admin-uid-test';
}
