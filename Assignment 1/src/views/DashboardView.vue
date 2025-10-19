<template>
  <div class="container py-4">
    <header class="mb-4">
      <h1 class="h3">📊 Admin Dashboard</h1>
      <p class="text-muted">Overview of your hiking trails platform</p>
    </header>

    <!-- Summary Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card text-bg-primary">
          <div class="card-body">
            <h5 class="card-title">Total Users</h5>
            <p class="display-4">{{ stats.totalUsers }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-bg-success">
          <div class="card-body">
            <h5 class="card-title">Total Trails</h5>
            <p class="display-4">{{ stats.totalTrails }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-bg-warning">
          <div class="card-body">
            <h5 class="card-title">Total Bookings</h5>
            <p class="display-4">{{ stats.totalBookings }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card text-bg-info">
          <div class="card-body">
            <h5 class="card-title">Admin Users</h5>
            <p class="display-4">{{ stats.adminUsers }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row g-3 mb-4">
      <!-- User Types Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">User Types Distribution</h5>
          </div>
          <div class="card-body">
            <canvas ref="userChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Trail Difficulty Chart -->
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Trail Difficulty Levels</h5>
          </div>
          <div class="card-body">
            <canvas ref="trailChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Bookings Over Time Chart -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Bookings Over Time (All History)</h5>
          </div>
          <div class="card-body">
            <canvas ref="bookingsChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Users Table -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Recent Users</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user.id">
                <td>{{ user.email }}</td>
                <td>{{ user.username || 'N/A' }}</td>
                <td>
                  <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-secondary'">
                    {{ user.role || 'user' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/config/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const stats = ref({
  totalUsers: 0,
  totalTrails: 0,
  totalBookings: 0,
  adminUsers: 0
})

const recentUsers = ref([])
const userChart = ref(null)
const trailChart = ref(null)
const bookingsChart = ref(null)

let userChartInstance = null
let trailChartInstance = null
let bookingsChartInstance = null

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString()
}

const fetchStats = async () => {
  try {
    // Fetch users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    stats.value.totalUsers = users.length
    stats.value.adminUsers = users.filter(u => u.role === 'admin').length

    // Get recent users
    const recentQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5))
    const recentSnapshot = await getDocs(recentQuery)
    recentUsers.value = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Fetch trails
    const trailsSnapshot = await getDocs(collection(db, 'trails'))
    stats.value.totalTrails = trailsSnapshot.size

    // Fetch bookings
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
    stats.value.totalBookings = bookingsSnapshot.size

    // Create charts
    createUserChart(users)
    createTrailChart(trailsSnapshot.docs.map(doc => doc.data()))
    createBookingsChart(bookingsSnapshot.docs.map(doc => doc.data()))
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const createUserChart = (users) => {
  const roleCount = users.reduce((acc, user) => {
    const role = user.role || 'user'
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  if (userChartInstance) {
    userChartInstance.destroy()
  }

  userChartInstance = new Chart(userChart.value, {
    type: 'doughnut',
    data: {
      labels: Object.keys(roleCount),
      datasets: [{
        data: Object.values(roleCount),
        backgroundColor: ['#0d6efd', '#dc3545', '#ffc107', '#198754']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

const createTrailChart = (trails) => {
  const difficultyCount = trails.reduce((acc, trail) => {
    const difficulty = trail.difficulty || 'Unknown'
    acc[difficulty] = (acc[difficulty] || 0) + 1
    return acc
  }, {})

  if (trailChartInstance) {
    trailChartInstance.destroy()
  }

  trailChartInstance = new Chart(trailChart.value, {
    type: 'bar',
    data: {
      labels: Object.keys(difficultyCount),
      datasets: [{
        label: 'Number of Trails',
        data: Object.values(difficultyCount),
        backgroundColor: ['#198754', '#ffc107', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

const createBookingsChart = (bookings) => {
  // Group bookings by date
  const bookingsByDate = {}
  
  bookings.forEach(booking => {
    const bookingDate = booking.date || booking.start
    if (!bookingDate) return
    
    const date = bookingDate.toDate ? bookingDate.toDate() : new Date(bookingDate)
    const dateStr = date.toISOString().split('T')[0]
    
    bookingsByDate[dateStr] = (bookingsByDate[dateStr] || 0) + 1
  })

  // Sort dates and get labels and data
  const sortedDates = Object.keys(bookingsByDate).sort()
  const labels = sortedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  const data = sortedDates.map(d => bookingsByDate[d])

  // If no bookings, show empty state
  if (sortedDates.length === 0) {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    labels.push(today)
    data.push(0)
  }

  if (bookingsChartInstance) {
    bookingsChartInstance.destroy()
  }

  bookingsChartInstance = new Chart(bookingsChart.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Bookings',
        data: data,
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.display-4 {
  font-size: 2.5rem;
  font-weight: 300;
}
</style>
