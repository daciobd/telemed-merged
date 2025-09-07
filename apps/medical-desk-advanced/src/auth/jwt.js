// jwt.js - Middleware de autenticação JWT unificado
import jwt from "jsonwebtoken";

const {
  JWT_PUBLIC_KEY_PEM,
  JWT_AUDIENCE = "telemed",
  JWT_ISSUER = "telemed-auth",
} = process.env;

export function jwtAuth(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  
  if (!token) {
    return res.status(401).json({ 
      error: "missing_token",
      message: "Token de autorização obrigatório" 
    });
  }

  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY_PEM, {
      algorithms: ["RS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });
    
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: "invalid_token",
      message: "Token inválido ou expirado",
      details: err.message 
    });
  }
}

// Mock JWT para desenvolvimento (quando JWT_PUBLIC_KEY_PEM não estiver definido)
export function mockJwtAuth(req, res, next) {
  req.user = {
    sub: "dev-user-123",
    role: "doctor",
    specialties: ["clinica-geral"]
  };
  next();
}

export const authMiddleware = JWT_PUBLIC_KEY_PEM ? jwtAuth : mockJwtAuth;