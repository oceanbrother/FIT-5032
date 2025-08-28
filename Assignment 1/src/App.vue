<template>
  <div class="container mt-5">
    <h1 class="text-center mb-4">Make a outdoor walk</h1>

    <!-- Dynamic Data -->
    <div class="mb-4">
      <h2 class="h5">Hikes (from JSON)</h2>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <ul v-if="hikes.length">
        <li v-for="h in hikes" :key="h.id">
          <strong>{{ h.name }}</strong> — {{ h.location }} ({{ h.difficulty }})
        </li>
      </ul>
      <p v-else class="text-muted">Loading...</p>
    </div>

    <hr class="my-4" />

    <!-- Form -->
    <h2 class="h5 mb-3">User Information Form</h2>
    <form @submit.prevent="submitForm">
      <!-- Username -->
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input
          type="text"
          class="form-control"
          id="username"
          v-model="formData.username"
          @blur="validateName(true)"
          @input="validateName(false)"
        />
        <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input
          type="email"
          class="form-control"
          id="email"
          v-model="formData.email"
          @blur="validateEmail(true)"
          @input="validateEmail(false)"
        />
        <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
      </div>

      <!-- Gender -->
      <div class="mb-3">
        <label for="gender" class="form-label">Gender</label>
        <select class="form-select" id="gender" v-model="formData.gender">
          <option value="" disabled>Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Reason -->
      <div class="mb-3">
        <label for="reason" class="form-label">Reason</label>
        <textarea
          class="form-control"
          id="reason"
          rows="3"
          v-model="formData.reason"
        ></textarea>
      </div>

      <!-- Buttons -->
      <div class="text-center">
        <button type="submit" class="btn btn-primary me-2">Submit</button>
        <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
      </div>
    </form>

    <!-- Display -->
    <div class="row mt-5" v-if="submittedCards.length">
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
            <li class="list-group-item">Gender: {{ card.gender }}</li>
            <li class="list-group-item">Reason: {{ card.reason }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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
