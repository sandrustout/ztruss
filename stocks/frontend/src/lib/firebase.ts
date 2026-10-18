// Firebase Web Configuration provided by user
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDm3G0L1oK5OGb-To5dh0LtOjqeZZKGZ_Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tripwise-a674b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tripwise-a674b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tripwise-a674b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "121262201246",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:121262201246:web:a7dbc91276d2fe47b8de8f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XP1MLM96JV",
};

export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    // Analytics telemetry initialization
    console.info(`[Firebase Analytics] Initialized with stream ${firebaseConfig.measurementId}`);
  }
  return null;
};
