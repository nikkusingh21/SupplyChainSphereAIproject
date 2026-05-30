const { OPENAI_API_KEY } = require("../config/dotenv");
const logger = require("../utils/logger");

/**
 * Nexus AI Service
 * Wraps calls to OpenAI or any other AI provider.
 * Provides high-level helpers for supply chain intelligence tasks.
 */

/**
 * Generates a natural language supply chain insight using OpenAI.
 * @param {string} prompt - The prompt to send to the AI.
 * @returns {string} AI-generated text response.
 */
const generateInsight = async (prompt) => {
  if (!OPENAI_API_KEY) {
    logger.warn("OPENAI_API_KEY not set. Returning mock insight.");
    return "AI insight generation is not configured. Please set OPENAI_API_KEY in your .env file.";
  }

  try {
    // Dynamic import to avoid crashing if openai is not installed
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a supply chain optimization AI assistant for Nexus AI. Provide concise, actionable insights based on data provided by the user. Focus on demand, inventory, risk, and logistics.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.4,
    });

    return completion.choices[0]?.message?.content?.trim() || "No insight generated.";
  } catch (error) {
    logger.error(`AI Service Error: ${error.message}`);
    throw new Error("Failed to generate AI insight.");
  }
};

/**
 * Summarizes a list of risk events into an executive brief.
 * @param {Array} riskEvents - Array of risk event objects.
 * @returns {string} Summary string.
 */
const summarizeRisks = async (riskEvents) => {
  if (!riskEvents || riskEvents.length === 0) return "No active risks detected.";

  const prompt = `
    Summarize the following supply chain risk events for an executive. 
    Be brief, use bullet points, and prioritize critical items first.
    
    Risk Events:
    ${riskEvents.map((e) => `- [${e.severity?.toUpperCase()}] ${e.title}`).join("\n")}
  `;

  return await generateInsight(prompt);
};

/**
 * Generates reorder recommendations based on inventory data.
 * @param {Array} lowStockItems - Array of inventory items below reorder point.
 * @returns {string} Recommendations text.
 */
const generateReorderRecommendations = async (lowStockItems) => {
  if (!lowStockItems || lowStockItems.length === 0) return "All inventory levels are healthy.";

  const prompt = `
    Based on the following low-stock inventory items, suggest reorder quantities and prioritization.
    
    Low Stock Items:
    ${lowStockItems
      .map(
        (item) =>
          `- ${item.name} (SKU: ${item.sku}): ${item.quantity} units left, reorder point: ${item.reorderPoint}, lead time: ${item.supplier?.leadTimeDays} days`
      )
      .join("\n")}
      
    Provide concise recommendations.
  `;

  return await generateInsight(prompt);
};

module.exports = { generateInsight, summarizeRisks, generateReorderRecommendations };
