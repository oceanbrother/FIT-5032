<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="mb-0">Welcome!</h1>
    </div>

    <!-- Upcoming Hiking Trails -->
    <section class="mb-4" aria-labelledby="trails-heading">
      <h2 id="trails-heading" class="h5">Upcoming Hiking Trails</h2>
      <p v-if="error" class="text-danger" role="alert" aria-live="polite">{{ error }}</p>

      <div v-if="hikes.length" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
        <div class="col" v-for="h in hikes" :key="h.id">
          <article class="card h-100" :aria-label="`${h.name} hiking trail`">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-start justify-content-between">
                <h3 class="card-title mb-1 h5">{{ h.name }}</h3>
                <span 
                  class="badge" 
                  :class="badgeClass(h.difficulty)"
                  :aria-label="`Difficulty level: ${h.difficulty}`">
                  {{ h.difficulty }}
                </span>
              </div>

              <p class="text-muted small mb-2">
                <i class="bi bi-geo-alt me-1" aria-hidden="true"></i>
                <span class="sr-only">Location: </span>{{ h.location }}
              </p>

              <ul class="list-unstyled small mb-3">
                <li v-if="h.distance_km">
                  <i class="bi bi-arrows-move me-1" aria-hidden="true"></i>
                  <span class="sr-only">Distance: </span>{{ h.distance_km }} km
                </li>
                <li v-if="h.elevation_m">
                  <i class="bi bi-graph-up-arrow me-1" aria-hidden="true"></i>
                  <span class="sr-only">Elevation gain: </span>↑ {{ h.elevation_m }} m
                </li>
                <li v-if="h.date || h.time">
                  <i class="bi bi-calendar-event me-1" aria-hidden="true"></i>
                  <span class="sr-only">Date and time: </span>{{ formatDate(h.date) }}
                  <span v-if="h.time">• {{ h.time }}</span>
                </li>
              </ul>

              <!-- Rating Display -->
              <div class="mb-3">
                <div class="d-flex align-items-center mb-1">
                  <span class="me-2">Rating:</span>
                  <div 
                    class="rating-stars me-2" 
                    role="img" 
                    :aria-label="`${getAverageRating(h.id).toFixed(1)} out of 5 stars`">
                    <i v-for="n in 5" :key="n" 
                       class="bi" 
                       :class="n <= getAverageRating(h.id) ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
                       aria-hidden="true">
                    </i>
                  </div>
                  <small class="text-muted">
                    {{ getAverageRating(h.id).toFixed(1) }} ({{ getRatingCount(h.id) }} 
                    <span class="sr-only">reviews</span>
                    <span aria-hidden="true">evaluations</span>)
                  </small>
                </div>
                <div class="d-flex gap-2" role="group" :aria-label="`Rating actions for ${h.name}`">
                  <button 
                    v-if="auth.isAuthenticated" 
                    class="btn btn-outline-warning btn-sm" 
                    @click="openRatingModal(h)"
                    :aria-label="getUserRating(h.id) ? `Modify your rating for ${h.name}` : `Rate ${h.name}`">
                    <i class="bi bi-star me-1" aria-hidden="true"></i>
                    {{ getUserRating(h.id) ? 'Modify Rating' : 'Rating' }}
                  </button>
                  <button 
                    class="btn btn-outline-info btn-sm" 
                    @click="openReviewsModal(h)"
                    :disabled="getRatingCount(h.id) === 0"
                    :aria-label="`View ${getRatingCount(h.id)} reviews for ${h.name}`">
                    <i class="bi bi-chat-text me-1" aria-hidden="true"></i>
                    View Reviews ({{ getRatingCount(h.id) }})
                  </button>
                </div>
              </div>

              <div v-if="h.capacity && h.registered" class="mt-auto">
                <div 
                  class="progress mb-1" 
                  style="height:8px;"
                  role="progressbar"
                  :aria-label="`Registration: ${h.registered} of ${h.capacity} spots filled, ${capacityPct(h)}% full`"
                  :aria-valuenow="capacityPct(h)"
                  aria-valuemin="0"
                  aria-valuemax="100">
                  <div
                    class="progress-bar"
                    :style="{ width: capacityPct(h) + '%' }"
                  ></div>
                </div>
                <small class="text-muted d-block text-center">
                  {{ h.registered }} / {{ h.capacity }} spots filled
                </small>
              </div>
            </div>

            <div class="card-footer bg-white">
              <button 
                class="btn btn-sm w-100" 
                :class="auth.isAuthenticated ? 'btn-outline-primary' : 'btn-outline-secondary'"
                :disabled="!auth.isAuthenticated"
                :aria-label="auth.isAuthenticated ? `Register for ${h.name}` : 'Login required to register'"
                :title="auth.isAuthenticated ? 'Register for this trail' : 'Please login to register'"
                @click="selectForForm(h)">
                <i class="bi bi-person-walking me-1" aria-hidden="true"></i> Register
              </button>
            </div>
          </article>
        </div>
      </div>

      <p v-else class="text-muted">Loading trails...</p>
    </section>

    <!-- Rating Modal -->
    <div 
      v-if="showRatingModal" 
      class="rating-backdrop" 
      @click.self="closeRatingModal"
      @keydown="handleRatingModalKeydown">
      <div 
        class="rating-modal card shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        ref="ratingModalRef">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 id="rating-modal-title" class="mb-0">Rate "{{ currentTrail?.name }}"</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="closeRatingModal"
            aria-label="Close rating dialog"></button>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label id="rating-label" class="form-label">Select Rating (1-5 stars):</label>
            <div 
              class="rating-input d-flex gap-2 mb-3"
              role="radiogroup"
              aria-labelledby="rating-label"
              aria-required="true">
              <button v-for="n in 5" :key="n"
                      type="button"
                      role="radio"
                      :aria-checked="n === ratingForm.rating"
                      :aria-label="`${n} star${n > 1 ? 's' : ''}`"
                      class="btn btn-outline-warning"
                      :class="{ 'active': n <= ratingForm.rating }"
                      @click="ratingForm.rating = n"
                      ref="ratingButtonsRef">
                <i class="bi bi-star-fill" aria-hidden="true"></i>
              </button>
            </div>
            <div class="form-floating">
              <textarea 
                id="rating-comment"
                class="form-control" 
                placeholder="Write a comment (optional)"
                style="height: 100px"
                v-model="ratingForm.comment"
                maxlength="200"
                aria-describedby="comment-help"></textarea>
              <label for="rating-comment">Comment (optional, max 200 characters)</label>
              <small id="comment-help" class="form-text text-muted sr-only">
                Your comment will be visible to other users
              </small>
            </div>
          </div>
          <div class="d-flex gap-2" role="group" aria-label="Rating submission actions">
            <button 
              class="btn btn-primary" 
              @click="submitRating" 
              :disabled="!ratingForm.rating"
              :aria-disabled="!ratingForm.rating">
              <i class="bi bi-check2-circle me-1" aria-hidden="true"></i>Submit Rating
            </button>
            <button 
              class="btn btn-secondary" 
              @click="closeRatingModal">
              <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reviews Modal -->
    <div 
      v-if="showReviewsModal" 
      class="rating-backdrop" 
      @click.self="closeReviewsModal"
      @keydown="handleReviewsModalKeydown">
      <div 
        class="rating-modal card shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviews-modal-title"
        ref="reviewsModalRef">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 id="reviews-modal-title" class="mb-0">Reviews for "{{ currentTrail?.name }}"</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="closeReviewsModal"
            aria-label="Close reviews dialog"></button>
        </div>
        <div 
          class="card-body" 
          style="max-height: 400px; overflow-y: auto;"
          role="region"
          aria-label="Reviews list"
          tabindex="0">
          <div v-if="getTrailReviews(currentTrail?.id).length === 0" class="text-muted text-center py-3">
            No reviews yet
          </div>
          <div v-else>
            <article 
              v-for="review in getTrailReviews(currentTrail?.id)" 
              :key="review.id" 
              class="review-item border-bottom pb-3 mb-3"
              :aria-label="`Review by ${review.username}, ${review.rating} stars`">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>{{ review.username }}</strong>
                  <div 
                    class="rating-stars"
                    role="img"
                    :aria-label="`${review.rating} out of 5 stars`">
                    <i v-for="n in 5" :key="n" 
                       class="bi bi-star-fill"
                       :class="n <= review.rating ? 'text-warning' : 'text-muted'"
                       aria-hidden="true"></i>
                  </div>
                </div>
                <small class="text-muted">
                  <time :datetime="new Date(review.timestamp).toISOString()">
                    {{ formatReviewDate(review.timestamp) }}
                  </time>
                </small>
              </div>
              <p v-if="review.comment" class="mb-0">{{ review.comment }}</p>
              <p v-else class="mb-0 text-muted fst-italic">No comment provided</p>
            </article>
          </div>
        </div>
        <div class="card-footer bg-light text-center">
          <div class="rating-summary" role="status" aria-live="polite">
            <strong>Average Rating: {{ getAverageRating(currentTrail?.id).toFixed(1) }}</strong>
            <span class="ms-2 text-muted">({{ getRatingCount(currentTrail?.id) }} reviews)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, nextTick, watch } from 'vue'

const auth = inject('auth')
const hikes = ref([])
const error = ref('')
const selectedHike = ref(null)
const showRatingModal = ref(false)
const currentTrail = ref(null)
const ratingForm = ref({
  rating: 0,
  comment: ''
})
const ratings = ref([]) 

// Reviews modal
const showReviewsModal = ref(false)

// Modal refs for focus management
const ratingModalRef = ref(null)
const reviewsModalRef = ref(null)
const ratingButtonsRef = ref([])
const ratingModalTrigger = ref(null)
const reviewsModalTrigger = ref(null)

// Load ratings from localStorage
const loadRatings = () => {
  try {
    const stored = localStorage.getItem('trailRatings')
    ratings.value = stored ? JSON.parse(stored) : []
    if (ratings.value.length === 0) {
      addDefaultRatings()
    }
  } catch {
    ratings.value = []
    addDefaultRatings()
  }
}

// Add default ratings for original trails
const addDefaultRatings = () => {
  const defaultRatings = [
    {
      id: 'default-1-1',
      trailId: 1,
      userId: 'user1@example.com',
      username: 'John Smith',
      rating: 5,
      comment: 'Amazing trail! Beautiful scenery and perfect for the whole family.',
      timestamp: '2025-09-08T10:30:00.000Z'
    },
    {
      id: 'default-1-2', 
      trailId: 1,
      userId: 'user2@example.com',
      username: 'Emma Wilson',
      rating: 4,
      comment: 'Great walking route, though it can get quite crowded.',
      timestamp: '2025-09-07T14:20:00.000Z'
    },
    {
      id: 'default-1-3',
      trailId: 1, 
      userId: 'user3@example.com',
      username: 'David Chen',
      rating: 5,
      comment: 'Wonderful green space in the city center. Highly recommended!',
      timestamp: '2025-09-06T09:15:00.000Z'
    },
    
    {
      id: 'default-2-1',
      trailId: 2,
      userId: 'user4@example.com', 
      username: 'Sarah Johnson',
      rating: 4,
      comment: 'Nice walk along the creek, though some sections can be muddy.',
      timestamp: '2025-09-09T16:45:00.000Z'
    },
    {
      id: 'default-2-2',
      trailId: 2,
      userId: 'user5@example.com',
      username: 'Michael Brown',
      rating: 3,
      comment: 'Moderate difficulty, suitable for hikers with some experience.',
      timestamp: '2025-09-05T11:30:00.000Z'
    },
    
    {
      id: 'default-3-1',
      trailId: 3,
      userId: 'user6@example.com',
      username: 'Lisa Taylor',
      rating: 5,
      comment: 'Very challenging but the summit views are absolutely worth it! Start early.',
      timestamp: '2025-09-04T07:20:00.000Z'
    },
    {
      id: 'default-3-2',
      trailId: 3,
      userId: 'user7@example.com', 
      username: 'James Miller',
      rating: 4,
      comment: 'Great workout opportunity, but definitely tiring. Be mentally prepared.',
      timestamp: '2025-09-03T13:10:00.000Z'
    },
    {
      id: 'default-3-3',
      trailId: 3,
      userId: 'user8@example.com',
      username: 'Anna Davis',
      rating: 5,
      comment: 'Love this trail! Every visit brings new discoveries.',
      timestamp: '2025-09-02T15:40:00.000Z'
    }
  ]
  ratings.value = defaultRatings
  saveRatings()
}

const saveRatings = () => {
  localStorage.setItem('trailRatings', JSON.stringify(ratings.value))
}

//Get average rating 
const getAverageRating = (trailId) => {
  const trailRatings = ratings.value.filter(r => r.trailId === trailId)
  if (trailRatings.length === 0) return 0
  const sum = trailRatings.reduce((acc, r) => acc + r.rating, 0)
  return sum / trailRatings.length
}
const getRatingCount = (trailId) => {
  return ratings.value.filter(r => r.trailId === trailId).length
}
const getUserRating = (trailId) => {
  if (!auth.value.isAuthenticated) return null
  return ratings.value.find(r => r.trailId === trailId && r.userId === auth.value.user?.email)
}

// rating modal
const openRatingModal = (trail) => {
  if (!auth.value.isAuthenticated) return
  
  // Store the trigger element for focus return
  ratingModalTrigger.value = document.activeElement
  
  currentTrail.value = trail
  const existingRating = getUserRating(trail.id)
  if (existingRating) {
    ratingForm.value = {
      rating: existingRating.rating,
      comment: existingRating.comment || ''
    }
  } else {
    ratingForm.value = {
      rating: 0,
      comment: ''
    }
  }
  showRatingModal.value = true
  
  // Focus first rating button after modal opens
  nextTick(() => {
    if (ratingButtonsRef.value && ratingButtonsRef.value.length > 0) {
      ratingButtonsRef.value[0].focus()
    }
  })
}

const closeRatingModal = () => {
  showRatingModal.value = false
  currentTrail.value = null
  ratingForm.value = { rating: 0, comment: '' }
  
  // Return focus to trigger element
  nextTick(() => {
    if (ratingModalTrigger.value) {
      ratingModalTrigger.value.focus()
      ratingModalTrigger.value = null
    }
  })
}

const submitRating = () => {
  if (!auth.value.isAuthenticated || !currentTrail.value || !ratingForm.value.rating) return
  
  const userId = auth.value.user?.email
  const trailId = currentTrail.value.id
  
  ratings.value = ratings.value.filter(r => !(r.trailId === trailId && r.userId === userId))
  ratings.value.push({
    id: crypto.randomUUID(),
    trailId: trailId,
    userId: userId,
    username: auth.value.user?.username || auth.value.user?.email,
    rating: ratingForm.value.rating,
    comment: ratingForm.value.comment.trim(),
    timestamp: new Date().toISOString()
  })
  saveRatings()
  closeRatingModal()
}

//Reviews functions
const openReviewsModal = (trail) => {
  // Store the trigger element for focus return
  reviewsModalTrigger.value = document.activeElement
  
  currentTrail.value = trail
  showReviewsModal.value = true
  
  // Focus the reviews container after modal opens
  nextTick(() => {
    if (reviewsModalRef.value) {
      const closeButton = reviewsModalRef.value.querySelector('.btn-close')
      if (closeButton) {
        closeButton.focus()
      }
    }
  })
}

const closeReviewsModal = () => {
  showReviewsModal.value = false
  currentTrail.value = null
  
  // Return focus to trigger element
  nextTick(() => {
    if (reviewsModalTrigger.value) {
      reviewsModalTrigger.value.focus()
      reviewsModalTrigger.value = null
    }
  })
}

// Keyboard event handlers for modals (focus trap and Esc key)
const handleRatingModalKeydown = (event) => {
  if (event.key === 'Escape') {
    closeRatingModal()
    return
  }
  
  // Focus trap: Tab key handling
  if (event.key === 'Tab' && ratingModalRef.value) {
    const focusableElements = ratingModalRef.value.querySelectorAll(
      'button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

const handleReviewsModalKeydown = (event) => {
  if (event.key === 'Escape') {
    closeReviewsModal()
    return
  }
  
  // Focus trap: Tab key handling
  if (event.key === 'Tab' && reviewsModalRef.value) {
    const focusableElements = reviewsModalRef.value.querySelectorAll(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

const getTrailReviews = (trailId) => {
  return ratings.value.filter(r => r.trailId === trailId).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  )
}
const formatReviewDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-AU', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

// Watch for modal state changes to manage body scroll
watch(showRatingModal, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

watch(showReviewsModal, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

//fetch
onMounted(async () => {
  try {
    //Firstly load all saved data from localStorage
    const storedHikes = localStorage.getItem('hikes')
    if (storedHikes) {
      hikes.value = JSON.parse(storedHikes)
      // Load ratings
      loadRatings()
      return
    }
    //If no localStorage data, load hikes from hikes.json
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
  
  loadRatings()
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

/* Rating Styles */
.rating-stars i {
  font-size: 0.9rem;
}

.rating-input .btn {
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rating-input .btn.active {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #000;
}

.rating-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  display: grid;
  place-items: center;
  z-index: 1050;
}

.rating-modal {
  width: min(500px, 92vw);
  border: none;
  border-radius: 12px;
}

/* Review item styles */
.review-item:last-child {
  border-bottom: none !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

.rating-summary {
  font-size: 1.1rem;
}
</style>
