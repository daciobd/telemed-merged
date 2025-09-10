import express from "express";
import cors from "cors";
import initializeFeatureFlags from "./features/featureFlags.js";
import { initMetrics } from "./monitoring/metrics.js";
import mdaRouter from "./routes/mda.js";

const app = express();
app.use(express.json());

// CORS: define CORS_ORIGINS="https://seu-front.com,https://outro.com" se quiser travar
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(s => s.trim())
  : true;
app.use(cors({ origin: corsOrigins }));

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
