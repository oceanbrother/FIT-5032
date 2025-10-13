/**
 * Firebase Cloud Functions for Hiking Trails App
 * Functions
 * sendEmail: Send emails with attachments using SendGrid API
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest, onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const sgMail = require("@sendgrid/mail");
const cors = require("cors")({origin: true});
const {defineSecret} = require("firebase-functions/params");

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// Define SendGrid API Key as a secret
// Set via: firebase functions:secrets:set SENDGRID_API_KEY
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");

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
      ],
    });
  });
});
