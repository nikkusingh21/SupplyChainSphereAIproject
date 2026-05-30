const nodemailer = require("nodemailer");
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require("../config/dotenv");
const logger = require("../utils/logger");

// ──────────────────────────────────────────────
// Create reusable Nodemailer transporter
// ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for SSL, false for TLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Base function to send an email.
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });
  logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

// ──────────────────────────────────────────────
// Template: Welcome Email
// ──────────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: "Welcome to Nexus AI 🚀",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #0a0f1e; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #7c3aed;">Welcome, ${name}!</h1>
        <p style="color: #94a3b8; line-height: 1.7;">
          Your Nexus AI account is ready. Start optimizing your supply chain with AI-powered demand forecasting, 
          inventory tracking, and logistics analytics.
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard" 
           style="display: inline-block; margin-top: 20px; background: linear-gradient(to right, #3b82f6, #7c3aed); 
                  color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Go to Dashboard
        </a>
        <p style="margin-top: 40px; color: #475569; font-size: 12px;">Nexus AI • AI-Powered Supply Chain Optimization</p>
      </div>
    `,
  });
};

// ──────────────────────────────────────────────
// Template: Low Stock Alert Email
// ──────────────────────────────────────────────
const sendLowStockAlert = async (email, itemName, sku, quantity) => {
  await sendEmail({
    to: email,
    subject: `⚠️ Low Stock Alert: ${itemName} (${sku})`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #0a0f1e; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #f59e0b;">Low Stock Warning</h1>
        <p style="color: #94a3b8;">
          <strong style="color: #fff;">${itemName}</strong> (SKU: ${sku}) has fallen below its reorder point.
        </p>
        <p style="font-size: 40px; font-weight: bold; color: #f87171;">${quantity} units remaining</p>
        <p style="color: #94a3b8;">Please initiate a reorder to avoid stock-outs.</p>
        <a href="${process.env.CLIENT_URL}/dashboard/inventory"
           style="display: inline-block; margin-top: 20px; background: #f59e0b; 
                  color: #000; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Inventory
        </a>
      </div>
    `,
  });
};

// ──────────────────────────────────────────────
// Template: Forecast Ready Notification
// ──────────────────────────────────────────────
const sendForecastReadyEmail = async (email, productName, forecastId) => {
  await sendEmail({
    to: email,
    subject: `📊 Forecast Ready: ${productName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; background: #0a0f1e; color: #fff; padding: 40px; border-radius: 16px;">
        <h1 style="color: #3b82f6;">Your Forecast is Ready</h1>
        <p style="color: #94a3b8;">
          The AI demand forecast for <strong style="color: #fff;">${productName}</strong> has been generated successfully.
        </p>
        <a href="${process.env.CLIENT_URL}/dashboard/forecast/${forecastId}"
           style="display: inline-block; margin-top: 20px; background: linear-gradient(to right, #3b82f6, #7c3aed); 
                  color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Forecast
        </a>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendWelcomeEmail, sendLowStockAlert, sendForecastReadyEmail };
