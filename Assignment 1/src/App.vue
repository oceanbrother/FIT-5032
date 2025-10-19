<template>
  <div>
    <!-- Skip to main content link for keyboard users -->
    <a href="#main-content" class="skip-link" @click="skipToMain">
      Skip to main content
    </a>

    <!-- Navigation Bar -->
    <nav 
      class="navbar navbar-expand-lg navbar-light bg-light mb-4" 
      role="navigation" 
      aria-label="Main navigation">
      <div class="container">
        <router-link 
          to="/" 
          class="navbar-brand" 
          style="cursor: pointer; text-decoration: none;"
          aria-label="Hiking Trails home page">
          Hiking Trails
        </router-link>
        <div class="navbar-nav ms-auto" role="menubar">
          <router-link 
            to="/trails" 
            class="nav-link btn btn-outline-success me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/trails' ? 'page' : undefined"
            aria-label="Home - View all hiking trails">
            <i class="bi bi-house-fill me-1" aria-hidden="true"></i>Home
          </router-link>
          <router-link 
            to="/map" 
            class="nav-link btn btn-outline-danger me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/map' ? 'page' : undefined"
            aria-label="Trail Map - View trails on interactive map">
            <i class="bi bi-map me-1" aria-hidden="true"></i>Trail Map
          </router-link>
          <router-link 
            to="/tables" 
            class="nav-link btn btn-outline-primary me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/tables' ? 'page' : undefined"
            aria-label="Data Tables - View trail and rating data">
            <i class="bi bi-table me-1" aria-hidden="true"></i>Data Tables
          </router-link>
          <router-link 
            to="/email" 
            class="nav-link btn btn-outline-warning me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/email' ? 'page' : undefined"
            aria-label="Send Email - Contact trail organizers">
            <i class="bi bi-envelope-fill me-1" aria-hidden="true"></i>Send Email
          </router-link>
          <router-link 
            to="/bookings" 
            class="nav-link btn btn-outline-info me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/bookings' ? 'page' : undefined"
            aria-label="Bookings - Reserve your trail">
            <i class="bi bi-calendar-check me-1" aria-hidden="true"></i>Bookings
          </router-link>
          <router-link 
            to="/ai-recommendations" 
            class="nav-link btn btn-outline-primary me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/ai-recommendations' ? 'page' : undefined"
            aria-label="AI Recommendations - Get personalized trail suggestions">
            <i class="bi bi-stars me-1" aria-hidden="true"></i>AI Recommendations
          </router-link>
          <router-link 
            to="/firebase-test" 
            class="nav-link btn btn-outline-secondary me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/firebase-test' ? 'page' : undefined"
            aria-label="Firebase Test - Testing page">
            <i class="bi bi-gear me-1" aria-hidden="true"></i>Firebase Test
          </router-link>
          <router-link 
            v-if="auth.isAuthenticated && auth.user?.role === 'admin'" 
            to="/dashboard" 
            class="nav-link btn btn-outline-success me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/dashboard' ? 'page' : undefined"
            aria-label="Dashboard - View statistics">
            <i class="bi bi-graph-up me-1" aria-hidden="true"></i>Dashboard
          </router-link>
          <router-link 
            v-if="auth.isAuthenticated && auth.user?.role === 'admin'" 
            to="/bulk-email" 
            class="nav-link btn btn-outline-warning me-2"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/bulk-email' ? 'page' : undefined"
            aria-label="Bulk Email - Send emails to users">
            <i class="bi bi-send-fill me-1" aria-hidden="true"></i>Bulk Email
          </router-link>
          <router-link 
            v-if="auth.isAuthenticated && auth.user?.role === 'admin'" 
            to="/admin" 
            class="nav-link btn btn-outline-primary me-2 admin-panel-btn"
            active-class="active"
            role="menuitem"
            :aria-current="$route.path === '/admin' ? 'page' : undefined"
            aria-label="Admin Panel - Manage trails and users">
            <i class="bi bi-gear-fill me-1" aria-hidden="true"></i>Admin Panel
          </router-link>
          <span 
            v-if="auth.isAuthenticated" 
            class="nav-link"
            role="status"
            :aria-label="`Logged in as ${auth.user.username || auth.user.email}${auth.user?.role ? ', role: ' + auth.user.role : ''}`">
            Hello, {{ auth.user.username || auth.user.email }}
            <span v-if="auth.user?.role" class="badge bg-primary ms-1" aria-label="User role">{{ auth.user.role }}</span>
          </span>
          <button 
            v-if="auth.isAuthenticated" 
            @click="logout" 
            class="btn btn-sm btn-outline-secondary ms-2"
            aria-label="Logout from your account">
            Logout
          </button>
          <button 
            v-else 
            ref="loginButtonRef"
            @click="openLogin" 
            class="btn btn-sm btn-primary ms-2"
            aria-label="Login to your account">
            Login
          </button>
        </div>
      </div>
    </nav>

    <!-- Router View (Main Content) -->
    <div id="main-content" ref="mainContent" tabindex="-1" role="main">
      <router-view></router-view>
    </div>

    <!-- Login and Register Modal -->
    <div 
      v-if="showAuth" 
      class="auth-backdrop" 
      @click.self="closeLogin"
      @keydown.esc="closeLogin">
      <div 
        ref="modalRef"
        class="auth-modal card shadow-lg"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="showPasswordReset ? 'modal-title-reset' : (authMode === 'login' ? 'modal-title-login' : 'modal-title-register')"
        @keydown="handleModalKeydown">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong 
            :id="showPasswordReset ? 'modal-title-reset' : (authMode === 'login' ? 'modal-title-login' : 'modal-title-register')">
            {{ showPasswordReset ? 'Reset Password' : (authMode === 'login' ? 'Login' : 'Register') }}
          </strong>
          <button 
            ref="closeButtonRef"
            @click="closeLogin" 
            class="btn-close btn-close-white" 
            aria-label="Close dialog">
          </button>
        </div>
        <div class="card-body">
          <!-- Error alert with role for screen readers -->
          <div 
            v-if="authError" 
            class="alert alert-danger py-2" 
            role="alert"
            aria-live="assertive">
            <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
            {{ authError }}
          </div>
          
          <!-- Password Reset Form -->
          <div v-if="showPasswordReset">
            <p class="text-muted mb-3" id="reset-instructions">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div class="form-floating mb-3">
              <input 
                id="reset-email"
                ref="resetEmailRef"
                type="email" 
                class="form-control" 
                placeholder="Email" 
                v-model="resetEmail"
                :disabled="authLoading"
                aria-required="true"
                aria-describedby="reset-instructions"
              />
              <label for="reset-email">Email</label>
            </div>
            <button 
              class="btn btn-primary w-100 mb-3" 
              @click="doPasswordReset"
              :disabled="authLoading || !resetEmail"
              :aria-busy="authLoading">
              {{ authLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
            <div class="text-center">
              <small class="text-muted">
                <a 
                  href="#" 
                  @click.prevent="showPasswordReset = false" 
                  class="text-primary"
                  aria-label="Go back to login form">
                  Back to Login
                </a>
              </small>
            </div>
          </div>

          <!-- Login Form -->
          <div v-else-if="authMode === 'login'">
            <div class="form-floating mb-3">
              <input 
                id="login-email"
                ref="loginEmailRef"
                type="email" 
                class="form-control" 
                placeholder="Email" 
                v-model="loginForm.email"
                :disabled="authLoading"
                @keyup.enter="doLogin"
                aria-required="true"
              />
              <label for="login-email">Email</label>
            </div>
            <div class="form-floating mb-3">
              <input 
                id="login-password"
                type="password" 
                class="form-control" 
                placeholder="Password" 
                v-model="loginForm.password"
                :disabled="authLoading"
                @keyup.enter="doLogin"
                aria-required="true"
              />
              <label for="login-password">Password</label>
            </div>
            <div class="text-end mb-3">
              <small>
                <a 
                  href="#" 
                  @click.prevent="showPasswordReset = true" 
                  class="text-primary"
                  aria-label="Forgot your password? Reset it">
                  Forgot Password?
                </a>
              </small>
            </div>
            <button 
              class="btn btn-primary w-100 mb-3" 
              @click="doLogin"
              :disabled="authLoading || !loginForm.email || !loginForm.password"
              :aria-busy="authLoading">
              {{ authLoading ? 'Logging in...' : 'Login' }}
            </button>

            <!-- Divider -->
            <div class="divider mb-3" role="separator" aria-label="or">
              <span>OR</span>
            </div>

            <!-- Google Login Button -->
            <button 
              class="btn btn-outline-dark w-100 mb-3 d-flex align-items-center justify-content-center gap-2" 
              @click="doGoogleLogin"
              :disabled="authLoading"
              :aria-busy="authLoading"
              aria-label="Continue with Google">
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            <div class="text-center">
              <small class="text-muted">Don't have an account? 
                <a 
                  href="#" 
                  @click.prevent="switchAuthMode" 
                  class="text-primary"
                  aria-label="Switch to registration form">
                  Register here
                </a>
              </small>
            </div>
          </div>
          
          <!-- Register Form -->
          <div v-else>
            <div class="form-floating mb-3">
              <input 
                id="reg-username"
                ref="regUsernameRef"
                type="text" 
                class="form-control" 
                placeholder="Username" 
                v-model="regForm.username"
                :disabled="authLoading"
                aria-required="true"
                aria-describedby="username-help"
              />
              <label for="reg-username">Username</label>
              <small id="username-help" class="form-text text-muted">Minimum 3 characters</small>
            </div>
            <div class="form-floating mb-3">
              <input 
                id="reg-email"
                type="email" 
                class="form-control" 
                placeholder="Email" 
                v-model="regForm.email"
                :disabled="authLoading"
                aria-required="true"
              />
              <label for="reg-email">Email</label>
            </div>
            <div class="form-floating mb-3">
              <input 
                id="reg-password"
                type="password" 
                class="form-control" 
                placeholder="Password" 
                v-model="regForm.password"
                :disabled="authLoading"
                aria-required="true"
                aria-describedby="password-help"
              />
              <label for="reg-password">Password</label>
              <small id="password-help" class="form-text text-muted">Minimum 6 characters</small>
            </div>
            <div class="form-floating mb-3">
              <input 
                id="reg-confirm-password"
                type="password" 
                class="form-control" 
                placeholder="Confirm Password" 
                v-model="regForm.confirmPassword"
                :disabled="authLoading"
                aria-required="true"
              />
              <label for="reg-confirm-password">Confirm Password</label>
            </div>
            <div class="form-floating mb-3">
              <select 
                id="reg-gender"
                class="form-select" 
                v-model="regForm.gender" 
                :disabled="authLoading"
                aria-label="Select your gender (optional)">
                <option value="" disabled>Select Gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <label for="reg-gender">Gender (Optional)</label>
            </div>
            <div class="form-floating mb-3">
              <textarea
                id="reg-reason"
                class="form-control"
                placeholder="Tell us why you want to join hiking activities"
                style="height: 100px"
                v-model="regForm.reason"
                maxlength="300"
                :disabled="authLoading"
                aria-label="Tell us why you want to join hiking activities (optional)"
                aria-describedby="reason-help"
              ></textarea>
              <label for="reg-reason">Reason for joining (optional)</label>
              <small id="reason-help" class="form-text text-muted">Maximum 300 characters</small>
            </div>
            <button 
              class="btn btn-success w-100 mb-3" 
              @click="doRegister"
              :disabled="authLoading"
              :aria-busy="authLoading">
              {{ authLoading ? 'Creating Account...' : 'Register' }}
            </button>
            <div class="text-center">
              <small class="text-muted">Already have an account? 
                <a 
                  href="#" 
                  @click.prevent="switchAuthMode" 
                  class="text-primary"
                  aria-label="Switch to login form">
                  Login here
                </a>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, logout as authLogout, isAuthenticated, currentUser } from '@/services/auth'
// Firebase Authentication
import { 
  registerUser, 
  loginUser, 
  loginWithGoogle, 
  logoutUser, 
  resetPassword,
  onAuthStateChange 
} from '@/services/firebaseAuth'

const router = useRouter()

const auth = ref({
  isAuthenticated: false,
  user: null
})

const showAuth = ref(false)
const authError = ref('')
const authLoading = ref(false)
const loginForm = ref({ email: '', password: '' })
const regForm = ref({ username: '', email: '', password: '', confirmPassword: '', gender: '', reason: '' })
const authMode = ref('login')
const showPasswordReset = ref(false)
const resetEmail = ref('')

// Refs for accessibility
const mainContent = ref(null)
const loginButtonRef = ref(null)
const modalRef = ref(null)
const closeButtonRef = ref(null)
const loginEmailRef = ref(null)
const regUsernameRef = ref(null)
const resetEmailRef = ref(null)

// Firebase auth state listener unsubscribe function
let unsubscribeAuth = null

// Store the element that triggered modal opening for focus return
let modalTriggerElement = null

// User storage functions
const loadUsers = () => {
  const stored = localStorage.getItem('hikeUsers')
  return stored ? JSON.parse(stored) : []
}

const saveUsers = (users) => {
  localStorage.setItem('hikeUsers', JSON.stringify(users))
}

// Skip to main content function
const skipToMain = (e) => {
  e.preventDefault()
  mainContent.value?.focus()
  mainContent.value?.scrollIntoView({ behavior: 'smooth' })
}

// Focus trap for modal
const handleModalKeydown = (e) => {
  if (e.key === 'Escape') {
    closeLogin()
    return
  }

  // Tab key handling for focus trap
  if (e.key === 'Tab' && modalRef.value) {
    const focusableElements = modalRef.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const focusableArray = Array.from(focusableElements).filter(
      el => !el.disabled && el.offsetParent !== null
    )
    
    if (focusableArray.length === 0) return

    const firstElement = focusableArray[0]
    const lastElement = focusableArray[focusableArray.length - 1]

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }
}

// Open login box
const openLogin = (e) => {
  // Store the trigger element for focus return
  if (e && e.target) {
    modalTriggerElement = e.target
  } else {
    modalTriggerElement = loginButtonRef.value
  }
  
  showAuth.value = true
  authError.value = ''
}

// Close login box
const closeLogin = () => {
  showAuth.value = false
  authMode.value = 'login'
  showPasswordReset.value = false
  loginForm.value = { email: '', password: '' }
  regForm.value = { username: '', email: '', password: '', confirmPassword: '', gender: '', reason: '' }
  resetEmail.value = ''
  authError.value = ''
  authLoading.value = false
  
  // Return focus to the trigger element
  nextTick(() => {
    if (modalTriggerElement) {
      modalTriggerElement.focus()
      modalTriggerElement = null
    }
  })
}

// Perform login with Firebase
const doLogin = async () => {
  const { email, password } = loginForm.value
  authError.value = ''
  authLoading.value = true

  try {
    // use Firebase to login
    const userData = await loginUser(email, password)
    
    auth.value.isAuthenticated = true
    auth.value.user = userData
    
    //localStorage
    login(userData)
    
    closeLogin()
  } catch (error) {
    authError.value = error.message
  } finally {
    authLoading.value = false
  }
}

// Google login
const doGoogleLogin = async () => {
  authError.value = ''
  authLoading.value = true

  try {
    const userData = await loginWithGoogle()
    
    auth.value.isAuthenticated = true
    auth.value.user = userData
    
    login(userData)
    closeLogin()
  } catch (error) {
    if (error.message !== 'Login popup was closed.' && error.message !== 'Login cancelled.') {
      authError.value = error.message
    }
  } finally {
    authLoading.value = false
  }
}

// Perform password reset with Firebase
const doPasswordReset = async () => {
  authError.value = ''
  authLoading.value = true

  try {
    await resetPassword(resetEmail.value)
    authError.value = ''
    alert(`Password reset email sent to ${resetEmail.value}. Please check your inbox.`)
    showPasswordReset.value = false
    resetEmail.value = ''
  } catch (error) {
    authError.value = error.message
  } finally {
    authLoading.value = false
  }
}

// Perform registration with Firebase
const doRegister = async () => {
  authError.value = ''
  const { username, email, password, confirmPassword, gender, reason } = regForm.value
  
  if (!username || !email || !password || !confirmPassword) { 
    authError.value = 'Username, email, password and confirm password are required.'
    return 
  }
  
  if (username.length < 3) {
    authError.value = 'Username must be at least 3 characters.'
    return
  }
  
  if (password.length < 6) {
    authError.value = 'Password must be at least 6 characters.'
    return
  }

  if (password !== confirmPassword) {
    authError.value = 'Passwords do not match.'
    return
  }

  authLoading.value = true

  try {
    const userData = await registerUser(email, password, {
      username: username.trim(),
      gender: gender || '',
      reason: reason || ''
    })
    
    // Auto login after registration
    auth.value.isAuthenticated = true
    auth.value.user = userData
    
    login(userData)
    closeLogin()
  } catch (error) {
    authError.value = error.message
  } finally {
    authLoading.value = false
  }
}

// Switch between login and register modes
const switchAuthMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
  
  // Focus first input when switching modes
  nextTick(() => {
    if (authMode.value === 'login') {
      loginEmailRef.value?.focus()
    } else {
      regUsernameRef.value?.focus()
    }
  })
}

// Watch for modal and form changes to manage focus
watch(showAuth, (newValue) => {
  if (newValue) {
    // Modal opened - set focus and prevent body scroll
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      if (showPasswordReset.value) {
        resetEmailRef.value?.focus()
      } else if (authMode.value === 'login') {
        loginEmailRef.value?.focus()
      } else {
        regUsernameRef.value?.focus()
      }
    })
  } else {
    // Modal closed - restore body scroll
    document.body.style.overflow = ''
  }
})

watch(showPasswordReset, (newValue) => {
  if (newValue) {
    nextTick(() => {
      resetEmailRef.value?.focus()
    })
  }
})

// Logout
const logout = async () => {
  try {
    await logoutUser()
    auth.value.isAuthenticated = false
    auth.value.user = null
    authLogout()
    router.push('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Check authentication status on mount
onMounted(() => {
  // Firstcheck localStorage
  auth.value.isAuthenticated = isAuthenticated()
  auth.value.user = currentUser()

  // Then set up the Firebase authentication status listener
  unsubscribeAuth = onAuthStateChange((user) => {
    if (user) {
      auth.value.isAuthenticated = true
      auth.value.user = user
      login(user)
    } else {
      auth.value.isAuthenticated = false
      auth.value.user = null
    }
  })
})

// clean listener
onUnmounted(() => {
  if (unsubscribeAuth) {
    unsubscribeAuth()
  }
})

// Provide auth to child components
provide('auth', auth)
provide('openLogin', openLogin)
</script>

<style scoped>
/* Accessibility Styles */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0d6efd;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;
  font-weight: 600;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
  outline: 2px solid #fff;
  outline-offset: 2px;
}

/* Main content focus style */
#main-content:focus {
  outline: none;
}

/* Improved focus styles for all interactive elements */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
.nav-link:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Form helper text */
.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875em;
}

/* Popup Window Style */
.auth-backdrop {
  position: fixed; 
  inset: 0;
  background: rgba(0,0,0,.35);
  display: grid; 
  place-items: center;
  z-index: 1050;
}

.auth-modal {
  width: min(480px, 92vw);
  border: none;
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
}

/* Form Styles */
.form-control,
.form-select {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.form-control:focus,
.form-select:focus {
  background-color: #fff;    
  border-color: #666;
  box-shadow: 0 0 0 0.2rem rgba(108,117,125,.25);
}

.form-control:disabled,
.form-select:disabled {
  background-color: #e9ecef;
  opacity: 0.6;
}

/* Divider Style */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #dee2e6;
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 1rem;
  background: white;
  color: #6c757d;
  font-size: 0.875rem;
}

/* Card Styles */
.card { 
  border: 1px solid #ccc; 
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
}

.card-header {
  background-color: #275FDA;
  color: white;
  padding: 10px 16px;
}

.btn-close-white {
  filter: brightness(0) invert(1);
}

.container {
  background-color: #d6e9ff;
  border-radius: 12px;
}

/* Button Styles */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-dark {
  border: 2px solid #343a40;
  font-weight: 500;
}

.btn-outline-dark:hover {
  background-color: #343a40;
  border-color: #343a40;
}

/* Navigation Link Styles */
.nav-link.btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.nav-link.btn.active {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.nav-link.btn-outline-success.active {
  background-color: #198754;
  color: white !important;
  border-color: #198754;
}

.nav-link.btn-outline-info.active {
  background-color: #0dcaf0;
  color: white !important;
  border-color: #0dcaf0;
}

.navbar-brand {
  font-weight: 600;
  font-size: 1.3rem;
  transition: color 0.3s ease;
}

.navbar-brand:hover {
  color: #198754 !important;
}

/* Admin Panel Button Style */
.admin-panel-btn {
  border: 2px solid #0d6efd !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2) !important;
  transition: all 0.3s ease !important;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
}

.admin-panel-btn:hover {
  border-color: #0b5ed7 !important;
  background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4) !important;
  transform: translateY(-1px) !important;
}

.admin-panel-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.3) !important;
}
</style>
