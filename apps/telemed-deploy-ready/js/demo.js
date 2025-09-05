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

  document.getElementById("btnCreateBid").addEventListener("click", criarBid);

  document.getElementById("btnAcceptBid").addEventListener("click", aceitarBid);

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
  // ---------- Novas funções conforme patch solicitado ----------
  function el(id){ return document.getElementById(id); }
  
  window.criarBid = async function(){
    try {
      const patientId = el("patientId").value.trim();
      const amountCents = parseInt(el("amountCents").value, 10);
      const isImmediate = (el("isImmediate").value === "true");
      const mode = isImmediate ? "immediate" : "scheduled";
      const scheduledFor = el("scheduledFor").value;

      const body = { patientId, amountCents, mode };
      if (mode === "scheduled" && scheduledFor) body.scheduledFor = scheduledFor;

      const r = await fetch(`${AU.value}/bids`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e){ data = { ok:false, error:`HTTP ${r.status}`, raw:text }; }

      if (!r.ok || !data?.ok) {
        log("criarBid falha", { ok:false, error:data?.error || `HTTP ${r.status}`, raw:data?.raw || text });
        return;
      }

      log("criarBid sucesso", data);
      if (data.bid?.id) el("bidId").value = data.bid.id;
    } catch (err) {
      log("criarBid erro", { ok:false, error:String(err) });
    }
  }

  window.aceitarBid = async function(){
    try {
      const bidId = el("bidId").value.trim();
      if (!bidId) { log("aceitarBid erro", { ok:false, error:"Informe o Bid ID" }); return; }

      const mode = el("mode").value;
      const patientId = el("patientId").value.trim();
      const scheduledFor = el("scheduledFor").value;

      const body = { mode, patientId };
      if (mode === "scheduled" && scheduledFor) body.scheduledFor = scheduledFor;

      const r = await fetch(`${AU.value}/bids/${encodeURIComponent(bidId)}/accept`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(body),
      });

      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e){ data = { ok:false, error:`HTTP ${r.status}`, raw:text }; }

      if (!r.ok || !data?.ok) {
        log("aceitarBid falha", { ok:false, error:data?.error || `HTTP ${r.status}`, raw:data?.raw || text });
        return;
      }

      log("aceitarBid sucesso", data);

      if (data.appointment?.id) {
        window.location.href = `/sala-de-espera/?appointmentId=${encodeURIComponent(data.appointment.id)}`;
      }
    } catch (err) {
      log("aceitarBid erro", { ok:false, error:String(err) });
    }
  }
