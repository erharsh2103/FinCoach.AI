import crypto from "node:crypto";
import { supabase } from "../config/db.js";
import { createSeedWorkspace, defaultProfile } from "../constants/seedData.js";
import { HttpError } from "../utils/httpError.js";

// [workspace key, postgres table]
const COLLECTIONS = [
  ["accounts", "accounts"],
  ["transactions", "transactions"],
  ["goals", "goals"],
  ["bills", "bills"],
  ["subscriptions", "subscriptions"],
  ["cashPayments", "cash_payments"]
];

const NUMERIC_FIELDS = new Set(["balance", "amount", "current", "target"]);

export function totalBalance(accounts = []) {
  return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

// Strip the FK column and coerce numeric columns (PostgREST may return numerics as strings).
function fromRow(row) {
  const { userId, ...rest } = row;
  for (const key of Object.keys(rest)) {
    if (NUMERIC_FIELDS.has(key) && rest[key] !== null && rest[key] !== undefined) {
      rest[key] = Number(rest[key]);
    }
  }
  return rest;
}

async function loadCollections(userId) {
  const collections = {};
  for (const [key, table] of COLLECTIONS) {
    const { data, error } = await supabase.from(table).select("*").eq("userId", userId);
    if (error) throw new HttpError(500, `Failed to load ${key}: ${error.message}`);
    collections[key] = (data || []).map(fromRow);
  }
  return collections;
}

function buildWorkspace(userRow, collections) {
  const workspace = {
    id: userRow.id,
    phone: userRow.phone,
    plan: userRow.plan || "free",
    onboardingCompleted: Boolean(userRow.onboardingCompleted),
    profile: userRow.profile && Object.keys(userRow.profile).length
      ? userRow.profile
      : { ...defaultProfile, phone: userRow.phone },
    session: { token: userRow.sessionToken || null },
    accounts: collections.accounts,
    transactions: collections.transactions,
    goals: collections.goals,
    bills: collections.bills,
    subscriptions: collections.subscriptions,
    cashPayments: collections.cashPayments
  };

  // Persist the whole workspace: update the user row, then replace each collection
  // table's rows for this user. Datasets are per-user and small, so a delete+insert
  // is simple and keeps the existing controller logic (array mutation) intact.
  Object.defineProperty(workspace, "save", {
    enumerable: false,
    value: async function save() {
      const { error: userError } = await supabase
        .from("users")
        .update({
          phone: this.phone,
          plan: this.plan,
          onboardingCompleted: this.onboardingCompleted,
          profile: this.profile,
          sessionToken: this.session?.token || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", this.id);
      if (userError) throw new HttpError(500, `Save failed (user): ${userError.message}`);

      for (const [key, table] of COLLECTIONS) {
        const rows = (this[key] || []).map(item => ({ ...item, userId: this.id }));
        const { error: deleteError } = await supabase.from(table).delete().eq("userId", this.id);
        if (deleteError) throw new HttpError(500, `Save failed (${table}): ${deleteError.message}`);
        if (rows.length) {
          const { error: insertError } = await supabase.from(table).insert(rows);
          if (insertError) throw new HttpError(500, `Save failed (${table}): ${insertError.message}`);
        }
      }
    }
  });

  return workspace;
}

export async function ensureWorkspaceByPhone(phone = defaultProfile.phone) {
  const normalizedPhone = String(phone || "").replace(/\D/g, "").slice(0, 10);
  if (!/^[0-9]{10}$/.test(normalizedPhone)) {
    return null;
  }

  let { data: userRow, error } = await supabase
    .from("users")
    .select("*")
    .eq("phone", normalizedPhone)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);

  if (!userRow) {
    const seed = createSeedWorkspace(normalizedPhone);
    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        phone: normalizedPhone,
        plan: seed.plan,
        onboardingCompleted: seed.onboardingCompleted,
        profile: seed.profile
      })
      .select("*")
      .single();
    if (insertError) throw new HttpError(500, insertError.message);
    userRow = inserted;
  }

  const collections = await loadCollections(userRow.id);
  return buildWorkspace(userRow, collections);
}

export async function resolveWorkspace(req, { requireAuth = false } = {}) {
  const token = req.headers["x-session-token"];

  if (token) {
    const { data: userRow, error } = await supabase
      .from("users")
      .select("*")
      .eq("sessionToken", token)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (userRow) {
      const collections = await loadCollections(userRow.id);
      return buildWorkspace(userRow, collections);
    }
  }

  if (requireAuth) {
    throw new HttpError(401, "Please log in to continue.");
  }

  return null;
}

export async function createSessionForPhone(phone) {
  const workspace = await ensureWorkspaceByPhone(phone);
  if (!workspace) {
    throw new HttpError(400, "Phone number must be exactly 10 digits.");
  }
  workspace.session = { token: crypto.randomUUID() };
  workspace.profile = { ...workspace.profile, phone };
  workspace.phone = phone;
  await workspace.save();
  return workspace;
}

export function serializeWorkspace(workspace) {
  return {
    session: workspace.session || null,
    plan: workspace.plan,
    onboardingCompleted: Boolean(workspace.onboardingCompleted),
    profile: workspace.profile,
    accounts: workspace.accounts,
    transactions: workspace.transactions,
    goals: workspace.goals,
    bills: workspace.bills,
    subscriptions: workspace.subscriptions,
    cashPayments: workspace.cashPayments,
    totalBalance: totalBalance(workspace.accounts)
  };
}
