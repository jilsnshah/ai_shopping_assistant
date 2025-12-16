// Firebase configuration for frontend
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCIGRztRPqBItjL2VGraTGlH2RLBEFZWgo",
    authDomain: "ai-shopping-assistant-jils.firebaseapp.com",
    databaseURL: "https://ai-shopping-assistant-jils-default-rtdb.firebaseio.com",
    projectId: "ai-shopping-assistant-jils",
    storageBucket: "ai-shopping-assistant-jils.firebasestorage.app",
    messagingSenderId: "419690691399",
    appId: "1:419690691399:web:0ae21a6b4e4c28c63cc9ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get database instance
export const database = getDatabase(app);

// Get storage instance
export const storage = getStorage(app);
