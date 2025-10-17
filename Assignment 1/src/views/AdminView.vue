<template>
  <div class="container py-4">
    <header class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="h5 mb-0"><span aria-hidden="true">🛠️</span> Admin <span aria-hidden="true">•</span> Manage Hiking Trails</h1>
      <button class="btn btn-secondary btn-sm" @click="$router.push({name:'trails'})" aria-label="Return to trails page">
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i> Back to Trails
      </button>
    </header>

    <!-- Form -->
    <section class="card mb-3" aria-labelledby="trail-form-heading">
      <div class="card-header">
        <h2 id="trail-form-heading" class="h6 mb-0">{{ editIndex === -1 ? 'Add New Trail' : 'Edit Trail' }}</h2>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveTrail" aria-label="Trail management form">
          <div class="row g-3">
            <div class="col-md-6">
              <div class="form-floating">
                <input 
                  class="form-control" 
                  id="name" 
                  placeholder="Name" 
                  v-model.trim="form.name"
                  aria-required="true"
                  :aria-invalid="!!formErrors.name"
                  :aria-describedby="formErrors.name ? 'name-error' : undefined"
                  @blur="validateField('name')">
                <label for="name">Name <span class="required-indicator">*</span></label>
              </div>
              <span v-if="formErrors.name" id="name-error" class="text-danger small" role="alert">
                {{ formErrors.name }}
              </span>
            </div>
            <div class="col-md-6">
              <div class="form-floating">
                <input 
                  class="form-control" 
                  id="location" 
                  placeholder="Location" 
                  v-model.trim="form.location"
                  aria-required="true"
                  :aria-invalid="!!formErrors.location"
                  :aria-describedby="formErrors.location ? 'location-error' : undefined"
                  @blur="validateField('location')">
                <label for="location">Location <span class="required-indicator">*</span></label>
              </div>
              <span v-if="formErrors.location" id="location-error" class="text-danger small" role="alert">
                {{ formErrors.location }}
              </span>
            </div>
          <div class="col-md-4">
            <div class="form-floating">
              <select class="form-select" id="difficulty" v-model="form.difficulty" aria-label="Trail difficulty level">
                <option value="Easy">Easy</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <label for="difficulty">Difficulty</label>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-floating">
              <input 
                type="number" 
                min="0" 
                step="0.1"
                class="form-control" 
                id="distance" 
                placeholder="Distance (km)" 
                v-model.number="form.distance_km"
                aria-label="Trail distance in kilometers">
              <label for="distance">Distance km</label>
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-floating">
              <input 
                type="number" 
                min="0" 
                step="1"
                class="form-control" 
                id="elevation" 
                placeholder="Elevation (m)" 
                v-model.number="form.elevation_m"
                aria-label="Trail elevation in meters">
              <label for="elevation">Elevation m</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input 
                type="date" 
                class="form-control" 
                id="date" 
                v-model="form.date"
                aria-label="Trail hike date">
              <label for="date">Date</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input 
                type="time" 
                class="form-control" 
                id="time" 
                v-model="form.time"
                aria-label="Trail hike time">
              <label for="time">Time</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input 
                type="number" 
                min="0" 
                class="form-control" 
                id="capacity" 
                v-model.number="form.capacity" 
                placeholder="Capacity"
                aria-label="Maximum participant capacity">
              <label for="capacity">Capacity</label>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-floating">
              <input 
                type="number" 
                min="0" 
                class="form-control" 
                id="registered" 
                v-model.number="form.registered" 
                placeholder="Registered"
                aria-label="Number of registered participants">
              <label for="registered">Registered</label>
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 mt-3" role="group" aria-label="Form actions">
          <button type="submit" class="btn btn-primary" :aria-label="editIndex === -1 ? 'Add new trail' : 'Update trail'">
            <i class="bi bi-check2-circle me-1" aria-hidden="true"></i> {{ editIndex === -1 ? 'Add' : 'Update' }}
          </button>
          <button type="button" class="btn btn-outline-secondary" @click="resetForm" aria-label="Clear form">
            <i class="bi bi-eraser me-1" aria-hidden="true"></i> Clear
          </button>
        </div>
        
        <!-- Form status messages -->
        <div v-if="formMessage" class="mt-3">
          <div v-if="formMessage.type === 'error'" class="alert alert-danger" role="alert" aria-live="assertive">
            <span aria-hidden="true">❌</span> {{ formMessage.text }}
          </div>
          <div v-if="formMessage.type === 'success'" class="alert alert-success" role="status" aria-live="polite">
            <span aria-hidden="true">✅</span> {{ formMessage.text }}
          </div>
        </div>
      </form>
      </div>
    </section>

    <!-- List -->
    <section aria-labelledby="trails-list-heading">
      <h2 id="trails-list-heading" class="h5 mb-3">
        <span aria-hidden="true">🥾</span> Trail List
        <span class="badge bg-secondary ms-2" aria-label="Total trails count">{{ hikes.length }}</span>
      </h2>
      
      <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3" role="list" aria-label="Hiking trails">
        <div class="col" v-for="(h, idx) in hikes" :key="h.id" role="listitem">
          <article class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h3 class="card-title mb-1 h5">{{ h.name }}</h3>
                <span class="badge" :class="badgeClass(h.difficulty)" :aria-label="`Difficulty: ${h.difficulty || 'Unknown'}`">
                  {{ h.difficulty || '—' }}
                </span>
              </div>
              <p class="text-muted small mb-2">
                <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
                <span class="sr-only">Location:</span>{{ h.location }}
              </p>
              <ul class="list-unstyled small mb-0">
                <li v-if="h.distance_km"><span class="sr-only">Distance:</span>Distance: {{ h.distance_km }} km</li>
                <li v-if="h.elevation_m"><span class="sr-only">Elevation:</span>Elevation: {{ h.elevation_m }} m</li>
                <li v-if="h.capacity !== undefined">
                  <span class="sr-only">Registration status:</span>Capacity: {{ h.registered || 0 }} / {{ h.capacity }}
                </li>
                <li v-if="h.date || h.time">
                  <i class="bi bi-calendar-event me-1" aria-hidden="true"></i>
                  <time :datetime="h.date" v-if="h.date">{{ h.date }}</time>
                  <span v-if="h.date && h.time" aria-hidden="true"> • </span>
                  <time :datetime="h.time" v-if="h.time">{{ h.time }}</time>
                </li>
              <li class="mt-2">
                <div class="d-flex align-items-center">
                  <i class="bi bi-star-fill text-warning me-1" aria-hidden="true"></i>
                  <strong aria-label="Average rating">{{ getAverageRating(h.id).toFixed(1) }}</strong>
                  <small class="text-muted ms-1" aria-label="Number of evaluations">({{ getRatingCount(h.id) }} evaluations)</small>
                </div>
              </li>
            </ul>
          </div>
          <footer class="card-footer bg-white d-flex gap-2" role="group" :aria-label="`Actions for ${h.name}`">
            <button 
              class="btn btn-sm btn-outline-primary" 
              @click="editTrail(idx)"
              :aria-label="`Edit ${h.name} trail`">
              <i class="bi bi-pencil-square me-1" aria-hidden="true"></i>Edit
            </button>
            <button 
              class="btn btn-sm btn-outline-danger" 
              @click="confirmDelete(idx)"
              :aria-label="`Delete ${h.name} trail`">
              <i class="bi bi-trash3 me-1" aria-hidden="true"></i>Delete
            </button>
            <template v-if="typeof h.id === 'number'">
              <span class="badge bg-info text-dark ms-auto" aria-label="Original trail from database">Original</span>
            </template>
          </footer>
        </article>
      </div>
    </div>

    <p v-if="!hikes.length" class="text-muted mt-3" role="status">
      <span aria-hidden="true">ℹ️</span> No trails yet. Add one above.
    </p>
  </section>

  <!-- Delete Confirmation Modal -->
  <div 
    v-if="showDeleteModal" 
    class="modal-overlay" 
    @click="showDeleteModal = false"
    @keydown="handleDeleteModalKeydown">
    <div 
      class="modal-content" 
      @click.stop 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="delete-modal-heading">
      <h2 id="delete-modal-heading" class="h5">
        <span aria-hidden="true">⚠️</span> Confirm Delete
      </h2>
      <p v-if="trailToDelete">
        Are you sure you want to delete <strong>{{ hikes[trailToDelete]?.name }}</strong>?
        This action cannot be undone.
      </p>
      <div class="d-flex gap-2 justify-content-end mt-3" role="group" aria-label="Delete confirmation actions">
        <button 
          type="button"
          class="btn btn-secondary" 
          @click="showDeleteModal = false"
          aria-label="Cancel deletion">
          Cancel
        </button>
        <button 
          type="button"
          class="btn btn-danger" 
          @click="removeTrail"
          aria-label="Confirm delete trail">
          <i class="bi bi-trash3 me-1" aria-hidden="true"></i>Delete
        </button>
      </div>
    </div>
  </div>
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
const formErrors = ref({
  name: '',
  location: ''
})
const formMessage = ref(null)
const showDeleteModal = ref(false)
const trailToDelete = ref(null)

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
  formErrors.value = { name: '', location: '' };
  formMessage.value = null;
};

// Validate form fields
const validateField = (field) => {
  formErrors.value[field] = ''
  
  if (field === 'name') {
    if (!form.value.name?.trim()) {
      formErrors.value.name = 'Trail name is required'
    } else if (form.value.name.trim().length < 3) {
      formErrors.value.name = 'Trail name must be at least 3 characters'
    }
  }
  
  if (field === 'location') {
    if (!form.value.location?.trim()) {
      formErrors.value.location = 'Location is required'
    } else if (form.value.location.trim().length < 3) {
      formErrors.value.location = 'Location must be at least 3 characters'
    }
  }
}

const saveTrail = () => {
  const f = form.value;
  
  // Clear previous messages
  formMessage.value = null
  
  // Validate required fields
  validateField('name')
  validateField('location')
  
  // Check if there are validation errors
  if (formErrors.value.name || formErrors.value.location) {
    formMessage.value = {
      type: 'error',
      text: 'Please fix the errors in the form before submitting.'
    }
    return;
  }
  
  if (!f.name?.trim() || !f.location?.trim()) {
    formMessage.value = {
      type: 'error',
      text: 'Name and Location are required.'
    }
    return;
  }
  
  if (editIndex.value === -1) {
    const newItem = { ...f, id: crypto.randomUUID() };
    hikes.value.unshift(newItem);
    formMessage.value = {
      type: 'success',
      text: `Trail "${f.name}" added successfully!`
    }
  } else {
    hikes.value.splice(editIndex.value, 1, { ...f });
    formMessage.value = {
      type: 'success',
      text: `Trail "${f.name}" updated successfully!`
    }
  }
  
  save();
  
  // Clear message and form after 3 seconds
  setTimeout(() => {
    formMessage.value = null
    resetForm();
  }, 3000);
};

const editTrail = (idx) => {
  const trail = hikes.value[idx]
  editIndex.value = idx
  form.value = { ...trail }
  formErrors.value = { name: '', location: '' }
  formMessage.value = null
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
};

const confirmDelete = (idx) => {
  trailToDelete.value = idx
  showDeleteModal.value = true
}

const removeTrail = () => {
  if (trailToDelete.value === null) return
  
  const trail = hikes.value[trailToDelete.value]
  hikes.value.splice(trailToDelete.value, 1)
  save()
  
  if (editIndex.value === trailToDelete.value) {
    resetForm()
  }
  
  formMessage.value = {
    type: 'success',
    text: `Trail "${trail.name}" deleted successfully.`
  }
  
  setTimeout(() => {
    formMessage.value = null
  }, 3000)
  
  showDeleteModal.value = false
  trailToDelete.value = null
};

const handleDeleteModalKeydown = (event) => {
  if (event.key === 'Escape') {
    showDeleteModal.value = false
    trailToDelete.value = null
  }
}

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

<style scoped>
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Required field indicator */
.required-indicator {
  color: #dc3545;
  font-weight: bold;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Focus styles */
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Error text styling */
.text-danger {
  display: block;
  margin-top: 0.25rem;
}
</style>



