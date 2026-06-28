import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { GoogleOAuthProvider } from '@react-oauth/google';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext.jsx';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1016270586940-lgtgjv99huagci05ekui0c75rhmp9ffv.apps.googleusercontent.com';
console.log('🔑 Google Client ID:', clientId);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={clientId}>
            <FirebaseAuthProvider>
                <App />
            </FirebaseAuthProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
