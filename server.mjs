import http from "node:http";
import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "data", "fincoach-db.json");
const port = Number(process.env.PORT || 4000);
const otpStore = new Map();

const seedData = {
  session: null,
  plan: "free",
  profile: {
    name: "",
    phone: "",
    email: "",
    city: "",
    incomeType: "",
    monthlyIncome: 0,
    riskProfile: "",
    age: null,
    occupation: "",
    permissions: {
      sms: false,
      bank: false,
      notifs: false
    }
  },
  accounts: [],
  transactions: [],
  goals: [],
  bills: [],
  subscriptions: [],
  cashPayments: []
};

async function readDb() {
  try {
    const existing = JSON.parse(await readFile(dbPath, "utf8"));
    return { ...structuredClone(seedData), ...existing };
  } catch {
    await writeDb(seedData);
    return structuredClone(seedData);
  }
}

async function writeDb(data) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, JSON.stringify(data, null, 2));
}

function send(res, status, body) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeAccount(payload, id) {
  const name = String(payload.name || "").trim();
  const type = payload.type === "cash" ? "cash" : "bank";
  const subtype = type === "bank" && payload.subtype === "current" ? "current" : type === "bank" ? "savings" : "";
  const balance = Number(payload.balance);
  const bankName = type === "bank" ? String(payload.bankName || "").trim() : "";
  const ifsc = type === "bank" ? String(payload.ifsc || "").trim().toUpperCase() : "";

  if (!name) throw new Error("Account name is required.");
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Balance must be a valid non-negative number.");
  if (type === "bank" && !bankName) throw new Error("Bank name is required for bank accounts.");

  return { id, name, type, subtype, balance, bankName, ifsc };
}

function normalizeProfile(payload) {
  const profile = {
    name: String(payload.name || "").trim(),
    phone: String(payload.phone || "").replace(/\D/g, "").slice(0, 10),
    email: String(payload.email || "").trim(),
    city: String(payload.city || "").trim(),
    incomeType: String(payload.incomeType || "").trim(),
    monthlyIncome: Number(payload.monthlyIncome || 0),
    riskProfile: String(payload.riskProfile || "Balanced").trim()
  };

  if (!profile.name) throw new Error("Name is required.");
  if (!/^\d{10}$/.test(profile.phone)) throw new Error("Phone number must be exactly 10 digits.");
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error("Enter a valid email address.");
  if (!Number.isFinite(profile.monthlyIncome) || profile.monthlyIncome < 0) throw new Error("Monthly income must be a valid non-negative number.");

  return profile;
}

function totalBalance(accounts) {
  return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(0, 10);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function normalizeTransaction(payload, id) {
  const amount = Number(payload.amount);
  const type = payload.type === "income" ? "income" : "expense";
  const transaction = {
    id,
    date: String(payload.date || new Date().toISOString().slice(0, 10)),
    type,
    accountId: String(payload.accountId || ""),
    amount,
    category: String(payload.category || (type === "income" ? "Income" : "Others")).trim(),
    description: String(payload.description || "").trim()
  };
  if (!transaction.description) throw new Error("Transaction description is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Transaction amount must be greater than zero.");
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
  if (!goal.name) throw new Error("Goal name is required.");
  if (!Number.isFinite(target) || target <= 0) throw new Error("Goal target must be greater than zero.");
  if (!Number.isFinite(current) || current < 0) throw new Error("Goal current amount must be non-negative.");
  return goal;
}

function normalizeBill(payload, id) {
  const amount = Number(payload.amount);
  const bill = {
    id,
    name: String(payload.name || "").trim(),
    due: String(payload.due || ""),
    amount,
    status: ["paid", "overdue", "upcoming"].includes(payload.status) ? payload.status : "upcoming"
  };
  if (!bill.name) throw new Error("Bill name is required.");
  if (!bill.due) throw new Error("Bill due date is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Bill amount must be greater than zero.");
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
  if (!payment.name) throw new Error("Cash payment name is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Cash payment amount must be greater than zero.");
  return payment;
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/api/health") {
      return send(res, 200, { ok: true });
    }

    if (req.method === "GET" && path === "/api/finance") {
      const db = await readDb();
      return send(res, 200, { profile: seedData.profile, ...db, totalBalance: totalBalance(db.accounts) });
    }

    if (req.method === "POST" && path === "/api/auth/send-otp") {
      const { phone } = await readBody(req);
      const normalizedPhone = normalizePhone(phone);
      if (!/^\d{10}$/.test(normalizedPhone)) throw new Error("Phone number must be exactly 10 digits.");

      const existing = otpStore.get(normalizedPhone);
      if (existing && Date.now() - existing.createdAt < 30000) {
        throw new Error("Please wait before requesting another OTP.");
      }

      const otp = generateOtp();
      otpStore.set(normalizedPhone, {
        otp,
        attempts: 0,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000
      });
      console.log(`OTP for ${normalizedPhone}: ${otp}`);

      return send(res, 200, {
        sent: true,
        phone: normalizedPhone,
        expiresInSeconds: 300,
        devOtp: process.env.SMS_PROVIDER ? undefined : otp
      });
    }

    if (req.method === "POST" && path === "/api/auth/verify-otp") {
      const { phone, otp } = await readBody(req);
      const normalizedPhone = normalizePhone(phone);
      const entry = otpStore.get(normalizedPhone);
      if (!entry) throw new Error("OTP not found. Please request a new OTP.");
      if (Date.now() > entry.expiresAt) {
        otpStore.delete(normalizedPhone);
        throw new Error("OTP expired. Please request a new OTP.");
      }
      if (entry.attempts >= 5) {
        otpStore.delete(normalizedPhone);
        throw new Error("Too many incorrect attempts. Please request a new OTP.");
      }
      if (String(otp || "") !== entry.otp) {
        entry.attempts += 1;
        throw new Error("Incorrect OTP. Please try again.");
      }

      otpStore.delete(normalizedPhone);
      const db = await readDb();
      db.profile = { ...(db.profile || seedData.profile), phone: normalizedPhone };
      db.session = {
        token: crypto.randomUUID(),
        phone: normalizedPhone,
        createdAt: new Date().toISOString()
      };
      await writeDb(db);
      return send(res, 200, { verified: true, token: db.session.token, profile: db.profile });
    }

    if (req.method === "PUT" && path === "/api/profile") {
      const db = await readDb();
      db.profile = normalizeProfile(await readBody(req));
      await writeDb(db);
      return send(res, 200, { profile: db.profile });
    }

    if (req.method === "PUT" && path === "/api/plan") {
      const db = await readDb();
      const { plan } = await readBody(req);
      if (!["free", "pro", "elite"].includes(plan)) throw new Error("Invalid plan.");
      db.plan = plan;
      await writeDb(db);
      return send(res, 200, { plan: db.plan });
    }

    if (req.method === "POST" && path === "/api/transactions") {
      const db = await readDb();
      const transaction = normalizeTransaction(await readBody(req), `txn-${Date.now()}`);
      const account = db.accounts.find(item => item.id === transaction.accountId);
      if (transaction.accountId && !account) throw new Error("Selected account not found.");
      if (account) {
        account.balance += transaction.type === "income" ? transaction.amount : -transaction.amount;
        if (account.balance < 0) throw new Error("Insufficient funds in selected account.");
      }
      db.transactions.unshift(transaction);
      await writeDb(db);
      return send(res, 201, { transaction, accounts: db.accounts, transactions: db.transactions, totalBalance: totalBalance(db.accounts) });
    }

    const transactionMatch = path.match(/^\/api\/transactions\/([^/]+)$/);
    if (transactionMatch && req.method === "DELETE") {
      const db = await readDb();
      const id = decodeURIComponent(transactionMatch[1]);
      const transaction = db.transactions.find(item => item.id === id);
      if (!transaction) return send(res, 404, { error: "Transaction not found." });
      if (transaction.type === "transfer") {
        const from = db.accounts.find(account => account.id === transaction.fromId);
        const to = db.accounts.find(account => account.id === transaction.toId);
        if (from) from.balance += Number(transaction.amount || 0);
        if (to) to.balance -= Number(transaction.amount || 0);
      } else {
        const account = db.accounts.find(item => item.id === transaction.accountId);
        if (account) {
          account.balance -= transaction.type === "income" ? Number(transaction.amount || 0) : -Number(transaction.amount || 0);
        }
      }
      db.transactions = db.transactions.filter(item => item.id !== id);
      await writeDb(db);
      return send(res, 200, { accounts: db.accounts, transactions: db.transactions, totalBalance: totalBalance(db.accounts) });
    }

    if (req.method === "POST" && path === "/api/goals") {
      const db = await readDb();
      const goal = normalizeGoal(await readBody(req), `goal-${Date.now()}`);
      db.goals.push(goal);
      await writeDb(db);
      return send(res, 201, { goal, goals: db.goals });
    }

    const goalMatch = path.match(/^\/api\/goals\/([^/]+)(?:\/fund)?$/);
    if (goalMatch && req.method === "PUT" && path.endsWith("/fund")) {
      const db = await readDb();
      const id = decodeURIComponent(goalMatch[1]);
      const { amount } = await readBody(req);
      const fundAmount = Number(amount);
      if (!Number.isFinite(fundAmount) || fundAmount <= 0) throw new Error("Funding amount must be greater than zero.");
      db.goals = db.goals.map(goal => goal.id === id ? { ...goal, current: Math.min(goal.target, Number(goal.current || 0) + fundAmount) } : goal);
      await writeDb(db);
      return send(res, 200, { goals: db.goals });
    }

    if (goalMatch && req.method === "DELETE" && !path.endsWith("/fund")) {
      const db = await readDb();
      const id = decodeURIComponent(goalMatch[1]);
      db.goals = db.goals.filter(item => item.id !== id);
      await writeDb(db);
      return send(res, 200, { goals: db.goals });
    }

    if (req.method === "POST" && path === "/api/bills") {
      const db = await readDb();
      const bill = normalizeBill(await readBody(req), `bill-${Date.now()}`);
      db.bills.push(bill);
      await writeDb(db);
      return send(res, 201, { bill, bills: db.bills });
    }

    const billMatch = path.match(/^\/api\/bills\/([^/]+)(?:\/pay)?$/);
    if (billMatch && req.method === "PUT" && path.endsWith("/pay")) {
      const db = await readDb();
      const id = decodeURIComponent(billMatch[1]);
      db.bills = db.bills.map(bill => bill.id === id ? { ...bill, status: "paid" } : bill);
      await writeDb(db);
      return send(res, 200, { bills: db.bills });
    }

    if (billMatch && req.method === "DELETE" && !path.endsWith("/pay")) {
      const db = await readDb();
      const id = decodeURIComponent(billMatch[1]);
      db.bills = db.bills.filter(item => item.id !== id);
      await writeDb(db);
      return send(res, 200, { bills: db.bills });
    }

    if (req.method === "POST" && path === "/api/cash-payments") {
      const db = await readDb();
      const payment = normalizeCashPayment(await readBody(req), `cash-${Date.now()}`);
      db.cashPayments.unshift(payment);
      const cashAccount = db.accounts.find(account => account.type === "cash");
      if (cashAccount) {
        if (cashAccount.balance < payment.amount) throw new Error("Insufficient cash wallet balance.");
        cashAccount.balance -= payment.amount;
      }
      db.transactions.unshift({
        id: `txn-${Date.now()}`,
        date: payment.date,
        type: "expense",
        accountId: cashAccount?.id || "",
        amount: payment.amount,
        category: payment.category,
        description: payment.name
      });
      await writeDb(db);
      return send(res, 201, { payment, cashPayments: db.cashPayments, accounts: db.accounts, transactions: db.transactions });
    }

    if (req.method === "POST" && path === "/api/accounts") {
      const db = await readDb();
      const account = normalizeAccount(await readBody(req), `acct-${Date.now()}`);
      db.accounts.push(account);
      await writeDb(db);
      return send(res, 201, { account, totalBalance: totalBalance(db.accounts) });
    }

    const accountMatch = path.match(/^\/api\/accounts\/([^/]+)$/);
    if (accountMatch && req.method === "PUT") {
      const db = await readDb();
      const id = decodeURIComponent(accountMatch[1]);
      const index = db.accounts.findIndex(account => account.id === id);
      if (index === -1) return send(res, 404, { error: "Account not found." });
      db.accounts[index] = normalizeAccount(await readBody(req), id);
      await writeDb(db);
      return send(res, 200, { account: db.accounts[index], totalBalance: totalBalance(db.accounts) });
    }

    if (accountMatch && req.method === "DELETE") {
      const db = await readDb();
      const id = decodeURIComponent(accountMatch[1]);
      if (!db.accounts.some(account => account.id === id)) return send(res, 404, { error: "Account not found." });
      db.accounts = db.accounts.filter(account => account.id !== id);
      db.transactions = db.transactions.map(transaction => ({
        ...transaction,
        accountId: transaction.accountId === id ? "deleted" : transaction.accountId,
        fromId: transaction.fromId === id ? "deleted" : transaction.fromId,
        toId: transaction.toId === id ? "deleted" : transaction.toId
      }));
      await writeDb(db);
      return send(res, 200, { accounts: db.accounts, transactions: db.transactions, totalBalance: totalBalance(db.accounts) });
    }

    if (req.method === "POST" && path === "/api/transfers") {
      const db = await readDb();
      const body = await readBody(req);
      const amount = Number(body.amount);
      const from = db.accounts.find(account => account.id === body.fromId);
      const to = db.accounts.find(account => account.id === body.toId);

      if (!from || !to || from.id === to.id) throw new Error("Pick two different valid accounts.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid transfer amount.");
      if (from.balance < amount) throw new Error("Insufficient funds in the source account.");

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
      db.transactions.unshift(transaction);
      await writeDb(db);
      return send(res, 201, { accounts: db.accounts, transactions: db.transactions, transaction, totalBalance: totalBalance(db.accounts) });
    }

    if (req.method === "POST" && path === "/api/auth/validate-phone") {
      const { phone } = await readBody(req);
      const valid = /^\d{10}$/.test(String(phone || ""));
      return send(res, valid ? 200 : 400, valid ? { valid: true } : { error: "Phone number must be exactly 10 digits." });
    }

    return send(res, 404, { error: "Route not found." });
  } catch (error) {
    return send(res, 400, { error: error.message || "Request failed." });
  }
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`FinCoach API running at http://localhost:${port}`);
});
