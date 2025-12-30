import type { Request, Response, NextFunction } from "express";

export function internalOnly(req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-internal-token");

  if (
    token &&
    process.env.INTERNAL_TOKEN &&
    token === process.env.INTERNAL_TOKEN
  ) {
    return next();
  }

  return res.status(401).json({ error: "invalid token" });
}
