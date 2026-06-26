import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../api/axios';

const FirebaseAuthContext = createContext(null);

/**
 * FirebaseAuthProvider
 *
 * After the user has logged into Flask (via Google OAuth), this provider:
 * 1. Fetches a Firebase Custom Token from /api/firebase-token
 * 2. Signs into Firebase with that token
 * 3. Exposes `firebaseUser` and `firebaseReady` to all child components
 *
 * This allows every page's onValue() listener to work because the Firebase
 * web SDK is now authenticated with the same UID as the backend session.
 */
export function FirebaseAuthProvider({ children }) {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        // Listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            if (user) {
                setFirebaseReady(true);
            }
        });

        // Attempt to sign into Firebase using a custom token from the backend
        const signIntoFirebase = async () => {
            try {
                const res = await api.get('/firebase-token');
                if (res.data.token) {
                    await signInWithCustomToken(auth, res.data.token);
                    // onAuthStateChanged above will set firebaseReady = true
                }
            } catch (err) {
                // User may not be logged into Flask yet — that's fine
                // Pages will fall back to API calls if firebaseReady stays false
                console.warn('Firebase sign-in skipped (not logged in yet):', err?.response?.status);
                setFirebaseReady(false);
            }
        };

        signIntoFirebase();

        return () => unsubscribe();
    }, []);

    return (
        <FirebaseAuthContext.Provider value={{ firebaseUser, firebaseReady }}>
            {children}
        </FirebaseAuthContext.Provider>
    );
}

export function useFirebaseAuth() {
    return useContext(FirebaseAuthContext);
}

/** Call this after a successful Flask login to trigger Firebase sign-in */
export async function signIntoFirebase() {
    try {
        const res = await api.get('/firebase-token');
        if (res.data.token) {
            await signInWithCustomToken(auth, res.data.token);
        }
    } catch (err) {
        console.error('Failed to sign into Firebase:', err);
    }
}

/** Call this on logout */
export async function signOutOfFirebase() {
    try {
        await signOut(auth);
    } catch (err) {
        console.error('Firebase sign-out error:', err);
    }
}
