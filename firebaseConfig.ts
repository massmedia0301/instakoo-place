import firebase from "firebase/compat/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCRk9A4QtfSsfDLstGA0Fx0GKgDtw7sVk0",
  authDomain: "instakoo-b96b7.firebaseapp.com",
  projectId: "instakoo-b96b7",
  storageBucket: "instakoo-b96b7.firebasestorage.app",
  messagingSenderId: "556172527576",
  appId: "1:556172527576:web:07284f258a210615b5d4ad",
  measurementId: "G-ZYLBHSK11Q"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);