// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPhpxdq3NeFcV3JL2ix-uRqj90lb4rIO8",
  authDomain: "friscord-633e2.firebaseapp.com",
  projectId: "friscord-633e2",
  storageBucket: "friscord-633e2.appspot.com",
  messagingSenderId: "694958934140",
  appId: "1:694958934140:web:2596c1ca4d5f8a988e61f9",
  measurementId: "G-EC89KX1XY8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)