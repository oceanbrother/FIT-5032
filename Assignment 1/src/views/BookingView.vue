<template>
  <div class="container py-4">
    <header class="mb-4">
      <h1 class="h3">📅 Trail Booking Calendar</h1>
      <p class="text-muted">Book your hiking adventure with conflict management</p>
    </header>

    <!-- Booking Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Create New Booking</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="createBooking">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="trail" class="form-label">Select Trail *</label>
              <select 
                id="trail" 
                v-model="bookingForm.trailId" 
                class="form-select"
                required>
                <option value="">Choose a trail...</option>
                <option v-for="trail in trails" :key="trail.id" :value="trail.id">
                  {{ trail.name }} - {{ trail.location }}
                </option>
              </select>
            </div>

            <div class="col-md-6">
              <label for="userName" class="form-label">Your Name *</label>
              <input 
                type="text" 
                id="userName" 
                v-model="bookingForm.userName" 
                class="form-control"
                required
                placeholder="Enter your name">
            </div>

            <div class="col-md-6">
              <label for="email" class="form-label">Email *</label>
              <input 
                type="email" 
                id="email" 
                v-model="bookingForm.email" 
                class="form-control"
                required
                placeholder="your.email@example.com">
            </div>

            <div class="col-md-6">
              <label for="participants" class="form-label">Number of Participants *</label>
              <input 
                type="number" 
                id="participants" 
                v-model.number="bookingForm.participants" 
                class="form-control"
                min="1"
                max="20"
                required>
            </div>

            <div class="col-md-6">
              <label for="bookingDate" class="form-label">Booking Date *</label>
              <input 
                type="date" 
                id="bookingDate" 
                v-model="bookingForm.date" 
                class="form-control"
                :min="minDate"
                required>
            </div>

            <div class="col-md-6">
              <label for="time" class="form-label">Start Time *</label>
              <select 
                id="time" 
                v-model="bookingForm.time" 
                class="form-select"
                required>
                <option value="">Select time...</option>
                <option value="08:00">08:00 AM</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="13:00">01:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
              </select>
            </div>

            <div class="col-12">
              <label for="notes" class="form-label">Notes (Optional)</label>
              <textarea 
                id="notes" 
                v-model="bookingForm.notes" 
                class="form-control" 
                rows="3"
                placeholder="Any special requirements or notes..."></textarea>
            </div>
          </div>

          <div class="mt-3">
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ submitting ? 'Creating...' : 'Create Booking' }}
            </button>
            <button type="button" class="btn btn-secondary ms-2" @click="resetForm">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" class="alert" :class="statusType === 'success' ? 'alert-success' : 'alert-danger'">
      {{ statusMessage }}
    </div>

    <!-- Calendar -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Booking Calendar</h5>
      </div>
      <div class="card-body">
        <FullCalendar :options="calendarOptions" />
      </div>
    </div>

    <!-- Booking Details Modal -->
    <div class="modal fade" id="bookingModal" tabindex="-1" ref="bookingModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Booking Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" v-if="selectedBooking">
            <p><strong>Trail:</strong> {{ getTrailName(selectedBooking.trailId) }}</p>
            <p><strong>Name:</strong> {{ selectedBooking.userName }}</p>
            <p><strong>Email:</strong> {{ selectedBooking.email }}</p>
            <p><strong>Participants:</strong> {{ selectedBooking.participants }}</p>
            <p><strong>Date:</strong> {{ formatDate(selectedBooking.start) }}</p>
            <p><strong>Time:</strong> {{ selectedBooking.time }}</p>
            <p v-if="selectedBooking.notes"><strong>Notes:</strong> {{ selectedBooking.notes }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-danger" @click="deleteBooking">Delete Booking</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/config/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const trails = ref([])
const bookings = ref([])
const submitting = ref(false)
const statusMessage = ref('')
const statusType = ref('success')
const selectedBooking = ref(null)
const bookingModal = ref(null)

const bookingForm = ref({
  trailId: '',
  userName: '',
  email: '',
  participants: 1,
  date: '',
  time: '',
  notes: ''
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Define event handlers first
const handleEventClick = (info) => {
  selectedBooking.value = {
    id: info.event.id,
    ...info.event.extendedProps
  }
  
  // Show modal using Bootstrap
  const modalElement = bookingModal.value
  const modal = new window.bootstrap.Modal(modalElement)
  modal.show()
}

const handleDateClick = (info) => {
  bookingForm.value.date = info.dateStr
}

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: [],
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  editable: false,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  height: 'auto'
})

const fetchTrails = async () => {
  try {
    const trailsSnapshot = await getDocs(collection(db, 'trails'))
    trails.value = trailsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching trails:', error)
  }
}

const fetchBookings = async () => {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
    bookings.value = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    updateCalendarEvents()
  } catch (error) {
    console.error('Error fetching bookings:', error)
  }
}

const updateCalendarEvents = () => {
  calendarOptions.value.events = bookings.value.map(booking => {
    const trail = trails.value.find(t => t.id === booking.trailId)
    return {
      id: booking.id,
      title: `${booking.userName} - ${trail?.name || 'Unknown Trail'}`,
      start: booking.start,
      backgroundColor: getEventColor(booking.trailId),
      extendedProps: booking
    }
  })
}

const getEventColor = (trailId) => {
  const colors = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6610f2']
  const index = trails.value.findIndex(t => t.id === trailId)
  return colors[index % colors.length]
}

const getTrailName = (trailId) => {
  const trail = trails.value.find(t => t.id === trailId)
  return trail ? trail.name : 'Unknown Trail'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const checkBookingConflicts = async (trailId, date, time) => {
  try {
    const bookingDateTime = `${date}T${time}`
    
    // Check if there's already a booking for this trail at this time
    const conflicts = bookings.value.filter(booking => {
      return booking.trailId === trailId && booking.start === bookingDateTime
    })
    
    return conflicts.length > 0
  } catch (error) {
    console.error('Error checking conflicts:', error)
    return false
  }
}

const createBooking = async () => {
  if (!bookingForm.value.trailId || !bookingForm.value.userName || 
      !bookingForm.value.email || !bookingForm.value.date || !bookingForm.value.time) {
    statusMessage.value = 'Please fill in all required fields'
    statusType.value = 'danger'
    return
  }

  submitting.value = true
  statusMessage.value = ''

  try {
    // Check for conflicts
    const hasConflict = await checkBookingConflicts(
      bookingForm.value.trailId,
      bookingForm.value.date,
      bookingForm.value.time
    )

    if (hasConflict) {
      statusMessage.value = 'Booking conflict! This trail is already booked at this time. Please choose a different time.'
      statusType.value = 'danger'
      submitting.value = false
      return
    }

    const bookingDateTime = `${bookingForm.value.date}T${bookingForm.value.time}`
    
    const newBooking = {
      trailId: bookingForm.value.trailId,
      userName: bookingForm.value.userName,
      email: bookingForm.value.email,
      participants: bookingForm.value.participants,
      date: bookingForm.value.date,
      time: bookingForm.value.time,
      start: bookingDateTime,
      notes: bookingForm.value.notes,
      createdAt: new Date()
    }

    await addDoc(collection(db, 'bookings'), newBooking)
    
    statusMessage.value = 'Booking created successfully!'
    statusType.value = 'success'
    resetForm()
    await fetchBookings()
  } catch (error) {
    console.error('Error creating booking:', error)
    statusMessage.value = 'Error creating booking. Please try again.'
    statusType.value = 'danger'
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  bookingForm.value = {
    trailId: '',
    userName: '',
    email: '',
    participants: 1,
    date: '',
    time: '',
    notes: ''
  }
}

const deleteBooking = async () => {
  if (!selectedBooking.value) return

  try {
    await deleteDoc(doc(db, 'bookings', selectedBooking.value.id))
    statusMessage.value = 'Booking deleted successfully!'
    statusType.value = 'success'
    
    // Hide modal
    const modalElement = bookingModal.value
    const modal = window.bootstrap.Modal.getInstance(modalElement)
    if (modal) modal.hide()
    
    await fetchBookings()
  } catch (error) {
    console.error('Error deleting booking:', error)
    statusMessage.value = 'Error deleting booking'
    statusType.value = 'danger'
  }
}

onMounted(() => {
  fetchTrails()
  fetchBookings()
})
</script>

<style scoped>
/* FullCalendar custom styling */
:deep(.fc) {
  font-size: 0.9rem;
}

:deep(.fc-event) {
  cursor: pointer;
}

:deep(.fc-daygrid-event) {
  white-space: normal;
}
</style>
