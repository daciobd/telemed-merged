(function () {
  const cfg = window.TELEMED_CFG || {};
  const AU = document.getElementById("auUrl");
  const IN = document.getElementById("inUrl");
  const PR = document.getElementById("prodUrl");
  const logEl = document.getElementById("log");

  AU.value = cfg.AUCTION_URL || "";
  PR.value = cfg.PRODUCTIVITY_URL || "";

  document.getElementById("openAuction").href = AU.value || "#";
  document.getElementById("openProd").href = PR.value || "#";

  function log(msg, obj) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    logEl.textContent += line + (obj ? JSON.stringify(obj, null, 2) + "\n" : "");
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function health(url, outId) {
    const out = document.getElementById(outId);
    out.innerHTML = "";
    if (!url) { out.innerHTML = `<span class="bad">URL vazia</span>`; return; }
    try {
      const r = await fetch(url.replace(/\/$/, "") + "/healthz");
      const j = await r.json();
      out.innerHTML = r.ok && j.ok ? `<span class="ok">OK</span>` : `<span class="bad">${r.status}</span>`;
      log(`health ${url}`, j);
    } catch (e) {
      out.innerHTML = `<span class="bad">erro</span>`;
      log(`health ${url} erro`, { error: String(e) });
    }
  }

  document.getElementById("checkAuction").addEventListener("click", () => health(AU.value, "outAuction"));
  document.getElementById("checkInternal").addEventListener("click", () => health(IN.value, "outInternal"));
  document.getElementById("checkProd").addEventListener("click", () => health(PR.value, "outProd"));

  document.getElementById("btnCreateBid").addEventListener("click", async () => {
    const url = (AU.value || "").replace(/\/$/, "");
    const body = {
      patientId: document.getElementById("patientId").value || "paciente-demo",
      specialty: document.getElementById("specialty").value || "clinica_geral",
      isImmediate: (document.getElementById("isImmediate").value || "true") === "true",
      amountCents: Number(document.getElementById("amountCents").value || 9000),
    };
    const out = document.getElementById("outCreateBid");
    out.innerHTML = "Enviando…";
    try {
      const r = await fetch(url + "/__dev/create-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      out.innerHTML = r.ok ? `<span class="ok">Criado</span>` : `<span class="bad">Falha</span>`;
      log("create-bid", j);
      if (j?.bid?.id) document.getElementById("bidId").value = j.bid.id;
    } catch (e) {
      out.innerHTML = `<span class="bad">Erro</span>`;
      log("create-bid erro", { error: String(e) });
    }
  });

  document.getElementById("btnAcceptBid").addEventListener("click", async () => {
    const url = (AU.value || "").replace(/\/$/, "");
    const id = document.getElementById("bidId").value;
    const out = document.getElementById("outAcceptBid");
    if (!id) { out.innerHTML = `<span class="bad">Informe o Bid ID</span>`; return; }
    const body = {
      mode: document.getElementById("mode").value,
      patientId: document.getElementById("patientId").value || "paciente-demo",
      scheduledFor: document.getElementById("scheduledFor").value || null,
    };
    out.innerHTML = "Enviando…";
    try {
      const r = await fetch(`${url}/bids/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      out.innerHTML = r.ok && j.ok ? `<span class="ok">Consulta criada</span>` : `<span class="bad">${j?.error || "Falha"}</span>`;
      log("accept-bid", j);
      if (j?.appointment?.id) document.getElementById("consultId").value = j.appointment.id;
    } catch (e) {
      out.innerHTML = `<span class="bad">Erro</span>`;
      log("accept-bid erro", { error: String(e) });
    }
  });

  document.getElementById("btnCreateTranscript").addEventListener("click", async () => {
    const url = (PR.value || "").replace(/\/$/, "");
    const out = document.getElementById("outTranscript");
    out.innerHTML = "Enviando…";
    try {
      const r = await fetch(url + "/transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaries: [
            { type: "soap", content: "QP: dor torácica há 3h. Plano: ECG + troponina.", model: "demo" },
            { type: "cid10", content: "Sugerido: I20.0; Diferencial: I21.x / TEP.", model: "demo" }
          ]
        }),
      });
      const j = await r.json();
      out.innerHTML = r.ok ? `<span class="ok">Transcript criado</span>` : `<span class="bad">Falha</span>`;
      log("create-transcript", j);
    } catch (e) {
      out.innerHTML = `<span class="bad">Erro</span>`;
      log("create-transcript erro", { error: String(e) });
    }
  });

  document.getElementById("btnPostCodes").addEventListener("click", async () => {
    const url = (PR.value || "").replace(/\/$/, "");
    const consultId = document.getElementById("consultId").value;
    const codesStr = document.getElementById("codesJson").value || "[]";
    const out = document.getElementById("outCodes");
    if (!consultId) { out.innerHTML = `<span class="bad">Preencha consultId</span>`; return; }
    let items = [];
    try { items = JSON.parse(codesStr); } catch { out.innerHTML = `<span class="bad">JSON inválido</span>`; return; }
    out.innerHTML = "Enviando…";
    try {
      const r = await fetch(url + "/code-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultId, items }),
      });
      const j = await r.json();
      out.innerHTML = r.ok && j.ok ? `<span class="ok">OK (${j.count})</span>` : `<span class="bad">${j?.error || "Falha"}</span>`;
      log("post-codes", j);
    } catch (e) {
      out.innerHTML = `<span class="bad">Erro</span>`;
      log("post-codes erro", { error: String(e) });
    }
  });

  IN.value = "https://telemed-internal.onrender.com";
})();