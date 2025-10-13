// Firebase Configuration
// Web App's Firebase configuration

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7XU0jZuEpVS_TFfBiFdmTkz6vtWE44eU",
  authDomain: "assignment3-906c0.firebaseapp.com",
  projectId: "assignment3-906c0",
  storageBucket: "assignment3-906c0.firebasestorage.app",
  messagingSenderId: "1000372794623",
  appId: "1:1000372794623:web:80e7d99b07f60b0d7508ca"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

export default app
