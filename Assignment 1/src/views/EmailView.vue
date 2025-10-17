<template>
  <div class="email-view">
    <div class="container">
      <!-- Page Header -->
      <header class="page-header">
        <h1><span aria-hidden="true">📧</span> Send Email</h1>
        <p class="subtitle">Send emails with attachments using SendGrid API</p>
      </header>
      
      <!-- Configuration Status Card -->
      <section 
        class="config-status" 
        :class="configStatus.configured ? 'configured' : 'not-configured'"
        role="status"
        :aria-label="configStatus.configured ? 'SendGrid is configured and ready' : 'SendGrid configuration required'">
        <div class="status-icon" aria-hidden="true">
          {{ configStatus.configured ? '✅' : '⚠️' }}
        </div>
        <div class="status-content">
          <h2 class="h5">{{ configStatus.configured ? 'SendGrid Configured' : 'Configuration Required' }}</h2>
          <p>{{ configStatus.message }}</p>
          <button 
            v-if="!configStatus.configured" 
            @click="showSetupInstructions = true" 
            class="btn-setup"
            aria-label="View SendGrid setup instructions">
            View Setup Instructions
          </button>
        </div>
      </section>
      
      <!-- Setup Instructions Modal -->
      <div 
        v-if="showSetupInstructions" 
        class="modal-overlay" 
        @click="showSetupInstructions = false"
        @keydown="handleModalKeydown">
        <div 
          class="modal-content" 
          @click.stop
          role="dialog"
          aria-modal="true"
          aria-labelledby="setup-modal-title"
          ref="setupModalRef">
          <div class="modal-header">
            <h2 id="setup-modal-title"><span aria-hidden="true">🔧</span> SendGrid Setup Instructions</h2>
            <button 
              @click="showSetupInstructions = false" 
              class="btn-close"
              aria-label="Close setup instructions">&times;</button>
          </div>
          <div class="modal-body">
            <ol class="setup-steps">
              <li>
                <strong>Create SendGrid Account</strong>
                <p>Visit <a href="https://signup.sendgrid.com/" target="_blank" rel="noopener noreferrer">SendGrid Signup</a> and create a free account</p>
              </li>
              <li>
                <strong>Verify Sender Email</strong>
                <p>Go to Settings → Sender Authentication → Verify a Single Sender</p>
              </li>
              <li>
                <strong>Generate API Key</strong>
                <p>Go to Settings → API Keys → Create API Key (with "Full Access" permissions)</p>
              </li>
              <li>
                <strong>Create .env File</strong>
                <p>In your project root, create a <code>.env</code> file:</p>
                <pre><code>VITE_SENDGRID_API_KEY=your_api_key_here
VITE_SENDER_EMAIL=your_verified_email@example.com</code></pre>
              </li>
              <li>
                <strong>Restart Development Server</strong>
                <p>Stop and restart <code>npm run dev</code> to load the new environment variables</p>
              </li>
            </ol>
            <p class="note" role="note"><span aria-hidden="true">📝</span> Note: Free tier allows 100 emails per day</p>
          </div>
        </div>
      </div>
      <!-- Email Form -->
      <section class="email-form-card" aria-labelledby="email-form-heading">
        <h2 id="email-form-heading" class="sr-only">Email Composition Form</h2>
        <form @submit.prevent="handleSendEmail" class="email-form" novalidate>
          <!-- Recipient Email -->
          <div class="form-group">
            <label for="recipient">
              <span class="label-text">To:</span>
              <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="recipient"
              v-model="emailForm.to"
              type="email"
              placeholder="recipient@example.com"
              required
              aria-required="true"
              :aria-invalid="emailErrors.to ? 'true' : 'false'"
              :aria-describedby="emailErrors.to ? 'recipient-error' : undefined"
              :disabled="sending"
            />
            <span v-if="emailErrors.to" id="recipient-error" class="error-text" role="alert">
              {{ emailErrors.to }}
            </span>
          </div>
          
          <!-- Subject -->
          <div class="form-group">
            <label for="subject">
              <span class="label-text">Subject:</span>
              <span class="required" aria-label="required">*</span>
            </label>
            <input
              id="subject"
              v-model="emailForm.subject"
              type="text"
              placeholder="Enter email subject"
              required
              aria-required="true"
              :aria-invalid="emailErrors.subject ? 'true' : 'false'"
              :aria-describedby="emailErrors.subject ? 'subject-error' : undefined"
              :disabled="sending"
            />
            <span v-if="emailErrors.subject" id="subject-error" class="error-text" role="alert">
              {{ emailErrors.subject }}
            </span>
          </div>
          
          <!-- Email Content Tabs -->
          <div class="form-group">
            <fieldset>
              <legend class="label-text">Email Content:</legend>
              <div class="content-tabs" role="tablist" aria-label="Email content format">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="contentTab === 'text'"
                  :aria-controls="contentTab === 'text' ? 'text-content' : undefined"
                  :class="['tab', { active: contentTab === 'text' }]"
                  @click="contentTab = 'text'"
                  :disabled="sending"
                  id="tab-text"
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  role="tab"
                  :aria-selected="contentTab === 'html'"
                  :aria-controls="contentTab === 'html' ? 'html-content' : undefined"
                  :class="['tab', { active: contentTab === 'html' }]"
                  @click="contentTab = 'html'"
                  :disabled="sending"
                  id="tab-html"
                >
                  HTML
                </button>
              </div>
              
              <!-- Plain Text Content -->
              <div v-if="contentTab === 'text'" role="tabpanel" id="text-content" aria-labelledby="tab-text">
                <label for="text-content-input" class="sr-only">Plain text email content</label>
                <textarea
                  id="text-content-input"
                  v-model="emailForm.text"
                  placeholder="Enter your message here..."
                  rows="8"
                  required
                  aria-required="true"
                  :disabled="sending"
                ></textarea>
              </div>
              
              <!-- HTML Content -->
              <div v-if="contentTab === 'html'" role="tabpanel" id="html-content" aria-labelledby="tab-html">
                <label for="html-content-input" class="sr-only">HTML email content</label>
                <textarea
                  id="html-content-input"
                  v-model="emailForm.html"
                  placeholder="<h1>Enter HTML content here...</h1>"
                  rows="8"
                  :disabled="sending"
                ></textarea>
              </div>
            </fieldset>
          </div>
          <!-- File Attachments -->
          <div class="form-group">
            <label for="file-input">
              <span class="label-text">Attachments:</span>
              <span class="file-info">(Max 10MB per file)</span>
            </label>
            <div class="file-upload-area">
              <input
                ref="fileInput"
                type="file"
                multiple
                @change="handleFileSelect"
                accept="image/*,.pdf,.doc,.docx,.txt"
                :disabled="sending"
                id="file-input"
                aria-describedby="file-upload-help"
              />
              <label for="file-input" class="file-upload-button" tabindex="0">
                <span aria-hidden="true">📎</span> Choose Files
              </label>
              <span class="file-count" role="status" aria-live="polite">
                {{ attachments.length }} file(s) selected
              </span>
              <span id="file-upload-help" class="sr-only">
                You can upload multiple files. Maximum 10 megabytes per file. 
                Accepted formats: images, PDF, Word documents, and text files.
              </span>
            </div>
            
            <!-- Selected Files List -->
            <div v-if="attachments.length > 0" class="files-list" role="list" aria-label="Selected files">
              <div 
                v-for="(file, index) in attachments" 
                :key="index" 
                class="file-item"
                role="listitem">
                <span class="file-icon" aria-hidden="true">📄</span>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="btn-remove-file"
                  :disabled="sending"
                  :aria-label="`Remove file ${file.name}`"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
          
          <!-- Quick Templates -->
          <div class="form-group">
            <fieldset>
              <legend class="label-text">Quick Templates:</legend>
              <div class="template-buttons" role="group" aria-label="Email template options">
                <button
                  type="button"
                  @click="loadTemplate('welcome')"
                  class="btn-template"
                  :disabled="sending"
                  aria-label="Load welcome email template"
                >
                  Welcome Email
                </button>
                <button
                  type="button"
                  @click="loadTemplate('trail')"
                  class="btn-template"
                  :disabled="sending"
                  aria-label="Load trail recommendation template"
                >
                  Trail Recommendation
                </button>
                <button
                  type="button"
                  @click="loadTemplate('newsletter')"
                  class="btn-template"
                  :disabled="sending"
                  aria-label="Load newsletter template"
                >
                  Newsletter
                </button>
              </div>
            </fieldset>
          </div>
          
          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message" role="alert" aria-live="assertive">
            <span class="error-icon" aria-hidden="true">⚠️</span>
            {{ errorMessage }}
          </div>
          <!-- Success Message -->
          <div v-if="successMessage" class="success-message" role="status" aria-live="polite">
            <span class="success-icon" aria-hidden="true">✅</span>
            {{ successMessage }}
          </div>
          
          <!-- Submit Buttons -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn-send"
              :disabled="sending || !configStatus.configured"
              :aria-disabled="sending || !configStatus.configured"
              :aria-busy="sending"
              :aria-label="sending ? 'Sending email, please wait' : 'Send email'"
            >
              <span v-if="sending" class="spinner" aria-hidden="true"></span>
              <span v-if="sending">Sending...</span>
              <span v-else><span aria-hidden="true">📤</span> Send Email</span>
            </button>
            <button
              type="button"
              @click="resetForm"
              class="btn-reset"
              :disabled="sending"
              :aria-disabled="sending"
              aria-label="Reset form to default values"
            >
              <span aria-hidden="true">🔄</span> Reset
            </button>
          </div>
        </form>
      </section>
      
      <!-- Email History -->
      <section v-if="emailHistory.length > 0" class="email-history" aria-labelledby="email-history-heading">
        <h2 id="email-history-heading"><span aria-hidden="true">📜</span> Recent Emails</h2>
        <div class="history-list" role="list" aria-label="Sent email history">
          <div v-for="(email, index) in emailHistory" :key="index" class="history-item" role="listitem">
            <div class="history-icon" aria-hidden="true">✉️</div>
            <div class="history-content">
              <div class="history-to" aria-label="Recipient">To: {{ email.to }}</div>
              <div class="history-subject" aria-label="Subject">{{ email.subject }}</div>
              <div class="history-meta">
                <time class="history-time" :datetime="email.timestamp" aria-label="Sent time">{{ email.timestamp }}</time>
                <span class="history-status" :class="email.status" :aria-label="`Status: ${email.status}`">{{ email.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  sendEmail,
  checkConfiguration,
  isValidEmail,
  isValidFileSize
} from '@/services/emailService'
// Form data
const emailForm = ref({
  to: '',
  subject: '',
  text: '',
  html: ''
})
// UI state
const contentTab = ref('text')
const attachments = ref([])
const fileInput = ref(null)
const sending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showSetupInstructions = ref(false)
const emailErrors = ref({
  to: '',
  subject: ''
})
// Configuration status
const configStatus = ref({
  configured: false,
  hasApiKey: false,
  hasSenderEmail: false,
  message: ''
})
// Email history
const emailHistory = ref([])

//Check SendGrid configuration on component mount
onMounted(() => {
  configStatus.value = checkConfiguration()
  loadEmailHistory()
})

// Handle file selection
 
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)

  // Validate file sizes
  const invalidFiles = files.filter(file => !isValidFileSize(file, 10))
  if (invalidFiles.length > 0) {
    errorMessage.value = `Some files are too large (max 10MB): ${invalidFiles.map(f => f.name).join(', ')}`
    return
  }
  attachments.value = files
  errorMessage.value = ''
}

// Remove a file from attachments
const removeFile = (index) => {
  attachments.value.splice(index, 1)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Handle modal keyboard events
const handleModalKeydown = (event) => {
  if (event.key === 'Escape') {
    showSetupInstructions.value = false
  }
}

// Validate form fields
const validateField = (field) => {
  emailErrors.value[field] = ''
  
  if (field === 'to') {
    if (!emailForm.value.to) {
      emailErrors.value.to = 'Recipient email is required'
    } else if (!isValidEmail(emailForm.value.to)) {
      emailErrors.value.to = 'Please enter a valid email address'
    }
  }
  
  if (field === 'subject') {
    if (!emailForm.value.subject) {
      emailErrors.value.subject = 'Subject is required'
    } else if (emailForm.value.subject.length < 3) {
      emailErrors.value.subject = 'Subject must be at least 3 characters'
    }
  }
}

// Load email template
const loadTemplate = (templateType) => {
  switch (templateType) {
    case 'welcome':
      emailForm.value.subject = 'Welcome to Hiking Trails App!'
      emailForm.value.text = 'Hi there,\n\nWelcome to our Hiking Trails App! We\'re excited to have you on board.\n\nHappy hiking!\n\nBest regards,\nThe Hiking Trails Team'
      emailForm.value.html = '<div style="font-family: Arial, sans-serif;"><h2 style="color: #4CAF50;">Welcome!</h2><p>Hi there,</p><p>Welcome to our Hiking Trails App! We\'re excited to have you on board.</p><p>Happy hiking!</p></div>'
      break
    case 'trail':
      emailForm.value.subject = 'Check out this amazing trail!'
      emailForm.value.text = 'We found a great trail for you!\n\nTrail: Mount Summit Trail\nDifficulty: Moderate\nDistance: 5.2 km\n\nThis trail offers breathtaking views and is perfect for a weekend hike.'
      emailForm.value.html = '<div style="font-family: Arial, sans-serif;"><h2 style="color: #4CAF50;">Trail Recommendation</h2><p>We found a great trail for you!</p><div style="background: #f5f5f5; padding: 15px; border-radius: 8px;"><h3>Mount Summit Trail</h3><p><strong>Difficulty:</strong> Moderate</p><p><strong>Distance:</strong> 5.2 km</p></div></div>'
      break
    case 'newsletter':
      emailForm.value.subject = 'Monthly Hiking Newsletter'
      emailForm.value.text = 'Hello Hikers,\n\nThis month\'s highlights:\n- New trail added: Forest Loop\n- Hiking tips for winter\n- Community meetup on Sunday\n\nHappy trails!'
      emailForm.value.html = '<div style="font-family: Arial, sans-serif;"><h2 style="color: #4CAF50;">Monthly Newsletter</h2><p>Hello Hikers,</p><h3>This month\'s highlights:</h3><ul><li>New trail added: Forest Loop</li><li>Hiking tips for winter</li><li>Community meetup on Sunday</li></ul><p>Happy trails!</p></div>'
      break
  }
  
  contentTab.value = 'html'
}

/**
 * Handle email send
 */
const handleSendEmail = async () => {
  // Clear previous messages
  errorMessage.value = ''
  successMessage.value = ''
  
  // Validate configuration
  if (!configStatus.value.configured) {
    errorMessage.value = 'Please configure SendGrid first. Click "View Setup Instructions" above.'
    showSetupInstructions.value = true
    return
  }
  
  // Validate form fields
  validateField('to')
  validateField('subject')
  
  // Check if there are validation errors
  if (emailErrors.value.to || emailErrors.value.subject) {
    errorMessage.value = 'Please fix the errors in the form'
    return
  }
  
  // Validate recipient email
  if (!isValidEmail(emailForm.value.to)) {
    emailErrors.value.to = 'Please enter a valid recipient email address'
    errorMessage.value = 'Please enter a valid recipient email address'
    return
  }
  
  // Validate content
  if (!emailForm.value.text && !emailForm.value.html) {
    errorMessage.value = 'Please enter email content (text or HTML)'
    return
  }
  
  sending.value = true
  
  try {
    // Prepare email data
    const emailData = {
      to: emailForm.value.to,
      subject: emailForm.value.subject,
      text: emailForm.value.text,
      html: emailForm.value.html || emailForm.value.text,
      attachments: attachments.value
    }
    
    // Send email
    const result = await sendEmail(emailData)
    
    console.log('Email sent successfully:', result)
    
    successMessage.value = `Email sent successfully to ${emailForm.value.to}!`
    
    // Add to history
    addToHistory({
      to: emailForm.value.to,
      subject: emailForm.value.subject,
      timestamp: new Date().toLocaleString(),
      status: 'sent'
    })
    
    // Reset form after successful send
    setTimeout(() => {
      resetForm()
      successMessage.value = ''
    }, 3000)
    
  } catch (error) {
    console.error('Failed to send email:', error)
    errorMessage.value = error.message || 'Failed to send email. Please check your configuration and try again.'
  } finally {
    sending.value = false
  }
}

/**
 * Reset form
 */
const resetForm = () => {
  emailForm.value = {
    to: '',
    subject: '',
    text: '',
    html: ''
  }
  attachments.value = []
  contentTab.value = 'text'
  errorMessage.value = ''
  successMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

/**
 * Add email to history
 */
const addToHistory = (email) => {
  emailHistory.value.unshift(email)
  if (emailHistory.value.length > 10) {
    emailHistory.value = emailHistory.value.slice(0, 10)
  }
  saveEmailHistory()
}

/**
 * Save email history to localStorage
 */
const saveEmailHistory = () => {
  localStorage.setItem('emailHistory', JSON.stringify(emailHistory.value))
}

/**
 * Load email history from localStorage
 */
const loadEmailHistory = () => {
  const saved = localStorage.getItem('emailHistory')
  if (saved) {
    emailHistory.value = JSON.parse(saved)
  }
}
</script>

<style scoped>
.email-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5em;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.1em;
  opacity: 0.9;
}

/* Configuration Status Card */
.config-status {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.config-status.configured {
  border-left: 5px solid #4CAF50;
}

.config-status.not-configured {
  border-left: 5px solid #ff9800;
}

.status-icon {
  font-size: 2.5em;
}

.status-content h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.status-content p {
  margin: 0 0 10px 0;
  color: #666;
}

.btn-setup {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.3s;
}

.btn-setup:hover {
  background: #5568d3;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2em;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.setup-steps {
  padding-left: 20px;
}

.setup-steps li {
  margin-bottom: 20px;
  line-height: 1.6;
}

.setup-steps strong {
  color: #667eea;
  font-size: 1.1em;
}

.setup-steps code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.setup-steps pre {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
}

.note {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 10px 15px;
  margin-top: 20px;
  border-radius: 4px;
}

/* Email Form Card */
.email-form-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.label-text {
  color: #333;
}

.required {
  color: #e74c3c;
}

.file-info {
  font-size: 0.85em;
  color: #666;
  font-weight: normal;
}

.form-group input[type="email"],
.form-group input[type="text"],
.form-group textarea {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

/* Content Tabs */
.content-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.tab {
  flex: 1;
  padding: 10px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.tab:hover {
  background: #e8e8e8;
}

.tab.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* File Upload */
.file-upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.file-upload-area input[type="file"] {
  display: none;
}

.file-upload-button {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.file-upload-button:hover {
  background: #5568d3;
}

.file-count {
  color: #666;
  font-size: 0.9em;
}

/* Files List */
.files-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.file-icon {
  font-size: 1.5em;
}

.file-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.file-size {
  color: #666;
  font-size: 0.9em;
}

.btn-remove-file {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  transition: background 0.3s;
}

.btn-remove-file:hover {
  background: #c0392b;
}

.btn-remove-file:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Template Buttons */
.template-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-template {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-template:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-template:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages */
.error-message,
.success-message {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 15px;
}

.btn-send,
.btn-reset {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-send {
  background: #4CAF50;
  color: white;
}

.btn-send:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.btn-send:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.btn-reset {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #e0e0e0;
}

.btn-reset:hover:not(:disabled) {
  background: #e8e8e8;
}

.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Email History */
.email-history {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.email-history h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.history-icon {
  font-size: 1.5em;
}

.history-content {
  flex: 1;
}

.history-to {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.history-subject {
  color: #666;
  margin-bottom: 5px;
}

.history-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85em;
  color: #999;
}

.history-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.history-status.sent {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Responsive */
@media (max-width: 768px) {
  .email-view {
    padding: 20px 10px;
  }

  .page-header h1 {
    font-size: 2em;
  }

  .config-status {
    flex-direction: column;
    text-align: center;
  }

  .email-form-card {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .template-buttons {
    flex-direction: column;
  }

  .btn-template {
    width: 100%;
  }
}
</style>
