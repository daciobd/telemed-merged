import express from "express";
import cors from "cors";
import initializeFeatureFlags from "./features/featureFlags.js";
import { initMetrics } from "./monitoring/metrics.js";
import mdaRouter from "./routes/mda.js";

const app = express();
app.use(express.json());

// Patch 6: CORS configurado para BID funcionar
app.use(cors({ 
  origin: true, // Permite qualquer origem
  credentials: true, // Permite credenciais
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Token"]
}));

initMetrics();
initializeFeatureFlags(); // inicializa sem travar mesmo sem flags

app.use("/api/mda", mdaRouter);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: `MDA listening on ${port}`,
    service: "medical-desk-advanced"
  }));
});
