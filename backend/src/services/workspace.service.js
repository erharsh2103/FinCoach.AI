import crypto from "node:crypto";
import { Workspace } from "../models/workspace.model.js";
import { createSeedWorkspace, defaultProfile } from "../constants/seedData.js";
import { HttpError } from "../utils/httpError.js";

export function totalBalance(accounts = []) {
  return accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
}

export async function ensureWorkspaceByPhone(phone = defaultProfile.phone) {
  const normalizedPhone = String(phone || "").replace(/\D/g, "").slice(0, 10);
  if (!/^[0-9]{10}$/.test(normalizedPhone)) {
    return null;
  }

  let workspace = await Workspace.findOne({ phone: normalizedPhone });

  if (!workspace) {
    workspace = await Workspace.create(createSeedWorkspace(normalizedPhone));
  }

  return workspace;
}

export async function resolveWorkspace(req, { requireAuth = false } = {}) {
  const token = req.headers["x-session-token"];

  if (token) {
    const sessionWorkspace = await Workspace.findOne({ "session.token": token });
    if (sessionWorkspace) return sessionWorkspace;
  }

  if (requireAuth) {
    throw new HttpError(401, "Please log in to continue.");
  }

  return null;
}

export async function createSessionForPhone(phone) {
  const workspace = await ensureWorkspaceByPhone(phone);
  workspace.session = {
    token: crypto.randomUUID(),
    createdAt: new Date()
  };
  workspace.profile.phone = phone;
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
