<template>
  <div>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div class="container">
        <span class="navbar-brand">Hiking Trails</span>
        <div class="navbar-nav ms-auto">
          <router-link 
            v-if="auth.isAuthenticated && auth.user?.role === 'admin'" 
            to="/admin" 
            class="nav-link btn btn-outline-primary me-2 admin-panel-btn"
          >
            <i class="bi bi-gear-fill me-1"></i>Admin Panel
          </router-link>
          <span v-if="auth.isAuthenticated" class="nav-link">
            Hello, {{ auth.user.username || auth.user.email }}
            <span v-if="auth.user?.role" class="badge bg-primary ms-1">{{ auth.user.role }}</span>
          </span>
          <button v-if="auth.isAuthenticated" @click="logout" class="btn btn-sm btn-outline-secondary ms-2">
            Logout
          </button>
          <button v-else @click="openLogin" class="btn btn-sm btn-primary ms-2">
            Login
          </button>
        </div>
      </div>
    </nav>

    <!-- Router View -->
    <router-view></router-view>

    <!-- Login/Register Modal -->
    <div v-if="showAuth" class="auth-backdrop" @click.self="closeLogin">
      <div class="auth-modal card shadow-lg">
        <div class="card-header">
          <strong>{{ authMode === 'login' ? 'Login' : 'Register' }}</strong>
        </div>
        <div class="card-body">
          <div v-if="authError" class="alert alert-danger py-2">{{ authError }}</div>
          
          <!-- Login Form -->
          <div v-if="authMode === 'login'">
            <div class="form-floating mb-3">
              <input type="email" class="form-control" placeholder="Email" v-model="loginForm.email" />
              <label>Email</label>
            </div>
            <div class="form-floating mb-3">
              <input type="password" class="form-control" placeholder="Password" v-model="loginForm.password" />
              <label>Password</label>
            </div>
            <button class="btn btn-primary w-100 mb-3" @click="doLogin">Login</button>
            <div class="text-center">
              <small class="text-muted">Don't have an account? 
                <a href="#" @click.prevent="switchAuthMode" class="text-primary">Register here</a>
              </small>
            </div>
          </div>
          
          <!-- Register Form -->
          <div v-else>
            <div class="form-floating mb-3">
              <input type="text" class="form-control" placeholder="Username" v-model="regForm.username" />
              <label>Username</label>
            </div>
            <div class="form-floating mb-3">
              <input type="email" class="form-control" placeholder="Email" v-model="regForm.email" />
              <label>Email</label>
            </div>
            <div class="form-floating mb-3">
              <input type="password" class="form-control" placeholder="Password" v-model="regForm.password" />
              <label>Password</label>
            </div>
            <div class="form-floating mb-3">
              <select class="form-select" v-model="regForm.gender">
                <option value="" disabled>Select Gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <label>Gender</label>
            </div>
            <div class="form-floating mb-3">
              <textarea
                class="form-control"
                placeholder="Tell us why you want to join hiking activities"
                style="height: 100px"
                v-model="regForm.reason"
                maxlength="300"
              ></textarea>
              <label>Reason for joining (optional)</label>
            </div>
            <button class="btn btn-success w-100 mb-3" @click="doRegister">Register</button>
            <div class="text-center">
              <small class="text-muted">Already have an account? 
                <a href="#" @click.prevent="switchAuthMode" class="text-primary">Login here</a>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { login, logout as authLogout, isAuthenticated, currentUser } from '@/services/auth'

const router = useRouter()

const auth = ref({
  isAuthenticated: false,
  user: null
})

const showAuth = ref(false)
const authError = ref('')
const loginForm = ref({ email: '', password: '' })
const regForm = ref({ username: '', email: '', password: '', gender: '', reason: '' })
const authMode = ref('login')

// User storage functions
const loadUsers = () => {
  const stored = localStorage.getItem('hikeUsers')
  return stored ? JSON.parse(stored) : []
}

const saveUsers = (users) => {
  localStorage.setItem('hikeUsers', JSON.stringify(users))
}

// Open login box
const openLogin = () => {
  showAuth.value = true
  authError.value = ''
}

// Close login box
const closeLogin = () => {
  showAuth.value = false
  authMode.value = 'login'
  loginForm.value = { email: '', password: '' }
  regForm.value = { username: '', email: '', password: '', gender: '', reason: '' }
  authError.value = ''
}

// Perform login
const doLogin = () => {
  const { email, password } = loginForm.value

  // Check registered users first
  const users = loadUsers()
  const user = users.find(u => u.email === email && u.password === password)
  
  if (user) {
    auth.value.isAuthenticated = true
    auth.value.user = { 
      email: user.email, 
      username: user.username,
      role: user.role || 'user',
      gender: user.gender,
      reason: user.reason
    }
    login(auth.value.user)
    closeLogin()
  } else if (email === 'admin@example.com' && password === 'admin123') {
    // Default admin account
    auth.value.isAuthenticated = true
    auth.value.user = { email, username: 'Admin', role: 'admin' }
    login(auth.value.user)
    closeLogin()
  } else if (email === 'demo@example.com' && password === '123456') {
    // Default demo user account
    auth.value.isAuthenticated = true
    auth.value.user = { email, username: 'Demo User', role: 'user' }
    login(auth.value.user)
    closeLogin()
  } else {
    authError.value = 'Invalid email or password'
  }
}

// Perform registration
const doRegister = () => {
  authError.value = ''
  const { username, email, password, gender, reason } = regForm.value
  
  if (!username || !email || !password) { 
    authError.value = 'Username, email and password are required.'
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

  const users = loadUsers()
  const exists = users.some(x => x.email.trim().toLowerCase() === email.trim().toLowerCase())
  if (exists) { 
    authError.value = 'Email already registered.'
    return 
  }

  const newUser = { 
    username: username.trim(), 
    email: email.trim().toLowerCase(), 
    password,
    gender: gender || '',
    reason: reason || '',
    role: 'user'
  }
  
  users.push(newUser)
  saveUsers(users)
  
  // Auto login after registration
  auth.value.isAuthenticated = true
  auth.value.user = { 
    email: newUser.email, 
    username: newUser.username,
    gender: newUser.gender,
    reason: newUser.reason,
    role: newUser.role
  }
  login(auth.value.user)
  closeLogin()
}

// Switch between login and register modes
const switchAuthMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login'
  authError.value = ''
}

// Logout
const logout = () => {
  auth.value.isAuthenticated = false
  auth.value.user = null
  authLogout()
  router.push('/')
}

// Check authentication status on mount
onMounted(() => {
  auth.value.isAuthenticated = isAuthenticated()
  auth.value.user = currentUser()
})

// Provide auth to child components
provide('auth', auth)
provide('openLogin', openLogin)
</script>

<style scoped>
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

/* Card Styles */
.card { 
  border: 1px solid #ccc; 
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.06);
}

.card-header {
  background-color: #275FDA;
  color: white;
  padding: 10px;
}

.container {
  background-color: #d6e9ff;
  border-radius: 12px;
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
