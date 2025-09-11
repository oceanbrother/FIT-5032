<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="mb-0">Welcome!</h1>
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
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
const auth = inject('auth')
const hikes = ref([])
const error = ref('')
const selectedHike = ref(null)

// Button Click
const selectForForm = (h) => {
  if (!auth.value.isAuthenticated) {
    return
  }
  selectedHike.value = h
  alert(`You selected: ${h.name}. Hope you enjoy the hike!`)
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

//fetch
onMounted(async () => {
  try {
    //First load original hikes from hikes.json
    let originalHikes = []
    try {
      const res = await fetch('/hikes.json', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        originalHikes = Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.log('Could not load hikes.json:', err)
    }
    
    //hikes from localStorage
    let adminHikes = []
    try {
      const storedHikes = localStorage.getItem('hikes')
      if (storedHikes) {
        adminHikes = JSON.parse(storedHikes)
      }
    } catch (err) {
      console.log('Could not load admin hikes:', err)
    }
    
    const allHikes = [...originalHikes]
    adminHikes.forEach(adminHike => {
      if (!originalHikes.find(h => h.id === adminHike.id)) {
        allHikes.push(adminHike)
      }
    })
    
    hikes.value = allHikes
    
    // Fallback if no hikes at all
    if (hikes.value.length === 0) {
      hikes.value = [
        { id: 1, name: 'Royal Botanic Loop (fallback)', location: 'Melbourne CBD', difficulty: 'Easy' }
      ]
    }
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load hikes, showing fallback'
    hikes.value = [
      { id: 1, name: 'Royal Botanic Loop (fallback)', location: 'Melbourne CBD', difficulty: 'Easy' }
    ]
  }
})
</script>

<style scoped>
.container {
  background-color: #d6e9ff;
  border-radius: 12px;
}
.card { 
  border: none; 
  box-shadow: 0 8px 24px rgba(0,0,0,.06); 
}
</style>
