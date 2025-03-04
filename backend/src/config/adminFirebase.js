import { initializeApp } from "firebase/app";

import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyDFMc2Ftmdv4lq-634gwOdxeoF76_N357U",
    authDomain: "gp-trial-cea37.firebaseapp.com",
    projectId: "gp-trial-cea37",
    storageBucket: "gp-trial-cea37.firebasestorage.app",
    messagingSenderId: "935784147520",
    appId: "1:935784147520:web:4a9e718b97134575a7cda5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app)

export { db }