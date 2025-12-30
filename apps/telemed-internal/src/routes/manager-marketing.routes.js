import express from "express";
import { insertMarketingSpend } from "../services/marketingSpend.service.js";

const router = express.Router();

router.post("/spend", async (req, res) => {
  try {
    const { provider, account_id, currency, rows } = req.body;
    const result = await insertMarketingSpend({ provider, account_id, currency, rows });
    return res.json({ success: true, inserted: result.inserted });
  } catch (e) {
    console.error("[manager/marketing/spend] erro:", e);
    return res.status(400).json({ error: e.message ?? "bad request" });
  }
});

export default router;
