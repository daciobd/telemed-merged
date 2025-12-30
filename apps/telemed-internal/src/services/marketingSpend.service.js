import { pool } from "../db/pool.js";

export async function insertMarketingSpend(input) {
  const { provider, account_id, currency, rows } = input;

  if (!provider || !account_id || !currency) {
    throw new Error("missing provider/account_id/currency");
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { inserted: 0 };
  }

  let inserted = 0;

  for (const r of rows) {
    if (!r?.date) continue;
    const spend = Number(r.spend);
    if (!Number.isFinite(spend)) continue;

    await pool.query(
      `
      INSERT INTO marketing_spend (provider, account_id, spend_date, currency, amount_cents, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (provider, account_id, spend_date)
      DO UPDATE SET currency = EXCLUDED.currency, amount_cents = EXCLUDED.amount_cents, updated_at = NOW()
      `,
      [provider, account_id, r.date, currency, Math.round(spend * 100)]
    );

    inserted += 1;
  }

  return { inserted };
}
