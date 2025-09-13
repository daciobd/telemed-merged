// check-routes.mjs
const base = "https://60caaae2-b759-4421-bea0-41165f6b95a2-00-3gqmyfv0qhnan.worf.replit.dev";
const routes = [
  "/",
  "/cadastro.html",
  "/cadastro-medico.html",
  "/paciente/cadastro/sucesso.html?patientId=12345678901",
  "/paciente/pedido.html?patientId=12345678901",
  "/sala-de-espera.html?appointmentId=test123&patientId=12345678901",
  "/consulta/index.html?appointmentId=test123&role=doctor&patientId=12345678901",
  "/paciente/como-funciona.html",
  "/medico/como-funciona.html",
  "/healthz",
  "/rc/health",
];

const HEADERS = { "User-Agent": "TeleMedRouteCheck/1.0" };
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));

async function check(url) {
  try {
    const res = await Promise.race([
      fetch(url, { method: "GET", headers: HEADERS }),
      timeout(8000),
    ]);
    return res.status;
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

(async () => {
  console.log("route,status");
  for (const r of routes) {
    const full = base + r;
    const status = await check(full);
    console.log(`${r},${status}`);
  }
})();