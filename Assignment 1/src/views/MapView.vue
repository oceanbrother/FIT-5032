<template>
  <div class="container-fluid py-4">
    <div class="row mb-3">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <h1 class="h3 mb-0">
            <i class="bi bi-map me-2"></i>Interactive Trail Map
          </h1>
          <button class="btn btn-secondary btn-sm" @click="$router.push({name:'trails'})">
            <i class="bi bi-arrow-left me-1"></i> Back to Home
          </button>
        </div>
      </div>
    </div>

    <!-- Map Controls Card -->
    <div class="row mb-3">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="row g-3">
              <!-- Search Location -->
              <div class="col-md-6">
                <label class="form-label fw-bold">
                  <i class="bi bi-search me-1"></i>Search Location
                </label>
                <div id="geocoder" class="geocoder-container"></div>
                <small class="text-muted">Search for any place on the map</small>
              </div>

              <!-- Directions -->
              <div class="col-md-6">
                <label class="form-label fw-bold">
                  <i class="bi bi-signpost-2 me-1"></i>Get Directions
                </label>
                <div class="d-flex gap-2">
                  <select 
                    class="form-select form-select-sm" 
                    v-model="directionsStart"
                    @change="clearDirections"
                  >
                    <option value="">Select starting point</option>
                    <option 
                      v-for="trail in trails" 
                      :key="'start-' + trail.id" 
                      :value="trail.id"
                    >
                      {{ trail.name }}
                    </option>
                  </select>
                  <select 
                    class="form-select form-select-sm" 
                    v-model="directionsEnd"
                    @change="clearDirections"
                  >
                    <option value="">Select destination</option>
                    <option 
                      v-for="trail in trails" 
                      :key="'end-' + trail.id" 
                      :value="trail.id"
                    >
                      {{ trail.name }}
                    </option>
                  </select>
                  <button 
                    class="btn btn-primary btn-sm" 
                    @click="getDirections"
                    :disabled="!directionsStart || !directionsEnd || directionsStart === directionsEnd"
                  >
                    <i class="bi bi-arrow-right me-1"></i>Go
                  </button>
                </div>
                <small class="text-muted">Get walking directions between two trails</small>
                <div v-if="directionsInfo" class="alert alert-info mt-2 py-2 mb-0">
                  <small>
                    <strong>Distance:</strong> {{ directionsInfo.distance }} km | 
                    <strong>Duration:</strong> {{ directionsInfo.duration }} min
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="row">
      <div class="col-lg-9">
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div id="map" class="map-container"></div>
          </div>
        </div>
      </div>

      <!-- Trail List Sidebar -->
      <div class="col-lg-3">
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">
              <i class="bi bi-list-ul me-2"></i>Trail Locations
            </h5>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <a 
                v-for="trail in trails" 
                :key="trail.id"
                href="#"
                class="list-group-item list-group-item-action"
                @click.prevent="flyToTrail(trail)"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <h6 class="mb-1">{{ trail.name }}</h6>
                    <p class="mb-1 text-muted small">
                      <i class="bi bi-geo-alt me-1"></i>{{ trail.location }}
                    </p>
                    <div class="d-flex gap-2 flex-wrap">
                      <span 
                        class="badge" 
                        :class="getDifficultyBadgeClass(trail.difficulty)"
                      >
                        {{ trail.difficulty }}
                      </span>
                      <span class="badge bg-secondary">
                        {{ trail.distance_km }} km
                      </span>
                    </div>
                  </div>
                  <i class="bi bi-chevron-right text-muted"></i>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Map Legend -->
        <div class="card shadow-sm mt-3">
          <div class="card-header bg-success text-white">
            <h6 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>Map Legend
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <span class="badge bg-success me-2">🟢</span>
              <small>Easy Trail</small>
            </div>
            <div class="mb-2">
              <span class="badge bg-warning text-dark me-2">🟡</span>
              <small>Intermediate Trail</small>
            </div>
            <div class="mb-2">
              <span class="badge bg-danger me-2">🔴</span>
              <small>Advanced Trail</small>
            </div>
            <hr>
            <small class="text-muted">
              <strong>Map Features:</strong><br>
              • Click markers for details<br>
              • Use search to find places<br>
              • Get directions between trails<br>
              • Zoom and pan to explore
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Alert -->
    <div class="row mt-3">
      <div class="col-12">
        <div class="alert alert-info" role="alert">
          <h6 class="alert-heading">
            <i class="bi bi-lightbulb me-2"></i>Map Features
          </h6>
          <ul class="mb-0 small">
            <li><strong>Interactive Markers:</strong> Click on any trail marker to see details</li>
            <li><strong>Location Search:</strong> Use the search box to find any place in the world</li>
            <li><strong>Directions:</strong> Select two trails to get walking directions and distance</li>
            <li><strong>Geocoding:</strong> Search converts place names to coordinates automatically</li>
            <li><strong>Routing:</strong> Calculates actual walking paths between locations</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

mapboxgl.accessToken = 'pk.eyJ1IjoiamlucXVhbjIwMDAiLCJhIjoiY21ncnQ0ZGs1MnBjczJqcTlrZXluazN1bCJ9.nx2EmS4iW5zxl0vCBnDajw'

// State
const trails = ref([])
const map = ref(null)
const markers = ref([])
const directionsStart = ref('')
const directionsEnd = ref('')
const directionsInfo = ref(null)
let directionsLayer = null

// Load trails data
const loadTrails = async () => {
  try {
    const stored = localStorage.getItem('hikes')
    if (stored) {
      trails.value = JSON.parse(stored)
      return
    }
    
    const response = await fetch('/hikes.json', { cache: 'no-store' })
    if (response.ok) {
      const data = await response.json()
      trails.value = Array.isArray(data) ? data : []
      if (trails.value.length > 0) {
        localStorage.setItem('hikes', JSON.stringify(trails.value))
      }
    }
  } catch (error) {
    console.error('Error loading trails:', error)
    trails.value = []
  }
}

// Initialize map
const initMap = () => {
  // Center on Melbourne, Australia
  map.value = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12', // Outdoor style perfect for hiking
    center: [144.9631, -37.8136], // Melbourne coordinates
    zoom: 10
  })

  // Add navigation controls
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // Add fullscreen control
  map.value.addControl(new mapboxgl.FullscreenControl(), 'top-right')

  // Add scale control
  map.value.addControl(new mapboxgl.ScaleControl({
    maxWidth: 100,
    unit: 'metric'
  }), 'bottom-left')

  // Add geocoder (search) control
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: {
      color: '#0d6efd'
    },
    placeholder: 'Search for places...',
    countries: 'au', // Limit to Australia
    proximity: {
      longitude: 144.9631,
      latitude: -37.8136
    }
  })

  // Mount geocoder to custom container
  document.getElementById('geocoder').appendChild(geocoder.onAdd(map.value))

  // Wait for map to load
  map.value.on('load', () => {
    addTrailMarkers()
  })
}

// Get marker color based on difficulty
const getMarkerColor = (difficulty) => {
  const colors = {
    'Easy': '#198754',
    'Intermediate': '#ffc107',
    'Advanced': '#dc3545'
  }
  return colors[difficulty] || '#6c757d'
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

// Add trail markers to map
const addTrailMarkers = () => {
  // Clear existing markers
  markers.value.forEach(marker => marker.remove())
  markers.value = []

  trails.value.forEach(trail => {
    if (trail.coordinates) {
      // Create custom marker
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.backgroundColor = getMarkerColor(trail.difficulty)
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      // Create popup content
      const popupContent = `
        <div class="trail-popup">
          <h6 class="mb-2">${trail.name}</h6>
          <p class="mb-1 small"><strong>Location:</strong> ${trail.location}</p>
          <p class="mb-1 small"><strong>Difficulty:</strong> 
            <span class="badge ${getDifficultyBadgeClass(trail.difficulty)}">${trail.difficulty}</span>
          </p>
          <p class="mb-1 small"><strong>Distance:</strong> ${trail.distance_km} km</p>
          <p class="mb-1 small"><strong>Elevation:</strong> ${trail.elevation_m} m</p>
          ${trail.date ? `<p class="mb-1 small"><strong>Date:</strong> ${trail.date}</p>` : ''}
          <p class="mb-0 small"><strong>Capacity:</strong> ${trail.registered || 0}/${trail.capacity || 0}</p>
        </div>
      `

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(popupContent)

      const marker = new mapboxgl.Marker(el)
        .setLngLat([trail.coordinates.lng, trail.coordinates.lat])
        .setPopup(popup)
        .addTo(map.value)

      markers.value.push(marker)
    }
  })

  // Fit map to show all markers
  if (trails.value.length > 0) {
    const bounds = new mapboxgl.LngLatBounds()
    trails.value.forEach(trail => {
      if (trail.coordinates) {
        bounds.extend([trail.coordinates.lng, trail.coordinates.lat])
      }
    })
    map.value.fitBounds(bounds, { padding: 50, maxZoom: 12 })
  }
}

// Fly to specific trail
const flyToTrail = (trail) => {
  if (trail.coordinates && map.value) {
    map.value.flyTo({
      center: [trail.coordinates.lng, trail.coordinates.lat],
      zoom: 14,
      essential: true
    })

    // Open popup for this trail
    const marker = markers.value.find(m => {
      const lngLat = m.getLngLat()
      return lngLat.lng === trail.coordinates.lng && lngLat.lat === trail.coordinates.lat
    })

    if (marker) {
      marker.togglePopup()
    }
  }
}

// Clear directions
const clearDirections = () => {
  directionsInfo.value = null
  if (directionsLayer && map.value.getLayer('route')) {
    map.value.removeLayer('route')
    map.value.removeSource('route')
    directionsLayer = null
  }
}

// Get directions between two trails
const getDirections = async () => {
  if (!directionsStart.value || !directionsEnd.value || directionsStart.value === directionsEnd.value) {
    return
  }

  const startTrail = trails.value.find(t => t.id === parseInt(directionsStart.value))
  const endTrail = trails.value.find(t => t.id === parseInt(directionsEnd.value))

  // Debug logging
  console.log('Start Trail:', startTrail)
  console.log('End Trail:', endTrail)

  if (!startTrail || !endTrail) {
    alert('Could not find the selected trails. Please try again.')
    return
  }

  if (!startTrail.coordinates || !endTrail.coordinates) {
    alert('Trail coordinates not available. Please refresh the page and ensure trail data includes coordinates.\n\nMissing coordinates for: ' + 
      (!startTrail.coordinates ? startTrail.name : '') + 
      (!startTrail.coordinates && !endTrail.coordinates ? ' and ' : '') +
      (!endTrail.coordinates ? endTrail.name : ''))
    console.error('Missing coordinates:', {
      startTrail: startTrail.name,
      hasStartCoords: !!startTrail.coordinates,
      endTrail: endTrail.name,
      hasEndCoords: !!endTrail.coordinates
    })
    return
  }

  try {
    // Clear previous route
    clearDirections()

    // Call Mapbox Directions API
    const query = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/walking/${startTrail.coordinates.lng},${startTrail.coordinates.lat};${endTrail.coordinates.lng},${endTrail.coordinates.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    )

    const json = await query.json()

    if (json.routes && json.routes.length > 0) {
      const route = json.routes[0]

      // Store directions info
      directionsInfo.value = {
        distance: (route.distance / 1000).toFixed(2),
        duration: Math.round(route.duration / 60)
      }

      // Add route to map
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: route.geometry
      }

      if (map.value.getSource('route')) {
        map.value.getSource('route').setData(geojson)
      } else {
        map.value.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0d6efd',
            'line-width': 5,
            'line-opacity': 0.75
          }
        })
        directionsLayer = true
      }

      // Fit map to show route
      const coordinates = route.geometry.coordinates
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord)
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

      map.value.fitBounds(bounds, { padding: 100 })

    } else {
      alert('Could not find a route between these trails')
    }
  } catch (error) {
    console.error('Error getting directions:', error)
    alert('Failed to get directions. Please try again.')
  }
}

// Initialize on mount
onMounted(async () => {
  await loadTrails()
  initMap()
})

// Cleanup on unmount
onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.map-container {
  height: 600px;
  width: 100%;
  border-radius: 0.375rem;
}

.geocoder-container {
  position: relative;
}

:deep(.mapboxgl-ctrl-geocoder) {
  max-width: none;
  width: 100%;
  box-shadow: none;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

:deep(.mapboxgl-ctrl-geocoder--input) {
  height: 38px;
  padding: 6px 45px;
  font-size: 14px;
}

.trail-popup {
  padding: 8px;
  min-width: 200px;
}

.custom-marker {
  transition: transform 0.2s ease;
}

.custom-marker:hover {
  transform: scale(1.2);
}

.list-group-item {
  border-left: none;
  border-right: none;
}

.list-group-item:first-child {
  border-top: none;
}

.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}

/* Responsive adjustments */
@media (max-width: 991px) {
  .map-container {
    height: 400px;
  }
}

@media (max-width: 767px) {
  .map-container {
    height: 300px;
  }
}
</style>
