// src/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1RP7vszShn4CwoBN0CpUjLoSPOnbZvm0",
  authDomain: "tokyo-trip-7997a.firebaseapp.com",
  projectId: "tokyo-trip-7997a",
  storageBucket: "tokyo-trip-7997a.firebasestorage.app",
  messagingSenderId: "2626675654",
  appId: "1:2626675654:web:fcdc7d7aae68268e0e88c7",
  measurementId: "G-Q7KJ2RK1S6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { db, storage, analytics };