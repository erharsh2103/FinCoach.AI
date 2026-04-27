import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB80pWHIbf8RX5P1TSmgwpso5QN5uK7BCY",
  authDomain: "fincoach-ai-boolean.firebaseapp.com",
  projectId: "fincoach-ai-boolean",
  storageBucket: "fincoach-ai-boolean.firebasestorage.app",
  messagingSenderId: "1042652718028",
  appId: "1:1042652718028:web:c0ba21544509c649907369",
  measurementId: "G-RYVEW5K7ZW"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;

export { firebaseConfig };
