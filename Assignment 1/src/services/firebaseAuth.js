// Firebase Authentication Service
// Provides registration, login, logout and other authentication features

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

// Google authentication provider
const googleProvider = new GoogleAuthProvider()

/**
 * Register a new user
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {object} userData - Additional user data (username, gender, reason)
 * @returns {Promise<object>} User information
 */
export async function registerUser(email, password, userData = {}) {
  try {
    // Create Firebase user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update user display name
    if (userData.username) {
      await updateProfile(user, {
        displayName: userData.username
      })
    }

    // Save additional user information to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      username: userData.username || '',
      gender: userData.gender || '',
      reason: userData.reason || '',
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })

    return {
      uid: user.uid,
      email: user.email,
      username: userData.username || '',
      gender: userData.gender || '',
      reason: userData.reason || '',
      role: 'user'
    }
  } catch (error) {
    console.error('Registration error:', error)
    throw handleAuthError(error)
  }
}

// User login

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    // Get user details from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userData = userDoc.exists() ? userDoc.data() : {}
    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      lastLogin: new Date().toISOString()
    }, { merge: true })
    return {
      uid: user.uid,
      email: user.email,
      username: user.displayName || userData.username || '',
      gender: userData.gender || '',
      reason: userData.reason || '',
      role: userData.role || 'user',
      emailVerified: user.emailVerified
    }
  } catch (error) {
    console.error('Login error:', error)
    throw handleAuthError(error)
  }
}

// Google login
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    // Check if user already exists
    const userDocRef = doc(db, 'users', user.uid)
    const userDoc = await getDoc(userDocRef)
    if (!userDoc.exists()) {
      // New user, create document
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        username: user.displayName || '',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      })
    } else {
      // Update last login time
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true })
    }
    const userData = userDoc.exists() ? userDoc.data() : {}
    return {
      uid: user.uid,
      email: user.email,
      username: user.displayName || userData.username || '',
      role: userData.role || 'user',
      emailVerified: user.emailVerified
    }
  } catch (error) {
    console.error('Google login error:', error)
    throw handleAuthError(error)
  }
}
// User logout
export async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error)
    throw handleAuthError(error)
  }
}
// Send password to reset email
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Password reset error:', error)
    throw handleAuthError(error)
  }
}
// Get current user information
export async function getCurrentUser() {
  const user = auth.currentUser
  if (!user) return null
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userData = userDoc.exists() ? userDoc.data() : {}
    return {
      uid: user.uid,
      email: user.email,
      username: user.displayName || userData.username || '',
      gender: userData.gender || '',
      reason: userData.reason || '',
      role: userData.role || 'user',
      emailVerified: user.emailVerified
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Listen to authentication state changes
export function onAuthStateChange(callback) 
{
  return onAuthStateChanged(auth, async (user) => {
    if (user) 
    {
      const userData = await getCurrentUser()
      callback(userData)
    } else 
    {
      callback(null)
    }
  })
}

// Update user role (requires admin permission or Cloud Functions)
export async function updateUserRole(uid, role) {
  try {
    await setDoc(doc(db, 'users', uid), {
      role: role
    }, { merge: true })
  } catch (error) {
    console.error('Update role error:', error)
    throw handleAuthError(error)
  }
}

// Handle Firebase authentication errors
function handleAuthError(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/operation-not-allowed': 'Operation not allowed.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/popup-closed-by-user': 'Login popup was closed.',
    'auth/cancelled-popup-request': 'Login cancelled.'
  }

  const message = errorMessages[error.code] || error.message || 'An error occurred during authentication.'
  return new Error(message)
}

export default {
  registerUser,
  loginUser,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  getCurrentUser,
  onAuthStateChange,
  updateUserRole
}
