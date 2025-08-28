<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Welcome!</h1>

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
              <button class="btn btn-sm btn-outline-primary w-100" @click="selectForForm(h)">
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
    <h2 class="h5 mb-3">User Information</h2>

    <div class="card shadow-sm border-0 mb-4">
      <div class="card-header bg-white d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-person-lines-fill"></i>
          <strong>Registration</strong>
        </div>

        <div v-if="selectedHike" class="small text-muted d-flex align-items-center gap-2">
          <i class="bi bi-map"></i>
          <span>{{ selectedHike.name }}</span>
          <span class="badge" :class="badgeClass(selectedHike.difficulty)">{{ selectedHike.difficulty }}</span>
          <button class="btn btn-sm btn-link text-decoration-none" @click="selectedHike = null">
            Clear
          </button>
        </div>
      </div>

      <div class="card-body">
        <form @submit.prevent="submitForm" novalidate>
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
                <label for="username">Username<span class="text-danger">*</span></label>
                <div class="invalid-feedback">{{ errors.username }}</div>
              </div>
            </div>

            <!-- Email -->
            <div class="col-md-6">
              <div class="form-floating">
                <input
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
                <label for="email">Email<span class="text-danger">*</span></label>
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
              <div class="form-text d-flex justify-content-between">
                <span>Share any preferences or health notes.</span>
                <span>{{ formData.reason.length }}/300</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="card-footer bg-white small text-muted d-flex justify-content-between">
        <span v-if="selectedHike">
          Selected trail: <strong>{{ selectedHike.name }}</strong>
          <span v-if="selectedHike.date"> • {{ formatDate(selectedHike.date) }}</span>
          <span v-if="selectedHike.time"> • {{ selectedHike.time }}</span>
        </span>
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// Using color to indicate difficulty level
const badgeClass = (diff) => {
  switch ((diff || '').toLowerCase()) {
    case 'easy': return 'text-bg-success'
    case 'intermediate': return 'text-bg-warning'
    case 'advanced': return 'text-bg-danger'
    default: return 'text-bg-secondary'
  }
}

// Button Click
const selectForForm = (h) => {
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


const hikes = ref([])
const error = ref('')

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

const formData = ref({
  username: '',
  email: '',
  gender: '',
  reason: ''
})

const submittedCards = ref([])

const errors = ref({
  username: null,
  email: null
})

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters.'
  } else {
    errors.value.username = null
  }
}

const validateEmail = (blur) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(formData.value.email)) {
    if (blur) errors.value.email = 'Enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

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
</style>
