<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <!-- Header -->
        <div class="text-center mb-4">
          <h2 class="fw-bold">
            <i class="bi bi-stars text-primary"></i>
            AI Trail Recommendation
          </h2>
          <p class="text-muted">Get personalized hiking trail recommendations powered by Google Gemini AI</p>
        </div>

        <!-- Input Form -->
        <div class="card shadow-sm mb-4">
          <div class="card-body">
            <h5 class="card-title mb-3">Tell us your preferences</h5>
            
            <div class="mb-3">
              <label class="form-label">Difficulty Level</label>
              <select v-model="preferences.difficulty" class="form-select">
                <option value="">Any</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Maximum Length (km)</label>
              <input 
                v-model.number="preferences.maxLength" 
                type="number" 
                class="form-control" 
                placeholder="e.g. 10"
              >
            </div>

            <div class="mb-3">
              <label class="form-label">What are you looking for?</label>
              <textarea 
                v-model="preferences.description" 
                class="form-control" 
                rows="3"
                placeholder="e.g. scenic views, waterfall, family-friendly, dog-friendly, etc."
              ></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Location Preference</label>
              <input 
                v-model="preferences.location" 
                type="text" 
                class="form-control" 
                placeholder="e.g. Victoria, NSW, etc."
              >
            </div>

            <button 
              @click="getRecommendations" 
              class="btn btn-primary w-100"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ loading ? 'Getting Recommendations...' : 'Get AI Recommendations' }}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ error }}
          <button type="button" class="btn-close" @click="error = ''"></button>
        </div>

        <!-- AI Response -->
        <div v-if="aiResponse" class="card shadow-sm mb-4">
          <div class="card-body">
            <h5 class="card-title text-primary mb-3">
              <i class="bi bi-robot"></i>
              AI Recommendations
            </h5>
            <div class="ai-response" v-html="formattedResponse"></div>
          </div>
        </div>

        <!-- Available Trails -->
        <div v-if="recommendedTrails.length > 0" class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">
              <i class="bi bi-map"></i>
              Matching Trails ({{ recommendedTrails.length }})
            </h5>
            <div class="row">
              <div 
                v-for="trail in recommendedTrails" 
                :key="trail.id" 
                class="col-md-6 mb-3"
              >
                <div class="card h-100 trail-card">
                  <div class="card-body">
                    <h6 class="card-title">{{ trail.name }}</h6>
                    <p class="text-muted small mb-2">{{ trail.location }}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-info">{{ trail.difficulty }}</span>
                      <span class="text-muted small">{{ trail.length }} km</span>
                    </div>
                    <p class="card-text small">{{ trail.description?.substring(0, 100) }}...</p>
                    <button 
                      @click="viewTrailDetails(trail)" 
                      class="btn btn-sm btn-outline-primary w-100"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API Key Notice -->
        <div class="alert alert-info mt-4" role="alert">
          <i class="bi bi-info-circle-fill me-2"></i>
          <strong>Note:</strong> This feature uses Google Gemini AI. Make sure you have configured your API key.
        </div>
      </div>
    </div>

    <!-- Trail Details Modal -->
    <div v-if="selectedTrail" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedTrail.name }}</h5>
            <button type="button" class="btn-close" @click="selectedTrail = null"></button>
          </div>
          <div class="modal-body">
            <p><strong>Location:</strong> {{ selectedTrail.location }}</p>
            <p><strong>Difficulty:</strong> {{ selectedTrail.difficulty }}</p>
            <p><strong>Length:</strong> {{ selectedTrail.length }} km</p>
            <p><strong>Description:</strong> {{ selectedTrail.description }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="selectedTrail = null">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/config/firebase'

// Gemini API Key - Using Gemini 2.5 Flash 
const GEMINI_API_KEY = 'AIzaSyBdZT2rytSjPZ-0oR1ZLtaOSy9xWQmTniM' 

const preferences = ref({
  difficulty: '',
  maxLength: null,
  description: '',
  location: ''
})

const loading = ref(false)
const error = ref('')
const aiResponse = ref('')
const allTrails = ref([])
const recommendedTrails = ref([])
const selectedTrail = ref(null)

// Format AI response with basic HTML
const formattedResponse = computed(() => {
  if (!aiResponse.value) return ''
  
  return aiResponse.value
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/- /g, '• ')
})

// Fetch all trails from Firestore
const fetchTrails = async () => {
  try {
    const trailsSnapshot = await getDocs(collection(db, 'trails'))
    allTrails.value = trailsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error('Error fetching trails:', err)
  }
}

// Get AI recommendations
const getRecommendations = async () => {
  if (!preferences.value.description && !preferences.value.difficulty && !preferences.value.location) {
    error.value = 'Please provide at least one preference'
    return
  }

  loading.value = true
  error.value = ''
  aiResponse.value = ''
  recommendedTrails.value = []

  try {
    // Fetch trails if not already loaded
    if (allTrails.value.length === 0) {
      await fetchTrails()
    }

    // Check if API key is configured
    const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_API_KEY_HERE'
    
    console.log('API Key loaded:', hasApiKey ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT CONFIGURED')
    console.log('Has API Key:', hasApiKey)
    
    if (hasApiKey) {
      // Use Gemini AI
      console.log('Initializing Gemini AI...')
      console.log('Using API Key:', GEMINI_API_KEY.substring(0, 20) + '...')
      
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      // Use Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      console.log('Gemini AI initialized successfully with gemini-2.5-flash model')

      // Build prompt with trail data (limit to first 10 trails to avoid too long prompt)
      const limitedTrails = allTrails.value.slice(0, 10)
      const trailsData = limitedTrails.map(t => 
        `${t.name} (${t.location}) - ${t.difficulty}, ${t.length}km`
      ).join('\n')

      const prompt = `You are a hiking trail expert. Recommend 3 trails based on:

Preferences:
- Difficulty: ${preferences.value.difficulty || 'Any'}
- Max Length: ${preferences.value.maxLength || 'Any'} km
- Interests: ${preferences.value.description || 'General hiking'}
- Location: ${preferences.value.location || 'Any'}

Available trails:
${trailsData}

Provide a brief, friendly recommendation (max 200 words) with top 3 trail suggestions.`

      console.log('Sending request to Gemini AI...')
      console.log('Prompt length:', prompt.length)
      
      try {
        // Get AI response with timeout and better error handling
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
          )
        ])
        
        const response = result.response
        const text = response.text()
        
        console.log('Received response from Gemini AI')
        console.log('Response length:', text.length)
        
        aiResponse.value = text
      } catch (apiError) {
        console.error('Gemini API Error:', apiError)
        throw apiError
      }
    } else {
      // Fallback: Use simple text-based recommendation without AI
      console.log('Using fallback recommendation system (no API key)')
      
      aiResponse.value = `**Trail Recommendations Based on Your Preferences:**\n\n`
      
      if (preferences.value.difficulty) {
        aiResponse.value += `Looking for **${preferences.value.difficulty}** difficulty trails.\n`
      }
      if (preferences.value.maxLength) {
        aiResponse.value += `Maximum length: **${preferences.value.maxLength} km**.\n`
      }
      if (preferences.value.description) {
        aiResponse.value += `Your interests: **${preferences.value.description}**.\n`
      }
      if (preferences.value.location) {
        aiResponse.value += `Preferred location: **${preferences.value.location}**.\n`
      }
      
      aiResponse.value += `\n**Note:** For AI-powered personalized recommendations, please configure your Gemini API key. See AI_SETUP_GUIDE.md for instructions.\n\nBelow are the trails that match your criteria:`
    }

    // Filter trails based on preferences
    recommendedTrails.value = allTrails.value.filter(trail => {
      let matches = true

      if (preferences.value.difficulty && trail.difficulty) {
        matches = matches && trail.difficulty.toLowerCase() === preferences.value.difficulty.toLowerCase()
      }

      if (preferences.value.maxLength && trail.length) {
        matches = matches && parseFloat(trail.length) <= preferences.value.maxLength
      }

      if (preferences.value.location) {
        matches = matches && trail.location?.toLowerCase().includes(preferences.value.location.toLowerCase())
      }

      return matches
    })

  } catch (err) {
    console.error('Error getting AI recommendations:', err)
    console.error('Error type:', err.constructor.name)
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      status: err.status,
      statusText: err.statusText
    })
    
    // More detailed error message based on actual error
    let errorMsg = ''
    const errStr = err.toString().toLowerCase()
    
    if (err.status === 400 || errStr.includes('api key') || errStr.includes('invalid')) {
      errorMsg = '❌ Invalid API Key\n\nThe API key is not valid. Please:\n1. Go to https://aistudio.google.com/app/apikey\n2. Create a new API key\n3. Replace the key in the code'
    } else if (err.status === 429 || errStr.includes('quota') || errStr.includes('rate limit')) {
      errorMsg = '❌ Rate Limit Exceeded\n\nToo many requests. Please wait 1 minute and try again.'
    } else if (errStr.includes('timeout')) {
      errorMsg = '❌ Request Timeout\n\nThe request took too long. Try with simpler preferences or check your connection.'
    } else if (errStr.includes('failed to fetch') || errStr.includes('networkerror') || errStr.includes('network')) {
      errorMsg = '❌ Network Error\n\nCannot connect to Google Gemini API.\n\nPossible causes:\n• Google services blocked in your region\n• Firewall blocking the request\n• Internet connection issues\n• VPN required for access\n\n💡 Solution: Remove or comment out the API key to use basic filtering instead.'
    } else if (errStr.includes('cors')) {
      errorMsg = '❌ CORS Error\n\nBrowser security blocked the request. Try:\n• Use Chrome/Edge with disabled CORS (for testing)\n• Access via HTTPS\n• Use a VPN'
    } else {
      errorMsg = `❌ Error: ${err.message || err.toString()}\n\nFull details in console (Press F12)`
    }
    
    error.value = errorMsg
    
    // Also filter trails to show something useful
    recommendedTrails.value = allTrails.value.filter(trail => {
      let matches = true
      if (preferences.value.difficulty && trail.difficulty) {
        matches = matches && trail.difficulty.toLowerCase() === preferences.value.difficulty.toLowerCase()
      }
      if (preferences.value.maxLength && trail.length) {
        matches = matches && parseFloat(trail.length) <= preferences.value.maxLength
      }
      if (preferences.value.location) {
        matches = matches && trail.location?.toLowerCase().includes(preferences.value.location.toLowerCase())
      }
      return matches
    }).slice(0, 6)
    
  } finally {
    loading.value = false
  }
}

const viewTrailDetails = (trail) => {
  selectedTrail.value = trail
}

// Load trails on mount
fetchTrails()
</script>

<style scoped>
.ai-response {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #333;
}

.trail-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e0e0e0;
}

.trail-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.badge {
  text-transform: capitalize;
}

.modal.show {
  display: block;
}
</style>
