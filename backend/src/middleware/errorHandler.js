export function notFound(_req, res) {
  res.status(404).json({ error: "Route not found." });
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 400;
  const message = error.message || "Request failed.";

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
}
