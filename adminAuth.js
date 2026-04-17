function parseToken(token = "") {
  try {
    return JSON.parse(Buffer.from(String(token), "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const authHeader = String(req.headers.authorization || "");
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const payload = parseToken(token);

  if (!payload?.sub || !payload?.email) {
    return res.status(401).json({ message: "Invalid authentication token." });
  }

  if (payload.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  req.user = payload;
  return next();
}

module.exports = requireAdmin;
