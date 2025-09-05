// apps/auction-service/src/index.js
import express from "express";
import cors from "cors";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const INTERNAL_URL_TELEMED = process.env.INTERNAL_URL_TELEMED || "";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin:
      FRONTEND_ORIGIN === "*" ? true : [FRONTEND_ORIGIN, "https://telemed-deploy-ready.onrender.com"],
    credentials: false,
  })
);

// in-memory store só para demo
const bids = new Map();

app.get("/healthz", (req, res) => res.json({ ok: true }));

// cria lance
app.post("/bids", (req, res) => {
  const { patientId, amountCents, mode = "immediate" } = req.body || {};
  if (!patientId || !amountCents) {
    return res.status(400).json({ ok: false, error: "bad_request" });
  }
  const id = `B${Date.now().toString(36)}`;
  const bid = {
    id,
    patientId,
    amountCents: Number(amountCents),
    mode,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  bids.set(id, bid);
  return res.json({ ok: true, bid });
});

// aceita lance
app.post("/bids/:id/accept", async (req, res) => {
  const id = req.params.id;
  const bid = bids.get(id);
  if (!bid) return res.status(404).json({ ok: false, error: "bid_not_found" });

  bid.status = "accepted";

  // chama o serviço interno (opcional)
  if (INTERNAL_URL_TELEMED && INTERNAL_TOKEN) {
    try {
      const r = await fetch(
        `${INTERNAL_URL_TELEMED.replace(/\/$/, "")}/internal/appointments/from-bid`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-token": INTERNAL_TOKEN,
          },
          body: JSON.stringify({
            bidId: bid.id,
            mode: bid.mode,
            patientId: bid.patientId,
          }),
        }
      );
      const data = await r.json().catch(() => ({}));
      return res.json({ ok: true, bid, appointment: data.appointment ?? null });
    } catch (e) {
      return res.status(502).json({ ok: false, error: "internal_call_failed", detail: String(e) });
    }
  }

  return res.json({ ok: true, bid });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("auction-service on", PORT));