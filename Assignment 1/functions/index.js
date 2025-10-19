/**
 * Firebase Cloud Functions for Hiking Trails App
 * Functions
 * sendEmail: Send emails with attachments using SendGrid API
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// Fallback: Try to get from environment or config
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 
  (require("firebase-functions").config().sendgrid?.api_key);

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info("SendGrid initialized");
} else {
  logger.warn("SendGrid API key not configured");
}

// Send Email Cloud Function

exports.sendEmail = onCall(async (request) => {
  try {
    // Extract data from request
    const {to, from, subject, text, html, attachments} = request.data;

    logger.info("Sending email", {
      to,
      from,
      subject,
      hasAttachments: attachments && attachments.length > 0,
    });

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      throw new Error("Missing required fields: to, subject, and content");
    }

    // Validate SendGrid configuration
    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not configured");
    }

    // Prepare email message
    const msg = {
      to,
      from: from || "Chupter23@gmail.com", // Your verified sender email
      subject,
      text: text || "",
      html: html || text || "",
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map((att) => ({
        content: att.content, // Base64 string
        filename: att.filename,
        type: att.type,
        disposition: "attachment",
      }));
      logger.info(`Added ${attachments.length} attachments`);
    }

    // Send email via SendGrid
    const response = await sgMail.send(msg);

    logger.info("Email sent successfully", {
      statusCode: response[0].statusCode,
      messageId: response[0].headers["x-message-id"],
    });

    return {
      success: true,
      message: "Email sent successfully",
      statusCode: response[0].statusCode,
      messageId: response[0].headers["x-message-id"],
    };
  } catch (error) {
    logger.error("Error sending email", {
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });

    // Return user-friendly error message
    throw new Error(
        error.response?.body?.errors?.[0]?.message ||
        error.message ||
        "Failed to send email",
    );
  }
});

/**
 * Hello World example function (for testing)
 */
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello World function called", {structuredData: true});
  cors(request, response, () => {
    response.json({
      message: "Hello from Firebase Cloud Functions!",
      timestamp: new Date().toISOString(),
      functions: [
        "sendEmail - Send emails with attachments via SendGrid",
        "getTrails - Get all trails data (API)",
        "getBookings - Get all bookings data (API)",
      ],
    });
  });
});

/**
 * REST API: Get all trails
 * Public endpoint for third-party access
 * GET /api/trails
 */
exports.getTrails = onRequest({cors: true}, async (request, response) => {
  logger.info("API: Get trails called", {method: request.method});
  
  try {
    // Only allow GET requests
    if (request.method !== "GET") {
      response.status(405).json({
        error: "Method not allowed",
        message: "Only GET requests are supported",
      });
      return;
    }

    const db = admin.firestore();
    const trailsSnapshot = await db.collection("trails").get();
    
    const trails = [];
    trailsSnapshot.forEach((doc) => {
      trails.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    logger.info(`API: Returning ${trails.length} trails`);
    
    response.status(200).json({
      success: true,
      count: trails.length,
      data: trails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("API: Error fetching trails", {error: error.message});
    response.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * REST API: Get all bookings
 * Public endpoint for third-party access
 * GET /api/bookings
 */
exports.getBookings = onRequest({cors: true}, async (request, response) => {
  logger.info("API: Get bookings called", {method: request.method});
  
  try {
    // Only allow GET requests
    if (request.method !== "GET") {
      response.status(405).json({
        error: "Method not allowed",
        message: "Only GET requests are supported",
      });
      return;
    }

    const db = admin.firestore();
    const bookingsSnapshot = await db.collection("bookings").get();
    
    const bookings = [];
    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to ISO string if exists
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      });
    });

    logger.info(`API: Returning ${bookings.length} bookings`);
    
    response.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("API: Error fetching bookings", {error: error.message});
    response.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});
