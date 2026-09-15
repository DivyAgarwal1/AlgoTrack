import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD_ChyQegjMiV9FMUylKIUF-LssomnbmY4",
  authDomain: "cp-tracker-6e4a9.firebaseapp.com",
  projectId: "cp-tracker-6e4a9",
  storageBucket: "cp-tracker-6e4a9.firebasestorage.app",
  messagingSenderId: "650644283121",
  appId: "1:650644283121:web:86719be4b615c5770f1350",
  measurementId: "G-503YNB0HCQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in your app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Offline Persistence (Cache-First Architecture)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Firebase offline persistence error:", err.code);
});
