export function initMetrics() {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: "Metrics system initialized",
    service: "medical-desk-advanced"
  }));
}
