<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="mb-0">Welcome!</h1>
      
      <div v-if="auth.isAuthenticated">
      <span>Hello, {{ auth.user.email }}</span>
      <button @click="logout" class="btn btn-sm btn-outline-secondary">Logout</button>
    </div>
    <div v-else>
      <button @click="openLogin" class="btn btn-sm btn-primary">Login</button>
    </div>
    </div>

    <!-- Upcoming Hiking Trails -->
    <div class="mb-4">
      <h2 class="h5">Upcoming Hiking Trails</h2>
      <p v-if="error" class="text-danger">{{ error }}</p>

      <div v-if="hikes.length" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        <div class="col" v-for="h in hikes" :key="h.id">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-start justify-content-between">
                <h5 class="card-title mb-1">{{ h.name }}</h5>
                <span class="badge" :class="badgeClass(h.difficulty)">{{ h.difficulty }}</span>
              </div>

              <p class="text-muted small mb-2">
                <i class="bi bi-geo-alt me-1"></i>{{ h.location }}
              </p>

              <ul class="list-unstyled small mb-3">
                <li v-if="h.distance_km"><i class="bi bi-arrows-move me-1"></i>{{ h.distance_km }} km</li>
                <li v-if="h.elevation_m"><i class="bi bi-graph-up-arrow me-1"></i>↑ {{ h.elevation_m }} m</li>
                <li v-if="h.date || h.time">
                  <i class="bi bi-calendar-event me-1"></i>{{ formatDate(h.date) }}
                  <span v-if="h.time">• {{ h.time }}</span>
                </li>
              </ul>

              <div v-if="h.capacity && h.registered" class="mt-auto">
                <div class="progress" style="height:8px;">
                  <div
                    class="progress-bar"
                    role="progressbar"
                    :style="{ width: capacityPct(h) + '%' }"
                    :aria-valuenow="capacityPct(h)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <small class="text-muted">{{ h.registered }} / {{ h.capacity }} spots filled</small>
              </div>
            </div>

            <div class="card-footer bg-white">
              <button class="btn btn-sm w-100" 
              :class="auth.isAuthenticated ? 'btn-outline-primary' : 'btn-outline-secondary'"
              :disabled="!auth.isAuthenticated"
              :title="auth.isAuthenticated ? 'Register for this trail' : 'Please login to register'"
              @click="selectForForm(h)">
                <i class="bi bi-person-walking me-1"></i> Register
              </button>
            </div>
          </div>
        </div>
      </div>

      <p v-else class="text-muted">Loading...</p>
    </div>

    <hr class="my-4" />

    <!-- User Information -->
    <h2 class="h5 mb-1">User Information</h2>
    <p class="small mb-3" :class="submittedCards.length ? 'text-success' : 'text-muted'">
      <i :class="submittedCards.length ? 'bi bi-check-circle-fill me-1' : 'bi bi-x-circle me-1'"></i>
      {{ submittedCards.length ? 'Registered successfully!' : 'Not registered yet' }}
    </p>
    
    

    <!-- Form -->
     <!-- Disable not logged in for the form as a whole -->
    <form @submit.prevent="submitForm" novalidate>
      <fieldset :disabled="!auth.isAuthenticated">
      <div class="row g-3">
      <!-- Username -->
      <div class="col-md-6">
        <div class="form-floating">
          <input
            type="text"
            class="form-control"
            id="username"
            placeholder="Username"
            v-model.trim="formData.username"
            @blur="validateName(true)"
            @input="validateName(false)"
            :class="{
              'is-invalid': !!errors.username,
              'is-valid': !errors.username && formData.username
            }"
            required
          />
          <label for="username">Username</label>
          <div class="invalid-feedback">{{ errors.username }}</div>
        </div>
      </div>

      <!-- Email -->
      <div class="col-md-6">
        <div class="form-floating">
          <input
            ref="emailRef"
            type="email"
            class="form-control"
            id="email"
            placeholder="name@example.com"
            v-model.trim="formData.email"
            @blur="validateEmail(true)"
            @input="validateEmail(false)"
            :class="{
              'is-invalid': !!errors.email,
              'is-valid': !errors.email && formData.email
            }"
            required
          />
          <label for="email">Email</label>
          <div class="invalid-feedback">{{ errors.email }}</div>
        </div>
      </div>

      <!-- Gender -->
      <div class="col-md-4">
        <div class="form-floating">
          <select class="form-select" id="gender" v-model="formData.gender">
            <option value="" disabled>Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <label for="gender">Gender</label>
        </div>
      </div>

      <!-- Reason -->
      <div class="col-md-8">
        <div class="form-floating">
          <textarea
            class="form-control"
            id="reason"
            placeholder="Tell us why you want to join"
            style="height: 120px"
            v-model="formData.reason"
            maxlength="300"
        ></textarea>
        <label for="reason">Reason (optional)</label>
      </div>
    </div>
  </div>

      <!-- Buttons -->
      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="submit" class="btn btn-primary px-4" :disabled="!canSubmit">
          <i class="bi bi-check2-circle me-1"></i> Submit
        </button>
        <button type="button" class="btn btn-outline-secondary px-4" @click="clearForm">
          <i class="bi bi-eraser me-1"></i> Clear
        </button>
      </div>
    </fieldset>
  </form>

    <!-- Submitted Cards -->
    <div class="row mt-4" v-if="submittedCards.length">
      <div class="d-flex flex-wrap">
        <div
          v-for="(card, index) in submittedCards"
          :key="index"
          class="card m-2"
          style="width: 18rem;"
        >
          <div class="card-header">User Info</div>
          <ul class="list-group list-group-flush">
            <li class="list-group-item">Username: {{ card.username }}</li>
            <li class="list-group-item">Email: {{ card.email }}</li>
            <li class="list-group-item">Gender: {{ card.gender || '—' }}</li>
            <li class="list-group-item">Reason: {{ card.reason || '—' }}</li>
            <li class="list-group-item" v-if="card.hike">Trail: {{ card.hike.name }}</li>
          </ul>
        </div>
      </div>
    </div>

     <!-- Pop window -->
   <div v-if="showAuth" class="auth-backdrop" @click.self="closeLogin">
  <div class="auth-modal card shadow-lg">
    <div class="card-header">
      <strong>Login</strong>
    </div>
    <div class="card-body">
      <div v-if="authError" class="alert alert-danger py-2">{{ authError }}</div>
      <div class="form-floating mb-3">
        <input type="email" class="form-control" placeholder="Email" v-model="loginForm.email" />
        <label>Email</label>
      </div>
      <div class="form-floating mb-3">
        <input type="password" class="form-control" placeholder="Password" v-model="loginForm.password" />
        <label>Password</label>
      </div>
      <button class="btn btn-primary w-100" @click="doLogin">Login</button>
    </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const hikes = ref([])
const error = ref('')

const auth = ref({
  isAuthenticated: false,
  user: null
})

const showAuth = ref(false)
const authError = ref('')
const loginForm = ref({ email: '', password: '' })
const selectedHike = ref(null)

// Open login box
const openLogin = () => {
  showAuth.value = true
  authError.value = ''
}

// Close login box
const closeLogin = () => {
  showAuth.value = false
}

// Perform login
const doLogin = () => {
  const { email, password } = loginForm.value

  if (email === 'demo@example.com' && password === '123456') {
    auth.value.isAuthenticated = true
    auth.value.user = { email }
    closeLogin()
  } else {
    authError.value = 'Invalid email or password'
  }
}

// Logout
const logout = () => {
  auth.value.isAuthenticated = false
  auth.value.user = null
}



const formData = ref({
  username: '',
  email: '',
  gender: '',
  reason: ''
})

const errors = ref({
  username: null,
  email: null
})

// Username validation
const validateName = (blur) => {
  const v = formData.value.username.trim()
  if (v.length < 5) {
    errors.value.username = 'Username must be at least 5 characters.'
  } else {
    errors.value.username = null
  }
  // Clear error if not blurred and valid
  if (!blur && !v) errors.value.username = null
}

// Email validation
const validateEmail = (blur) => {
  const v = formData.value.email.trim()
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (v.length < 6) {
    errors.value.email = 'Email must be at least 6 characters.'
  } else if (!pattern.test(v)) {
    errors.value.email = 'Enter a valid email address.'
  } else {
    errors.value.email = null
  }
  if (!blur && !v) errors.value.email = null
}

// Submit
const canSubmit = computed(() =>
  !!formData.value.username &&
  !!formData.value.email &&
  !errors.value.username &&
  !errors.value.email &&
  auth.value.isAuthenticated
)

const submittedCards = ref([])

const submitForm = () => {
  validateName(true)
  validateEmail(true)

  if (!errors.value.username && !errors.value.email) {
    submittedCards.value.push({ ...formData.value })
    clearForm()
  }
}

const clearForm = () => {
  formData.value = { username: '', email: '', gender: '', reason: '' }
  errors.value = { username: null, email: null }
}

// Button Click
const selectForForm = (h) => {
    if (!auth.value.isAuthenticated) {
    openLogin()
    return
  }
  selectedHike.value = h
  document.getElementById('username')?.focus()
}

// Format
const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

// Capacity display
const capacityPct = (h) => {
  const reg = Number(h?.registered || 0)
  const cap = Number(h?.capacity || 1)
  return Math.min(100, Math.round((reg / cap) * 100))
}

// Using color to indicate difficulty level
const badgeClass = (diff) => {
  switch ((diff || '').toLowerCase()) {
    case 'easy': return 'text-bg-success'
    case 'intermediate': return 'text-bg-warning'
    case 'advanced': return 'text-bg-danger'
    default: return 'text-bg-secondary'
  }
}



// fetch
onMounted(async () => {
  try {
    const res = await fetch('/hikes.json', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load hikes.json')
    const data = await res.json()
    hikes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load hikes.json, showing fallback'
    hikes.value = [
      { id: 1, name: 'Royal Botanic Loop (fallback)', location: 'Melbourne CBD', difficulty: 'Easy' }
    ]
  }
})
</script>

<style scoped>
.trail-cover {
  height: 120px;
  background: linear-gradient(135deg, #d1e9ff, #e6fff3);
  border-bottom: 1px solid rgba(0,0,0,.05);
}
.card { border: none; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
.card {
  border: 1px solid #ccc;
  border-radius: 10px;
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
/* Error */
.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #dc3545;
  background-color: #f8d7da;
  box-shadow: 0 0 0 0.2rem rgba(220,53,69,.25);
}
/* Successfully */
.form-control.is-valid,
.form-select.is-valid {
  border-color: #198754;
  background-color: #d1e7dd;
  box-shadow: 0 0 0 0.2rem rgba(25,135,84,.25);
}
/* Popup Window Style */
.auth-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  display: grid; place-items: center;
  z-index: 1050;
}
.auth-modal {
  width: min(480px, 92vw);
  border: none;
  border-radius: 12px;
}
</style>
