<template>
  <div class="container py-4">
    <header class="mb-4">
      <h1 class="h3">📧 Bulk Email</h1>
      <p class="text-muted">Send emails to multiple users at once</p>
    </header>

    <!-- User Selection -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Select Recipients</h5>
      </div>
      <div class="card-body">
        <!-- Filter Options -->
        <div class="row g-3 mb-3">
          <div class="col-md-4">
            <label class="form-label">Filter by Role</label>
            <select v-model="filterRole" class="form-select" @change="applyFilters">
              <option value="">All Users</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Quick Actions</label>
            <div class="btn-group w-100" role="group">
              <button class="btn btn-outline-primary" @click="selectAll">Select All</button>
              <button class="btn btn-outline-secondary" @click="clearSelection">Clear All</button>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Selected Users</label>
            <div class="alert alert-info mb-0 py-2">
              {{ selectedUsers.length }} user(s) selected
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-hover">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 50px;">
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    :checked="isAllSelected"
                    @change="toggleAll">
                </th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    :value="user.id"
                    v-model="selectedUsers">
                </td>
                <td>{{ user.email }}</td>
                <td>{{ user.username || 'N/A' }}</td>
                <td>
                  <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-secondary'">
                    {{ user.role || 'user' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredUsers.length === 0" class="text-center text-muted py-3">
            No users found
          </div>
        </div>
      </div>
    </div>

    <!-- Email Form -->
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Compose Email</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="sendBulkEmail">
          <div class="mb-3">
            <label for="subject" class="form-label">Subject *</label>
            <input 
              type="text" 
              class="form-control" 
              id="subject" 
              v-model="emailForm.subject"
              required
              placeholder="Enter email subject">
          </div>
          
          <div class="mb-3">
            <label for="message" class="form-label">Message *</label>
            <textarea 
              class="form-control" 
              id="message" 
              v-model="emailForm.message"
              required
              rows="8"
              placeholder="Enter your message here..."></textarea>
          </div>

          <div class="mb-3">
            <label class="form-label">Email Template</label>
            <select v-model="selectedTemplate" @change="applyTemplate" class="form-select">
              <option value="">Custom Message</option>
              <option value="welcome">Welcome Message</option>
              <option value="update">Platform Update</option>
              <option value="reminder">Trail Reminder</option>
            </select>
          </div>

          <div class="d-flex gap-2">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="sending || selectedUsers.length === 0">
              <span v-if="sending" class="spinner-border spinner-border-sm me-2"></span>
              {{ sending ? 'Sending...' : 'Send Email' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="resetForm">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/config/firebase'
import { collection, getDocs, addDoc } from 'firebase/firestore'

const users = ref([])
const filteredUsers = ref([])
const selectedUsers = ref([])
const filterRole = ref('')
const sending = ref(false)
const statusMessage = ref('')
const statusType = ref('success')
const selectedTemplate = ref('')

const emailForm = ref({
  subject: '',
  message: ''
})

const templates = {
  welcome: {
    subject: 'Welcome to Hiking Trails Platform!',
    message: 'Dear Hiker,\n\nWelcome to our Hiking Trails platform! We are excited to have you join our community of outdoor enthusiasts.\n\nExplore amazing trails, book your next adventure, and connect with fellow hikers.\n\nHappy hiking!\n\nBest regards,\nThe Hiking Trails Team'
  },
  update: {
    subject: 'Platform Update - New Features Available',
    message: 'Dear User,\n\nWe have exciting updates to share! Our platform now includes:\n\n- Interactive booking calendar\n- Enhanced trail maps\n- User dashboard\n\nLog in to explore these new features!\n\nBest regards,\nThe Hiking Trails Team'
  },
  reminder: {
    subject: 'Trail Reminder - Plan Your Next Adventure',
    message: 'Dear Hiker,\n\nIt\'s been a while since your last trail visit! Check out our latest trails and plan your next adventure.\n\nDon\'t forget to book your spot to secure your hiking date.\n\nSee you on the trails!\n\nBest regards,\nThe Hiking Trails Team'
  }
}

const isAllSelected = computed(() => {
  return filteredUsers.value.length > 0 && 
         selectedUsers.value.length === filteredUsers.value.length
})

const fetchUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    users.value = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    applyFilters()
  } catch (error) {
    console.error('Error fetching users:', error)
    statusMessage.value = 'Error loading users'
    statusType.value = 'danger'
  }
}

const applyFilters = () => {
  if (filterRole.value === '') {
    filteredUsers.value = [...users.value]
  } else {
    filteredUsers.value = users.value.filter(user => 
      (user.role || 'user') === filterRole.value
    )
  }
}

const selectAll = () => {
  selectedUsers.value = filteredUsers.value.map(user => user.id)
}

const clearSelection = () => {
  selectedUsers.value = []
}

const toggleAll = () => {
  if (isAllSelected.value) {
    clearSelection()
  } else {
    selectAll()
  }
}

const applyTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    emailForm.value.subject = templates[selectedTemplate.value].subject
    emailForm.value.message = templates[selectedTemplate.value].message
  }
}

const sendBulkEmail = async () => {
  if (selectedUsers.value.length === 0) {
    statusMessage.value = 'Please select at least one recipient'
    statusType.value = 'danger'
    return
  }

  if (!emailForm.value.subject || !emailForm.value.message) {
    statusMessage.value = 'Please fill in subject and message'
    statusType.value = 'danger'
    return
  }

  sending.value = true
  statusMessage.value = ''

  try {
    // Get selected user emails
    const recipients = users.value
      .filter(user => selectedUsers.value.includes(user.id))
      .map(user => user.email)

    // Save email to Firestore (for logging/history)
    await addDoc(collection(db, 'bulk_emails'), {
      subject: emailForm.value.subject,
      message: emailForm.value.message,
      recipients: recipients,
      recipientCount: recipients.length,
      sentAt: new Date(),
      status: 'sent'
    })

    // In a real application, you would call a Firebase Function to send actual emails
    // For now, we'll simulate the email sending
    console.log('Sending bulk email to:', recipients)
    console.log('Subject:', emailForm.value.subject)
    console.log('Message:', emailForm.value.message)

    statusMessage.value = `Email successfully sent to ${recipients.length} user(s)!`
    statusType.value = 'success'
    resetForm()
  } catch (error) {
    console.error('Error sending bulk email:', error)
    statusMessage.value = 'Error sending email. Please try again.'
    statusType.value = 'danger'
  } finally {
    sending.value = false
  }
}

const resetForm = () => {
  emailForm.value.subject = ''
  emailForm.value.message = ''
  selectedTemplate.value = ''
  clearSelection()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-hover tbody tr {
  cursor: pointer;
}
</style>
