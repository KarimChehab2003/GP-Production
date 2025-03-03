// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFMc2Ftmdv4lq-634gwOdxeoF76_N357U",
    authDomain: "gp-trial-cea37.firebaseapp.com",
    projectId: "gp-trial-cea37",
    storageBucket: "gp-trial-cea37.firebasestorage.app",
    messagingSenderId: "935784147520",
    appId: "1:935784147520:web:4a9e718b97134575a7cda5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)