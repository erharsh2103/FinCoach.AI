import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import env from "../config/env.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_HISTORY = 12;

const inr = value => {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "₹0";
  return `₹${Math.round(number).toLocaleString("en-IN")}`;
};

const buildSystemPrompt = (context = {}) => {
  const {
    name,
    monthLabel,
    monthlyIncome,
    monthlyExpenses,
    budgetUsed,
    remaining,
    totalBalance,
    bankBalance,
    cashBalance,
    savingsRate,
    essentials,
    nonEssentials,
    topCategories,
    riskProfile,
    goals = [],
    unpaidBills = [],
    transactionsCount = 0,
    accountsCount = 0
  } = context;

  const goalLines = goals.length
    ? goals.map(g => `- ${g.name}: ${inr(g.current)} of ${inr(g.target)} (${g.pct ?? 0}%)`).join("\n")
    : "- No savings goals yet";

  const billLines = unpaidBills.length
    ? unpaidBills.map(b => `- ${b.name}: ${inr(b.amount)} due ${b.due}`).join("\n")
    : "- No unpaid bills";

  return [
    "You are FinCoach, a warm, practical personal-finance coach for Indian users.",
    "All amounts are in Indian Rupees (₹). Be concise (2-5 sentences unless asked for detail), encouraging, and specific.",
    "Always ground your answer in the user's live data below — never give generic advice when real numbers are available.",
    "If data is missing, tell the user exactly what to add (income in Profile, accounts, transactions, goals).",
    "Never promise guaranteed returns. Add a one-line caution when discussing investments or tax.",
    "",
    `ACTIVE MONTH: ${monthLabel || "current month"}`,
    "USER FINANCIAL SNAPSHOT:",
    `Name: ${name || "User"}`,
    `Monthly income: ${inr(monthlyIncome)}`,
    `Monthly expenses: ${inr(monthlyExpenses)}`,
    `  - Essentials (rent/food/transport/bills): ${inr(essentials)}`,
    `  - Non-essentials: ${inr(nonEssentials)}`,
    `  - Top spend categories: ${topCategories || "none logged"}`,
    `Budget used: ${budgetUsed ?? 0}%`,
    `Budget remaining: ${inr(remaining)}`,
    `Savings rate: ${savingsRate ?? 0}%`,
    `Total balance: ${inr(totalBalance)} (bank: ${inr(bankBalance)}, cash: ${inr(cashBalance)})`,
    `Risk profile: ${riskProfile || "Balanced"}`,
    `Accounts: ${accountsCount}  |  Transactions logged: ${transactionsCount}`,
    "Savings goals:",
    goalLines,
    "Unpaid bills:",
    billLines
  ].join("\n");
};

const sanitizeHistory = (history = []) =>
  (Array.isArray(history) ? history : [])
    .filter(item => item && typeof item.content === "string" && item.content.trim())
    .slice(-MAX_HISTORY)
    .map(item => ({
      role: item.role === "user" ? "user" : "assistant",
      content: item.content.trim()
    }));

export const coachChat = asyncHandler(async (req, res) => {
  const { message, history = [], context = {} } = req.body || {};

  if (!message || !String(message).trim()) {
    throw new HttpError(400, "A message is required.");
  }

  // If no key is configured, tell the client to use its local fallback coach.
  if (!env.anthropicApiKey) {
    return res.status(200).json({ reply: null, configured: false });
  }

  const priorTurns = sanitizeHistory(history);
  // Anthropic requires the conversation to start with a user turn.
  while (priorTurns.length && priorTurns[0].role !== "user") {
    priorTurns.shift();
  }
  const messages = [...priorTurns, { role: "user", content: String(message).trim() }];

  let response;
  try {
    response = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: 700,
        system: buildSystemPrompt(context),
        messages
      })
    });
  } catch (error) {
    throw new HttpError(502, "Could not reach the AI service. Please try again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.error?.message || "The AI service returned an error.";
    throw new HttpError(response.status === 401 ? 500 : 502, detail);
  }

  const reply = Array.isArray(data.content)
    ? data.content
        .filter(block => block.type === "text")
        .map(block => block.text)
        .join("\n")
        .trim()
    : "";

  return res.status(200).json({ reply: reply || "I could not generate a response. Please try again.", configured: true });
});
