<!-- Firebase Test Page -->
<template>
  <div class="firebase-test container py-4">
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">Firebase Configuration Test</h4>
      </div>
      <div class="card-body">
        <!-- Configuration Status -->
        <div class="mb-4">
          <h5> Configuration Status</h5>
          <div v-if="configStatus.isConfigured" class="alert alert-success">
            <i class="bi bi-check-circle-fill me-2"></i>
            Firebase is configured correctly!
          </div>
          <div v-else class="alert alert-danger">
            <i class="bi bi-x-circle-fill me-2"></i>
            Firebase configuration not found. Please update <code>src/config/firebase.js</code>
          </div>
          
          <table class="table table-sm mt-3">
            <tbody>
              <tr>
                <th>API Key:</th>
                <td><code>{{ configStatus.apiKey }}</code></td>
              </tr>
              <tr>
                <th>Project ID:</th>
                <td><code>{{ configStatus.projectId }}</code></td>
              </tr>
              <tr>
                <th>Auth Domain:</th>
                <td><code>{{ configStatus.authDomain }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Connection Test -->
        <div class="mb-4">
          <h5> Connection Test</h5>
          <button 
            class="btn btn-primary" 
            @click="testConnection"
            :disabled="testing"
          >
            {{ testing ? 'Testing...' : 'Test Firebase Connection' }}
          </button>

          <div v-if="connectionResult.tested" class="mt-3">
            <div 
              :class="connectionResult.success ? 'alert alert-success' : 'alert alert-danger'"
            >
              {{ connectionResult.message }}
            </div>
          </div>
        </div>

        <!-- Authentication Test -->
        <div class="mb-4">
          <h5> Authentication Status</h5>
          <div v-if="authUser">
            <div class="alert alert-success">
              <strong>Logged in as:</strong><br>
              <strong>Email:</strong> {{ authUser.email }}<br>
              <strong>UID:</strong> {{ authUser.uid }}<br>
              <strong>Username:</strong> {{ authUser.username || 'N/A' }}<br>
              <strong>Role:</strong> {{ authUser.role || 'user' }}
            </div>
            <button class="btn btn-warning" @click="testLogout">
              Logout
            </button>
          </div>
          <div v-else>
            <div class="alert alert-warning">
              Not logged in. Please use the main login form to test authentication.
            </div>
          </div>
        </div>

        <!-- Firestore Test -->
        <div class="mb-4">
          <h5> Firestore Test</h5>
          <button 
            class="btn btn-primary" 
            @click="testFirestore"
            :disabled="testingFirestore"
          >
            {{ testingFirestore ? 'Testing...' : 'Test Firestore Connection' }}
          </button>

          <div v-if="firestoreResult.tested" class="mt-3">
            <div 
              :class="firestoreResult.success ? 'alert alert-success' : 'alert alert-danger'"
            >
              {{ firestoreResult.message }}
            </div>
          </div>
        </div>

        <!-- Setup Instructions -->
        <div class="alert alert-info">
          <h6><i class="bi bi-info-circle-fill me-2"></i>Setup Instructions:</h6>
          <ol class="mb-0">
            <li>Check <code>FIREBASE_SETUP.md</code> for detailed setup guide</li>
            <li>Update <code>src/config/firebase.js</code> with your Firebase config</li>
            <li>Enable Authentication and Firestore in Firebase Console</li>
            <li>Test the connection using the buttons above</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '@/config/firebase'
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore'
import { getCurrentUser, logoutUser } from '@/services/firebaseAuth'

const configStatus = ref({
  isConfigured: false,
  apiKey: 'Not configured',
  projectId: 'Not configured',
  authDomain: 'Not configured'
})

const testing = ref(false)
const connectionResult = ref({
  tested: false,
  success: false,
  message: ''
})

const testingFirestore = ref(false)
const firestoreResult = ref({
  tested: false,
  success: false,
  message: ''
})

const authUser = ref(null)

// Check Firebase configuration
onMounted(async () => {
  try {
    const config = auth.app.options
    configStatus.value = {
      isConfigured: config.apiKey !== 'YOUR_API_KEY',
      apiKey: config.apiKey.substring(0, 20) + '...',
      projectId: config.projectId,
      authDomain: config.authDomain
    }

    // Check if user is logged in
    authUser.value = await getCurrentUser()
  } catch (error) {
    console.error('Configuration check failed:', error)
  }
})

// Test Firebase connection
const testConnection = async () => {
  testing.value = true
  connectionResult.value = {
    tested: false,
    success: false,
    message: ''
  }

  try {
    // Simple test: check if auth is initialized
    if (auth && auth.app) {
      connectionResult.value = {
        tested: true,
        success: true,
        message: 'Successfully connected to Firebase! Auth service is active.'
      }
    } else {
      throw new Error('Auth service not initialized')
    }
  } catch (error) {
    connectionResult.value = {
      tested: true,
      success: false,
      message: `Connection failed: ${error.message}`
    }
  } finally {
    testing.value = false
  }
}

// Test Firestore
const testFirestore = async () => {
  testingFirestore.value = true
  firestoreResult.value = {
    tested: false,
    success: false,
    message: ''
  }

  try {
    // Try to read from a test collection
    const testQuery = query(collection(db, 'users'), limit(1))
    await getDocs(testQuery)
    
    firestoreResult.value = {
      tested: true,
      success: true,
      message: 'Firestore connection successful! Database is accessible.'
    }
  } catch (error) {
    firestoreResult.value = {
      tested: true,
      success: false,
      message: `Firestore test failed: ${error.message}. Make sure Firestore is enabled in Firebase Console.`
    }
  } finally {
    testingFirestore.value = false
  }
}

// Test logout
const testLogout = async () => {
  try {
    await logoutUser()
    authUser.value = null
    alert('Logged out successfully!')
  } catch (error) {
    alert(`Logout failed: ${error.message}`)
  }
}
</script>

<style scoped>
.firebase-test {
  max-width: 800px;
  margin: 0 auto;
}

code {
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.table th {
  width: 140px;
  font-weight: 600;
}

.alert {
  border-radius: 8px;
}

h5 {
  color: #333;
  font-weight: 600;
  margin-bottom: 1rem;
}
</style>
