<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3">Interactive Data Tables</h1>
      <button class="btn btn-secondary btn-sm" @click="$router.push({name:'trails'})">
        <i class="bi bi-arrow-left me-1"></i> Back to Home
      </button>
    </div>

    <!-- Table 1: Hiking Trails -->
    <div class="card mb-4 shadow-sm">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h2 class="h5 mb-0">
          <i class="bi bi-table me-2"></i>Hiking Trails Data Table
        </h2>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-dark">{{ trails.length }} trails</span>
          <div class="btn-group btn-group-sm" role="group" aria-label="Export options">
            <button 
              type="button" 
              class="btn btn-light" 
              @click="exportTrailsToCSV"
              title="Export to CSV"
            >
              <i class="bi bi-file-earmark-spreadsheet me-1"></i>CSV
            </button>
            <button 
              type="button" 
              class="btn btn-light" 
              @click="exportTrailsToPDF"
              title="Export to PDF"
            >
              <i class="bi bi-file-earmark-pdf me-1"></i>PDF
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <p class="text-muted small mb-3">
          <i class="bi bi-info-circle me-1"></i>
          Features: Sort by any column, search globally or by specific column, paginate 10 rows per page
        </p>
        
        <EasyDataTable
          :headers="trailHeaders"
          :items="trails"
          :rows-per-page="10"
          :search-field="trailSearchField"
          :search-value="trailSearchValue"
          buttons-pagination
          alternating
          border-cell
          theme-color="#0d6efd"
          table-class-name="customize-table"
        >
          <!-- Header slots for column-specific search -->
          <template #header-name="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <input 
                type="text" 
                class="form-control form-control-sm"
                placeholder="Search name..."
                @input="updateSearch('name', $event.target.value)"
                aria-label="Search by trail name"
              />
            </div>
          </template>

          <template #header-location="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <input 
                type="text" 
                class="form-control form-control-sm"
                placeholder="Search location..."
                @input="updateSearch('location', $event.target.value)"
                aria-label="Search by location"
              />
            </div>
          </template>

          <template #header-difficulty="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <select 
                class="form-select form-select-sm"
                @change="updateSearch('difficulty', $event.target.value)"
                aria-label="Filter by difficulty"
              >
                <option value="">All</option>
                <option value="Easy">Easy</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </template>

          <!-- Custom cell rendering -->
          <template #item-difficulty="{ difficulty }">
            <span class="badge" :class="getDifficultyBadgeClass(difficulty)">
              {{ difficulty }}
            </span>
          </template>

          <template #item-distance_km="{ distance_km }">
            <span v-if="distance_km">{{ distance_km }} km</span>
            <span v-else class="text-muted">—</span>
          </template>

          <template #item-elevation_m="{ elevation_m }">
            <span v-if="elevation_m">{{ elevation_m }} m</span>
            <span v-else class="text-muted">—</span>
          </template>

          <template #item-capacity="{ capacity, registered }">
            <div class="d-flex align-items-center gap-2">
              <span>{{ registered || 0 }} / {{ capacity || 0 }}</span>
              <div class="progress" style="width: 60px; height: 6px;">
                <div 
                  class="progress-bar" 
                  :class="getCapacityClass(registered, capacity)"
                  :style="{ width: getCapacityPercentage(registered, capacity) + '%' }"
                  role="progressbar"
                  :aria-valuenow="getCapacityPercentage(registered, capacity)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </template>

          <template #item-rating="item">
            <div class="d-flex align-items-center gap-1">
              <i class="bi bi-star-fill text-warning"></i>
              <strong>{{ getAverageRating(item.id).toFixed(1) }}</strong>
              <small class="text-muted">({{ getRatingCount(item.id) }})</small>
            </div>
          </template>
        </EasyDataTable>
      </div>
    </div>

    <!-- Table 2: User Ratings & Reviews -->
    <div class="card shadow-sm">
      <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
        <h2 class="h5 mb-0">
          <i class="bi bi-star-fill me-2"></i>User Ratings & Reviews Data Table
        </h2>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-light text-dark">{{ ratings.length }} ratings</span>
          <div class="btn-group btn-group-sm" role="group" aria-label="Export options">
            <button 
              type="button" 
              class="btn btn-light" 
              @click="exportRatingsToCSV"
              title="Export to CSV"
            >
              <i class="bi bi-file-earmark-spreadsheet me-1"></i>CSV
            </button>
            <button 
              type="button" 
              class="btn btn-light" 
              @click="exportRatingsToPDF"
              title="Export to PDF"
            >
              <i class="bi bi-file-earmark-pdf me-1"></i>PDF
            </button>
          </div>
        </div>
      </div>
      <div class="card-body">
        <p class="text-muted small mb-3">
          <i class="bi bi-info-circle me-1"></i>
          Features: Sort by any column, search by trail name or username, paginate 10 rows per page
        </p>

        <EasyDataTable
          :headers="ratingHeaders"
          :items="ratingsWithTrailNames"
          :rows-per-page="10"
          :search-field="ratingSearchField"
          :search-value="ratingSearchValue"
          buttons-pagination
          alternating
          border-cell
          theme-color="#198754"
          table-class-name="customize-table"
        >
          <!-- Header slots for column-specific search -->
          <template #header-trailName="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <input 
                type="text" 
                class="form-control form-control-sm"
                placeholder="Search trail..."
                @input="updateRatingSearch('trailName', $event.target.value)"
                aria-label="Search by trail name"
              />
            </div>
          </template>

          <template #header-username="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <input 
                type="text" 
                class="form-control form-control-sm"
                placeholder="Search user..."
                @input="updateRatingSearch('username', $event.target.value)"
                aria-label="Search by username"
              />
            </div>
          </template>

          <template #header-rating="header">
            <div class="filter-column">
              <div class="filter-label">{{ header.text }}</div>
              <select 
                class="form-select form-select-sm"
                @change="updateRatingSearch('rating', $event.target.value)"
                aria-label="Filter by rating"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </template>

          <!-- Custom cell rendering -->
          <template #item-rating="{ rating }">
            <div class="d-flex align-items-center gap-1">
              <span class="fw-bold text-warning">{{ rating }}</span>
              <div>
                <i v-for="n in 5" 
                   :key="n" 
                   class="bi"
                   :class="n <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'"
                ></i>
              </div>
            </div>
          </template>

          <template #item-comment="{ comment }">
            <span v-if="comment" class="text-truncate d-inline-block" style="max-width: 300px;">
              {{ comment }}
            </span>
            <span v-else class="text-muted fst-italic">No comment</span>
          </template>

          <template #item-timestamp="{ timestamp }">
            <small class="text-muted">{{ formatDate(timestamp) }}</small>
          </template>
        </EasyDataTable>
      </div>
    </div>

    <!-- Info Section -->
    <div class="alert alert-info mt-4" role="alert">
      <h5 class="alert-heading">
        <i class="bi bi-check-circle-fill me-2"></i>Interactive Table Features
      </h5>
      <ul class="mb-0">
        <li><strong>Sorting:</strong> Click on any column header to sort (ascending/descending)</li>
        <li><strong>Column-Specific Search:</strong> Use the search inputs under each column header</li>
        <li><strong>Pagination:</strong> Navigate through pages (10 rows per page)</li>
        <li><strong>Alternating Rows:</strong> Better visual separation between rows</li>
        <li><strong>Data Export:</strong> Export table data to CSV or PDF format using the buttons in the header</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EasyDataTable from 'vue3-easy-data-table'
import 'vue3-easy-data-table/dist/style.css'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Trail data state
const trails = ref([])
const trailSearchField = ref('name')
const trailSearchValue = ref('')

// Rating data state
const ratings = ref([])
const ratingSearchField = ref('trailName')
const ratingSearchValue = ref('')

// Define table headers for Hiking Trails
const trailHeaders = [
  { text: 'Trail Name', value: 'name', sortable: true },
  { text: 'Location', value: 'location', sortable: true },
  { text: 'Difficulty', value: 'difficulty', sortable: true },
  { text: 'Distance', value: 'distance_km', sortable: true },
  { text: 'Elevation', value: 'elevation_m', sortable: true },
  { text: 'Date', value: 'date', sortable: true },
  { text: 'Capacity', value: 'capacity', sortable: true },
  { text: 'Rating', value: 'rating', sortable: false }
]

// Define table headers for Ratings
const ratingHeaders = [
  { text: 'Trail Name', value: 'trailName', sortable: true },
  { text: 'Username', value: 'username', sortable: true },
  { text: 'Rating', value: 'rating', sortable: true },
  { text: 'Comment', value: 'comment', sortable: false },
  { text: 'Date', value: 'timestamp', sortable: true }
]

// Load trails from localStorage or hikes.json
const loadTrails = async () => {
  try {
    // First try to load from localStorage
    const stored = localStorage.getItem('hikes')
    if (stored) {
      trails.value = JSON.parse(stored)
      return
    }
    
    // If no localStorage data, fetch from hikes.json
    try {
      const response = await fetch('/hikes.json', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        trails.value = Array.isArray(data) ? data : []
        // Save to localStorage for future use
        if (trails.value.length > 0) {
          localStorage.setItem('hikes', JSON.stringify(trails.value))
        }
      } else {
        console.error('Failed to fetch hikes.json')
        trails.value = []
      }
    } catch (fetchError) {
      console.error('Error fetching hikes.json:', fetchError)
      trails.value = []
    }
  } catch (error) {
    console.error('Error loading trails:', error)
    trails.value = []
  }
}

// Load ratings from localStorage
const loadRatings = () => {
  try {
    const stored = localStorage.getItem('trailRatings')
    ratings.value = stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading ratings:', error)
    ratings.value = []
  }
}

// Compute ratings with trail names
const ratingsWithTrailNames = computed(() => {
  return ratings.value.map(rating => {
    const trail = trails.value.find(t => t.id === rating.trailId)
    return {
      ...rating,
      trailName: trail ? trail.name : 'Unknown Trail'
    }
  })
})

// Update search for trails table
const updateSearch = (field, value) => {
  trailSearchField.value = field
  trailSearchValue.value = value
}

// Update search for ratings table
const updateRatingSearch = (field, value) => {
  ratingSearchField.value = field
  ratingSearchValue.value = value
}

// Get difficulty badge class
const getDifficultyBadgeClass = (difficulty) => {
  const classes = {
    'Easy': 'bg-success',
    'Intermediate': 'bg-warning text-dark',
    'Advanced': 'bg-danger'
  }
  return classes[difficulty] || 'bg-secondary'
}

// Get capacity percentage
const getCapacityPercentage = (registered, capacity) => {
  if (!capacity) return 0
  return Math.min((registered / capacity) * 100, 100)
}

// Get capacity class for progress bar
const getCapacityClass = (registered, capacity) => {
  const percentage = getCapacityPercentage(registered, capacity)
  if (percentage >= 90) return 'bg-danger'
  if (percentage >= 70) return 'bg-warning'
  return 'bg-success'
}

// Calculate average rating for a trail
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

// Format date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Export Functions

// Export Trails to CSV
const exportTrailsToCSV = () => {
  try {
    // Prepare data for CSV
    const csvData = trails.value.map(trail => ({
      'Trail Name': trail.name,
      'Location': trail.location,
      'Difficulty': trail.difficulty,
      'Distance (km)': trail.distance_km || 'N/A',
      'Elevation (m)': trail.elevation_m || 'N/A',
      'Date': trail.date || 'N/A',
      'Time': trail.time || 'N/A',
      'Capacity': trail.capacity || 'N/A',
      'Registered': trail.registered || 'N/A',
      'Average Rating': getAverageRating(trail.id).toFixed(1),
      'Total Ratings': getRatingCount(trail.id)
    }))

    // Convert to CSV
    const csv = Papa.unparse(csvData)
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `hiking_trails_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✅ Trails exported to CSV successfully')
  } catch (error) {
    console.error('Error exporting trails to CSV:', error)
    alert('Failed to export trails to CSV')
  }
}

// Export Ratings to CSV
const exportRatingsToCSV = () => {
  try {
    // Prepare data for CSV
    const csvData = ratingsWithTrailNames.value.map(rating => ({
      'Trail Name': rating.trailName,
      'Username': rating.username,
      'Rating': rating.rating,
      'Comment': rating.comment || 'No comment',
      'Date': formatDate(rating.timestamp)
    }))

    // Convert to CSV
    const csv = Papa.unparse(csvData)
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `user_ratings_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('✅ Ratings exported to CSV successfully')
  } catch (error) {
    console.error('Error exporting ratings to CSV:', error)
    alert('Failed to export ratings to CSV')
  }
}

// Export Trails to PDF
const exportTrailsToPDF = () => {
  try {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Hiking Trails Report', 14, 20)
    
    // Add date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
    
    // Prepare table data
    const tableData = trails.value.map(trail => [
      trail.name,
      trail.location,
      trail.difficulty,
      trail.distance_km ? `${trail.distance_km} km` : 'N/A',
      trail.elevation_m ? `${trail.elevation_m} m` : 'N/A',
      trail.date || 'N/A',
      `${trail.registered || 0}/${trail.capacity || 0}`,
      getAverageRating(trail.id).toFixed(1) + ` (${getRatingCount(trail.id)})`
    ])
    
    // Add table using autoTable plugin
    autoTable(doc, {
      head: [['Trail Name', 'Location', 'Difficulty', 'Distance', 'Elevation', 'Date', 'Capacity', 'Rating']],
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 }
      },
      margin: { top: 35 }
    })
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages()
    doc.setFontSize(8)
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
    
    // Save PDF
    doc.save(`hiking_trails_${new Date().toISOString().split('T')[0]}.pdf`)
    console.log('✅ Trails exported to PDF successfully')
  } catch (error) {
    console.error('Error exporting trails to PDF:', error)
    alert('Failed to export trails to PDF: ' + error.message)
  }
}

// Export Ratings to PDF
const exportRatingsToPDF = () => {
  try {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('User Ratings & Reviews Report', 14, 20)
    
    // Add date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
    
    // Prepare table data
    const tableData = ratingsWithTrailNames.value.map(rating => [
      rating.trailName,
      rating.username,
      `${rating.rating}/5 stars`,
      rating.comment ? (rating.comment.length > 50 ? rating.comment.substring(0, 47) + '...' : rating.comment) : 'No comment',
      formatDate(rating.timestamp)
    ])
    
    // Add table using autoTable plugin
    autoTable(doc, {
      head: [['Trail Name', 'Username', 'Rating', 'Comment', 'Date']],
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [25, 135, 84], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 60 },
        4: { cellWidth: 35 }
      },
      margin: { top: 35 }
    })
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages()
    doc.setFontSize(8)
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
    
    // Save PDF
    doc.save(`user_ratings_${new Date().toISOString().split('T')[0]}.pdf`)
    console.log('✅ Ratings exported to PDF successfully')
  } catch (error) {
    console.error('Error exporting ratings to PDF:', error)
    alert('Failed to export ratings to PDF: ' + error.message)
  }
}

// Initialize data on mount
onMounted(async () => {
  await loadTrails()
  loadRatings()
})
</script>

<style scoped>
.customize-table {
  --easy-table-header-font-size: 14px;
  --easy-table-header-background-color: #f8f9fa;
  --easy-table-header-font-color: #212529;
  --easy-table-body-row-font-size: 14px;
  --easy-table-body-row-height: 50px;
  --easy-table-body-row-hover-background-color: #f1f3f5;
}

.filter-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  font-size: 14px;
  color: #212529;
}

.filter-column input,
.filter-column select {
  font-size: 12px;
}

.card {
  border: none;
  border-radius: 0.5rem;
}

.card-header {
  border-radius: 0.5rem 0.5rem 0 0 !important;
  padding: 1rem 1.25rem;
}

.progress {
  background-color: #e9ecef;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Accessibility improvements */
.form-control:focus,
.form-select:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-column input,
  .filter-column select {
    font-size: 11px;
  }
  
  .customize-table {
    font-size: 12px;
  }
}
</style>
