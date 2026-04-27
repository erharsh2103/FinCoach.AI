import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    age: { type: Number, default: null },
    email: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    incomeType: { type: String, trim: true, default: "" },
    monthlyIncome: { type: Number, default: 0 },
    riskProfile: { type: String, trim: true, default: "" },
    occupation: { type: String, trim: true, default: "" },
    permissions: {
      sms: { type: Boolean, default: false },
      bank: { type: Boolean, default: false },
      notifs: { type: Boolean, default: false }
    }
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, default: null },
    createdAt: { type: Date, default: null }
  },
  { _id: false }
);

const accountSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["bank", "cash"], required: true },
    subtype: { type: String, default: "" },
    balance: { type: Number, required: true },
    bankName: { type: String, default: "" },
    ifsc: { type: String, default: "" }
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
    accountId: { type: String, default: "" },
    fromId: { type: String, default: "" },
    toId: { type: String, default: "" },
    amount: { type: Number, required: true },
    category: { type: String, default: "" },
    description: { type: String, required: true }
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    current: { type: Number, default: 0 },
    target: { type: Number, required: true },
    deadline: { type: String, default: "" },
    icon: { type: String, default: "Goal" }
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    due: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "overdue", "upcoming"], default: "upcoming" }
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    amount: { type: Number, required: true },
    cycle: { type: String, default: "Monthly" },
    status: { type: String, default: "active" }
  },
  { _id: false }
);

const cashPaymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "Others" },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    plan: { type: String, enum: ["free", "pro", "elite"], default: "free" },
    onboardingCompleted: { type: Boolean, default: false },
    profile: { type: profileSchema, required: true },
    session: { type: sessionSchema, default: () => ({ token: null, createdAt: null }) },
    accounts: { type: [accountSchema], default: [] },
    transactions: { type: [transactionSchema], default: [] },
    goals: { type: [goalSchema], default: [] },
    bills: { type: [billSchema], default: [] },
    subscriptions: { type: [subscriptionSchema], default: [] },
    cashPayments: { type: [cashPaymentSchema], default: [] }
  },
  {
    timestamps: true
  }
);

export const Workspace = mongoose.model("Workspace", workspaceSchema);
