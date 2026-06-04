import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeWorkspace, totalBalance } from "../services/workspace.service.js";
import { HttpError } from "../utils/httpError.js";

function normalizeAccount(payload, id) {
  const name = String(payload.name || "").trim();
  const type = payload.type === "cash" ? "cash" : "bank";
  const subtype =
    type === "bank" && payload.subtype === "current"
      ? "current"
      : type === "bank"
        ? "savings"
        : "";
  const balance = Number(payload.balance);
  const bankName = type === "bank" ? String(payload.bankName || "").trim() : "";
  const ifsc = type === "bank" ? String(payload.ifsc || "").trim().toUpperCase() : "";

  if (!name) throw new HttpError(400, "Account name is required.");
  if (!Number.isFinite(balance) || balance < 0) {
    throw new HttpError(400, "Balance must be a valid non-negative number.");
  }
  if (type === "bank" && !bankName) {
    throw new HttpError(400, "Bank name is required for bank accounts.");
  }

  return { id, name, type, subtype, balance, bankName, ifsc };
}

function normalizeProfile(payload) {
  const ageValue =
    payload.age === "" || payload.age === null || payload.age === undefined
      ? null
      : Number(payload.age);
  const profile = {
    name: String(payload.name || "").trim(),
    phone: String(payload.phone || "").replace(/\D/g, "").slice(0, 10),
    age: ageValue,
    email: String(payload.email || "").trim(),
    city: String(payload.city || "").trim(),
    incomeType: String(payload.incomeType || "").trim(),
    monthlyIncome: Number(payload.monthlyIncome || 0),
    riskProfile: String(payload.riskProfile || "").trim(),
    occupation: String(payload.occupation || "").trim(),
    permissions: {
      sms: Boolean(payload.permissions?.sms),
      bank: Boolean(payload.permissions?.bank),
      notifs: Boolean(payload.permissions?.notifs)
    }
  };

  if (!profile.name) throw new HttpError(400, "Name is required.");
  if (!/^\d{10}$/.test(profile.phone)) {
    throw new HttpError(400, "Phone number must be exactly 10 digits.");
  }
  if (profile.age !== null && (!Number.isInteger(profile.age) || profile.age < 13 || profile.age > 100)) {
    throw new HttpError(400, "Age must be a valid number between 13 and 100.");
  }
  if (
    profile.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
  ) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  if (!profile.city) throw new HttpError(400, "City is required.");
  if (!profile.incomeType) throw new HttpError(400, "Income type is required.");
  if (!Number.isFinite(profile.monthlyIncome) || profile.monthlyIncome < 0) {
    throw new HttpError(400, "Monthly income must be a valid non-negative number.");
  }
  if (!profile.occupation) throw new HttpError(400, "Occupation is required.");
  if (!profile.riskProfile) throw new HttpError(400, "Risk profile is required.");

  return profile;
}

function normalizeTransaction(payload, id) {
  const amount = Number(payload.amount);
  const requestedType =
    payload.type === "income" || payload.type === "transfer" ? payload.type : "expense";
  const transaction = {
    id,
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    type: requestedType,
    accountId: String(payload.accountId || ""),
    fromId: String(payload.fromId || ""),
    toId: String(payload.toId || ""),
    amount,
    category: String(
      payload.category || (requestedType === "income" ? "Income" : "Others")
    ).trim(),
    description: String(payload.description || "").trim()
  };

  if (!transaction.description) {
    throw new HttpError(400, "Transaction description is required.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Transaction amount must be greater than zero.");
  }

  return transaction;
}

function normalizeGoal(payload, id) {
  const target = Number(payload.target);
  const current = Number(payload.current || 0);
  const goal = {
    id,
    name: String(payload.name || "").trim(),
    current,
    target,
    deadline: String(payload.deadline || ""),
    icon: String(payload.icon || "Goal")
  };

  if (!goal.name) throw new HttpError(400, "Goal name is required.");
  if (!Number.isFinite(target) || target <= 0) {
    throw new HttpError(400, "Goal target must be greater than zero.");
  }
  if (!Number.isFinite(current) || current < 0) {
    throw new HttpError(400, "Goal current amount must be non-negative.");
  }

  return goal;
}

function normalizeBill(payload, id) {
  const amount = Number(payload.amount);
  const bill = {
    id,
    name: String(payload.name || "").trim(),
    due: String(payload.due || ""),
    amount,
    status: ["paid", "overdue", "upcoming"].includes(payload.status)
      ? payload.status
      : "upcoming"
  };

  if (!bill.name) throw new HttpError(400, "Bill name is required.");
  if (!bill.due) throw new HttpError(400, "Bill due date is required.");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Bill amount must be greater than zero.");
  }

  return bill;
}

function normalizeCashPayment(payload, id) {
  const amount = Number(payload.amount);
  const payment = {
    id,
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    name: String(payload.name || "").trim(),
    category: String(payload.category || "Others").trim(),
    amount
  };

  if (!payment.name) throw new HttpError(400, "Cash payment name is required.");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Cash payment amount must be greater than zero.");
  }

  return payment;
}

export const getHealth = asyncHandler(async (_req, res) => {
  res.status(200).json({ ok: true });
});

export const getFinance = asyncHandler(async (req, res) => {
  res.status(200).json(serializeWorkspace(req.workspace));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const profile = normalizeProfile(req.body);

  workspace.profile = profile;
  workspace.phone = profile.phone;
  if (Object.prototype.hasOwnProperty.call(req.body, "onboardingCompleted")) {
    workspace.onboardingCompleted = Boolean(req.body.onboardingCompleted);
  }
  await workspace.save();

  res.status(200).json({
    profile: workspace.profile,
    onboardingCompleted: Boolean(workspace.onboardingCompleted)
  });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const { plan } = req.body;

  if (!["free", "pro", "elite"].includes(plan)) {
    throw new HttpError(400, "Invalid plan.");
  }

  workspace.plan = plan;
  await workspace.save();

  res.status(200).json({ plan: workspace.plan });
});

export const createTransaction = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const transaction = normalizeTransaction(req.body, `txn-${Date.now()}`);
  const account = workspace.accounts.find(item => item.id === transaction.accountId);

  if (transaction.accountId && !account) {
    throw new HttpError(400, "Selected account not found.");
  }

  if (account) {
    account.balance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    if (account.balance < 0) {
      throw new HttpError(400, "Insufficient funds in selected account.");
    }
  }

  workspace.transactions.unshift(transaction);
  await workspace.save();

  res.status(201).json({
    transaction,
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    totalBalance: totalBalance(workspace.accounts)
  });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const transaction = workspace.transactions.find(item => item.id === req.params.id);

  if (!transaction) {
    throw new HttpError(404, "Transaction not found.");
  }

  if (transaction.type === "transfer") {
    const from = workspace.accounts.find(account => account.id === transaction.fromId);
    const to = workspace.accounts.find(account => account.id === transaction.toId);
    if (from) from.balance += Number(transaction.amount || 0);
    if (to) to.balance -= Number(transaction.amount || 0);
  } else {
    const account = workspace.accounts.find(item => item.id === transaction.accountId);
    if (account) {
      account.balance -= transaction.type === "income" ? Number(transaction.amount || 0) : -Number(transaction.amount || 0);
    }
  }

  workspace.transactions = workspace.transactions.filter(item => item.id !== req.params.id);
  await workspace.save();

  res.status(200).json({
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    totalBalance: totalBalance(workspace.accounts)
  });
});

export const createGoal = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const goal = normalizeGoal(req.body, `goal-${Date.now()}`);
  workspace.goals.push(goal);
  await workspace.save();

  res.status(201).json({ goal, goals: workspace.goals });
});

export const fundGoal = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const fundAmount = Number(req.body.amount);

  if (!Number.isFinite(fundAmount) || fundAmount <= 0) {
    throw new HttpError(400, "Funding amount must be greater than zero.");
  }

  workspace.goals = workspace.goals.map(goal =>
    goal.id === req.params.id
      ? {
          ...goal.toObject(),
          current: Math.min(goal.target, Number(goal.current || 0) + fundAmount)
        }
      : goal
  );
  await workspace.save();

  res.status(200).json({ goals: workspace.goals });
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  workspace.goals = workspace.goals.filter(item => item.id !== req.params.id);
  await workspace.save();

  res.status(200).json({ goals: workspace.goals });
});

export const createBill = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const bill = normalizeBill(req.body, `bill-${Date.now()}`);
  workspace.bills.push(bill);
  await workspace.save();

  res.status(201).json({ bill, bills: workspace.bills });
});

export const payBill = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  workspace.bills = workspace.bills.map(bill =>
    bill.id === req.params.id ? { ...bill.toObject(), status: "paid" } : bill
  );
  await workspace.save();

  res.status(200).json({ bills: workspace.bills });
});

export const deleteBill = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  workspace.bills = workspace.bills.filter(item => item.id !== req.params.id);
  await workspace.save();

  res.status(200).json({ bills: workspace.bills });
});

export const createCashPayment = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const payment = normalizeCashPayment(req.body, `cash-${Date.now()}`);
  const cashAccount = workspace.accounts.find(account => account.type === "cash");

  if (cashAccount) {
    if (cashAccount.balance < payment.amount) {
      throw new HttpError(400, "Insufficient cash wallet balance.");
    }
    cashAccount.balance -= payment.amount;
  }

  workspace.cashPayments.unshift(payment);
  workspace.transactions.unshift({
    id: `txn-${Date.now()}`,
    date: payment.date,
    type: "expense",
    accountId: cashAccount?.id || "",
    amount: payment.amount,
    category: payment.category,
    description: payment.name
  });
  await workspace.save();

  res.status(201).json({
    payment,
    cashPayments: workspace.cashPayments,
    accounts: workspace.accounts,
    transactions: workspace.transactions
  });
});

export const createAccount = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const account = normalizeAccount(req.body, `acct-${Date.now()}`);
  workspace.accounts.push(account);
  await workspace.save();

  res.status(201).json({
    account,
    totalBalance: totalBalance(workspace.accounts)
  });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const index = workspace.accounts.findIndex(account => account.id === req.params.id);

  if (index === -1) {
    throw new HttpError(404, "Account not found.");
  }

  workspace.accounts[index] = normalizeAccount(req.body, req.params.id);
  await workspace.save();

  res.status(200).json({
    account: workspace.accounts[index],
    totalBalance: totalBalance(workspace.accounts)
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const exists = workspace.accounts.some(account => account.id === req.params.id);

  if (!exists) {
    throw new HttpError(404, "Account not found.");
  }

  workspace.accounts = workspace.accounts.filter(account => account.id !== req.params.id);
  workspace.transactions = workspace.transactions.map(transaction => ({
    ...transaction.toObject(),
    accountId: transaction.accountId === req.params.id ? "deleted" : transaction.accountId,
    fromId: transaction.fromId === req.params.id ? "deleted" : transaction.fromId,
    toId: transaction.toId === req.params.id ? "deleted" : transaction.toId
  }));
  await workspace.save();

  res.status(200).json({
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    totalBalance: totalBalance(workspace.accounts)
  });
});

export const createTransfer = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  const amount = Number(req.body.amount);
  const from = workspace.accounts.find(account => account.id === req.body.fromId);
  const to = workspace.accounts.find(account => account.id === req.body.toId);

  if (!from || !to || from.id === to.id) {
    throw new HttpError(400, "Pick two different valid accounts.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Enter a valid transfer amount.");
  }
  if (from.balance < amount) {
    throw new HttpError(400, "Insufficient funds in the source account.");
  }

  from.balance -= amount;
  to.balance += amount;

  const transaction = {
    id: `txn-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    type: "transfer",
    fromId: from.id,
    toId: to.id,
    amount,
    description: `Transfer from ${from.name} to ${to.name}`
  };

  workspace.transactions.unshift(transaction);
  await workspace.save();

  res.status(201).json({
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    transaction,
    totalBalance: totalBalance(workspace.accounts)
  });
});
