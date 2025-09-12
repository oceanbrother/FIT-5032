<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="h5 mb-0">Admin • Manage Hiking Trails</h2>
      <button class="btn btn-secondary btn-sm" @click="$router.push({name:'trails'})">
        <i class="bi bi-arrow-left me-1"></i> Back to Trails
      </button>
    </div>

    <!-- Form -->
    <div class="card mb-3">
      <div class="card-header">{{ editIndex === -1 ? 'Add New Trail' : 'Edit Trail' }}</div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="form-floating">
              <input class="form-control" id="name" placeholder="Name" v-model.trim="form.name">
              <label for="name">Name *</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input class="form-control" id="location" placeholder="Location" v-model.trim="form.location">
              <label for="location">Location *</label>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-floating">
              <select class="form-select" id="difficulty" v-model="form.difficulty">
                <option value="Easy">Easy</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <label for="difficulty">Difficulty</label>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-floating">
              <input type="number" min="0" class="form-control" id="distance" placeholder="Distance (km)" v-model.number="form.distance_km">
              <label for="distance">Distance km</label>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-floating">
              <input type="number" min="0" class="form-control" id="elevation" placeholder="Elevation (m)" v-model.number="form.elevation_m">
              <label for="elevation">Elevation m</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input type="date" class="form-control" id="date" v-model="form.date">
              <label for="date">Date</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input type="time" class="form-control" id="time" v-model="form.time">
              <label for="time">Time</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input type="number" min="0" class="form-control" id="capacity" v-model.number="form.capacity" placeholder="Capacity">
              <label for="capacity">Capacity</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input type="number" min="0" class="form-control" id="registered" v-model.number="form.registered" placeholder="Registered">
              <label for="registered">Registered</label>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-primary" @click="saveTrail">
            <i class="bi bi-check2-circle me-1"></i> {{ editIndex === -1 ? 'Add' : 'Update' }}
          </button>
          <button class="btn btn-outline-secondary" @click="resetForm">
            <i class="bi bi-eraser me-1"></i> Clear
          </button>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
      <div class="col" v-for="(h, idx) in hikes" :key="h.id">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title mb-1">{{ h.name }}</h5>
              <span class="badge" :class="badgeClass(h.difficulty)">{{ h.difficulty || '—' }}</span>
            </div>
            <p class="text-muted small mb-2"><i class="bi bi-geo-alt me-1"></i>{{ h.location }}</p>
            <ul class="list-unstyled small mb-0">
              <li v-if="h.distance_km">Distance: {{ h.distance_km }} km</li>
              <li v-if="h.elevation_m">Elevation: {{ h.elevation_m }} m</li>
              <li v-if="h.capacity !== undefined">Capacity: {{ h.registered || 0 }} / {{ h.capacity }}</li>
              <li v-if="h.date || h.time"><i class="bi bi-calendar-event me-1"></i>{{ h.date || '—' }} {{ h.time ? '• '+h.time : '' }}</li>
              <li class="mt-2">
                <div class="d-flex align-items-center">
                  <i class="bi bi-star-fill text-warning me-1"></i>
                  <strong>{{ getAverageRating(h.id).toFixed(1) }}</strong>
                  <small class="text-muted ms-1">({{ getRatingCount(h.id) }} evaluations)</small>
                </div>
              </li>
            </ul>
          </div>
          <div class="card-footer bg-white d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="editTrail(idx)">
              <i class="bi bi-pencil-square me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="removeTrail(idx)">
              <i class="bi bi-trash3 me-1"></i>Delete
            </button>
            <template v-if="typeof h.id === 'number'">
              <span class="badge bg-info text-dark ms-auto">Original</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!hikes.length" class="text-muted mt-3">No trails yet. Add one above.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const LS_HIKES = 'hikes';
const hikes = ref([]);
const editIndex = ref(-1);
const form = ref({
  id: null, name: '', location: '', difficulty: 'Easy',
  distance_km: null, elevation_m: null, date: '', time: '',
  capacity: null, registered: null
});
const ratings = ref([])

// Load ratings from localStorage
const loadRatings = () => {
  try {
    const stored = localStorage.getItem('trailRatings')
    ratings.value = stored ? JSON.parse(stored) : []
  } catch {
    ratings.value = []
  }
}

// Get average rating for a trail
const getAverageRating = (trailId) => {
  const trailRatings = ratings.value.filter(r => r.trailId === trailId)
  if (trailRatings.length === 0) return 0
  const sum = trailRatings.reduce((acc, r) => acc + r.rating, 0)
  return sum / trailRatings.length
}

// Get rating count for a trail
const getRatingCount = (trailId) => {
  return ratings.value.filter(r => r.trailId === trailId).length
}

const load = async () => {
  try {
    const storedHikes = localStorage.getItem(LS_HIKES)
    if (storedHikes) {
      hikes.value = JSON.parse(storedHikes)
      return
    }
    try {
      const res = await fetch('/hikes.json', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        hikes.value = Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.log('Could not load hikes.json:', err)
      hikes.value = []
    }
  } catch (error) {
    console.error('Error loading hikes:', error)
    hikes.value = []
  }
};
const save = () => {
  localStorage.setItem(LS_HIKES, JSON.stringify(hikes.value))
};

const resetForm = () => {
  editIndex.value = -1;
  form.value = { id: null, name: '', location: '', difficulty: 'Easy', distance_km: null, elevation_m: null, date: '', time: '', capacity: null, registered: null };
};

const saveTrail = () => {
  const f = form.value;
  if (!f.name?.trim() || !f.location?.trim()) {
    alert('Name and Location are required.');
    return;
  }
  if (editIndex.value === -1) {
    const newItem = { ...f, id: crypto.randomUUID() };
    hikes.value.unshift(newItem);
  } else {
    hikes.value.splice(editIndex.value, 1, { ...f });
  }
  save();
  resetForm();
};

const editTrail = (idx) => {
  const trail = hikes.value[idx]
  editIndex.value = idx
  form.value = { ...trail }
};

const removeTrail = (idx) => {
  const trail = hikes.value[idx]
  if (!confirm('Delete this trail?')) return
  hikes.value.splice(idx, 1)
  save()
  if (editIndex.value === idx) resetForm()
};

const badgeClass = (diff) => {
  switch ((diff || '').toLowerCase()) {
    case 'easy': return 'text-bg-success';
    case 'intermediate': return 'text-bg-warning';
    case 'advanced': return 'text-bg-danger';
    default: return 'text-bg-secondary';
  }
};

onMounted(async () => {
  await load();
  loadRatings();
});
</script>




