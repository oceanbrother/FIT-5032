/**
 * Email Service - SendGrid Integration via Firebase Cloud Functions
 * 
 * This service provides email functionality with attachment support.
 * Emails are sent through Firebase Cloud Functions for security.
 * Features:
 * - Send emails with HTML content
 * - Support for file attachments (images, PDFs, etc.)
 * - Convert files to Base64 for transmission
 * - Error handling and validation
 * 
 * Note: Uses Firebase Cloud Functions to keep API keys secure on the backend.
 */

import { getFunctions, httpsCallable } from 'firebase/functions'
import { functions } from '@/config/firebase'

const VERIFIED_SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'Chupter23@gmail.com'

/**
 * Convert a File object to Base64 string
 * Required for sending file attachments via SendGrid API
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64String = reader.result.split(',')[1]
      resolve(base64String)
    }
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error.message))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Validate email address format
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate file size (max 10MB for SendGrid)
 * 
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum file size in MB (default: 10)
 * @returns {boolean} True if file size is acceptable
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Get file extension from filename
 * 
 * @param {string} filename - The filename
 * @returns {string} File extension (e.g., 'pdf', 'jpg')
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase()
}

/**
 * Send an email with optional attachments using SendGrid
 * 
 * @param {Object} emailData - Email data object
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.text - Plain text content
 * @param {string} [emailData.html] - HTML content (optional)
 * @param {Array<File>} [emailData.attachments] - Array of File objects (optional)
 * @param {string} [emailData.from] - Sender email (optional, uses default if not provided)
 * @returns {Promise<Object>} Response object with success status
 * 
 * @example
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   text: 'This is a test email',
 *   html: '<strong>This is a test email</strong>',
 *   attachments: [fileObject]
 * })
 */
export const sendEmail = async (emailData) => {
  try {
    // Validate required fields
    if (!emailData.to) {
      throw new Error('Recipient email address is required')
    }

    if (!emailData.subject) {
      throw new Error('Email subject is required')
    }

    if (!emailData.text && !emailData.html) {
      throw new Error('Email content (text or html) is required')
    }

    // Validate email format
    if (!isValidEmail(emailData.to)) {
      throw new Error('Invalid recipient email address format')
    }

    // Prepare email data
    const emailPayload = {
      to: emailData.to,
      from: emailData.from || VERIFIED_SENDER_EMAIL,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html || emailData.text,
    }

    // Process attachments if provided
    if (emailData.attachments && emailData.attachments.length > 0) {
      const attachmentPromises = emailData.attachments.map(async (file) => {
        // Validate file size
        if (!isValidFileSize(file)) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`)
        }

        // Convert file to Base64
        const base64Content = await fileToBase64(file)

        return {
          content: base64Content,
          filename: file.name,
          type: file.type,
          disposition: 'attachment'
        }
      })

      emailPayload.attachments = await Promise.all(attachmentPromises)
    }

    // Call Firebase Cloud Function
    const sendEmailFunction = httpsCallable(functions, 'sendEmail')
    const result = await sendEmailFunction(emailPayload)

    console.log('Email sent successfully via Cloud Function:', result.data)

    return {
      success: true,
      message: result.data.message || 'Email sent successfully!',
      statusCode: result.data.statusCode,
      messageId: result.data.messageId
    }

  } catch (error) {
    console.error('Error sending email:', error)

    // Extract error message
    const errorMessage = error.message || 'Failed to send email'
    
    throw new Error(errorMessage)
  }
}

/**
 * Send a welcome email to a new user
 * Convenience function for common use case
 * 
 * @param {string} userEmail - User's email address
 * @param {string} userName - User's name
 * @returns {Promise<Object>} Response object
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Hiking Trails App!'
  const text = `Hi ${userName},\n\nWelcome to our Hiking Trails App! We're excited to have you on board.\n\nHappy hiking!\n\nBest regards,\nThe Hiking Trails Team`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Welcome to Hiking Trails App!</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Welcome to our Hiking Trails App! We're excited to have you on board.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Explore amazing hiking trails</li>
        <li>Track your hiking progress</li>
        <li>Share your experiences with others</li>
      </ul>
      <p>Happy hiking!</p>
      <p style="color: #666;">Best regards,<br>The Hiking Trails Team</p>
    </div>
  `

  return sendEmail({
    to: userEmail,
    subject,
    text,
    html
  })
}

// Send a trail recommendation email with trail image attachment
export const sendTrailRecommendation = async (userEmail, trailData, trailImage = null) => {
  const subject = `Check out this trail: ${trailData.name}`
  const text = `We found a great trail for you!\n\nTrail: ${trailData.name}\nDifficulty: ${trailData.difficulty}\nDistance: ${trailData.distance}\n\nDescription: ${trailData.description}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Trail Recommendation</h2>
      <p>We found a great trail for you!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">${trailData.name}</h3>
        <p><strong>Difficulty:</strong> ${trailData.difficulty}</p>
        <p><strong>Distance:</strong> ${trailData.distance}</p>
        <p><strong>Description:</strong> ${trailData.description}</p>
      </div>
      <p>Happy hiking!</p>
    </div>
  `

  const attachments = trailImage ? [trailImage] : []

  return sendEmail({
    to: userEmail,
    subject,
    text,
    html,
    attachments
  })
}

/**
 * Check if email service is properly configured
 * using Firebase Cloud Functions, so only checks sender email
 */
export const checkConfiguration = () => {
  const hasSenderEmail = VERIFIED_SENDER_EMAIL && VERIFIED_SENDER_EMAIL !== 'your-verified-email@example.com'
  const hasFunctions = functions !== null
  return {
    configured: hasSenderEmail && hasFunctions,
    hasApiKey: true, // API key is now in Cloud Function (backend)
    hasSenderEmail,
    hasFunctions,
    message: !hasFunctions
      ? 'Firebase Functions not initialized'
      : !hasSenderEmail 
        ? 'Sender email is not configured'
        : 'Email service is properly configured (via Cloud Functions)'
  }
}

// Export all functions
export default {
  sendEmail,
  sendWelcomeEmail,
  sendTrailRecommendation,
  fileToBase64,
  isValidEmail,
  isValidFileSize,
  getFileExtension,
  checkConfiguration
}
