import { resolveWorkspace } from "../services/workspace.service.js";
import { HttpError } from "../utils/httpError.js";

export async function requireAuth(req, res, next) {
  try {
    const workspace = await resolveWorkspace(req, { requireAuth: true });
    req.workspace = workspace;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const workspace = await resolveWorkspace(req, { requireAuth: false });
    req.workspace = workspace;
    next();
  } catch (error) {
    next(error);
  }
}
