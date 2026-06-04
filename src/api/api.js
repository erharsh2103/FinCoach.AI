// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_ORIGIN_LABEL = API_BASE_URL || "the local /api proxy";

const buildNetworkError = () =>
  new Error(`Could not reach ${API_ORIGIN_LABEL}. Start the backend with npm run dev:all or npm --prefix backend run dev.`);

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("fincoach_token");
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-session-token": token } : {}),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    const networkError = buildNetworkError();
    networkError.cause = error;
    throw networkError;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
};

// Auth endpoints
export const authApi = {
  sendOtp: (phone) =>
    apiRequest("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone })
    }),

  verifyOtp: (phone, otp) =>
    apiRequest("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp })
    }),

  validatePhone: (phone) =>
    apiRequest("/api/auth/validate-phone", {
      method: "POST",
      body: JSON.stringify({ phone })
    }),

  createPhoneSession: (phone) =>
    apiRequest("/api/auth/phone-session", {
      method: "POST",
      body: JSON.stringify({ phone })
    }),

  devLogin: (phone) =>
    apiRequest("/api/auth/dev-login", {
      method: "POST",
      body: JSON.stringify({ phone })
    })
};

// Finance endpoints
export const financeApi = {
  getHealth: () => apiRequest("/api/health"),

  getFinance: () => apiRequest("/api/finance"),

  updateProfile: (profile) =>
    apiRequest("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    }),

  updatePlan: (plan) =>
    apiRequest("/api/plan", {
      method: "PUT",
      body: JSON.stringify({ plan })
    }),

  createTransaction: (transaction) =>
    apiRequest("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction)
    }),

  deleteTransaction: (id) =>
    apiRequest(`/api/transactions/${id}`, {
      method: "DELETE"
    }),

  createGoal: (goal) =>
    apiRequest("/api/goals", {
      method: "POST",
      body: JSON.stringify(goal)
    }),

  fundGoal: (id, amount) =>
    apiRequest(`/api/goals/${id}/fund`, {
      method: "PUT",
      body: JSON.stringify({ amount })
    }),

  deleteGoal: (id) =>
    apiRequest(`/api/goals/${id}`, {
      method: "DELETE"
    }),

  createBill: (bill) =>
    apiRequest("/api/bills", {
      method: "POST",
      body: JSON.stringify(bill)
    }),

  payBill: (id) =>
    apiRequest(`/api/bills/${id}/pay`, {
      method: "PUT"
    }),

  deleteBill: (id) =>
    apiRequest(`/api/bills/${id}`, {
      method: "DELETE"
    }),

  createCashPayment: (payment) =>
    apiRequest("/api/cash-payments", {
      method: "POST",
      body: JSON.stringify(payment)
    }),

  createAccount: (account) =>
    apiRequest("/api/accounts", {
      method: "POST",
      body: JSON.stringify(account)
    }),

  updateAccount: (id, account) =>
    apiRequest(`/api/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(account)
    }),

  deleteAccount: (id) =>
    apiRequest(`/api/accounts/${id}`, {
      method: "DELETE"
    }),

  createTransfer: (transfer) =>
    apiRequest("/api/transfers", {
      method: "POST",
      body: JSON.stringify(transfer)
    })
};

// Payment endpoints
export const paymentApi = {
  getPaymentHistory: () => apiRequest("/api/payments/history"),

  createPaymentOrder: (plan) =>
    apiRequest("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ plan })
    }),

  verifyPayment: (paymentData) =>
    apiRequest("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(paymentData)
    })
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("fincoach_token", token);
  } else {
    localStorage.removeItem("fincoach_token");
  }
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem("fincoach_token");
};

// Helper function to check if authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

