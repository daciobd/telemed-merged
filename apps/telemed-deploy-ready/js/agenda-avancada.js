(function () {
  const pt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
  const dow = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  // estado
  let view = new Date();        // mês em visualização
  view.setDate(1);
  let selected = new Date();    // dia selecionado

  const q = new URLSearchParams(location.search);
  const demoMode = q.get("demo") === "1" || q.get("demo") === "true";

  // elementos
  const monthLabel = document.getElementById("monthLabel");
  const dayLabel   = document.getElementById("dayLabel");
  const cal        = document.getElementById("calendar");
  const list       = document.getElementById("list");
  const prevBtn    = document.getElementById("prev");
  const nextBtn    = document.getElementById("next");
  const notifyTg   = document.getElementById("notifyToggle");
  const notifyChip = document.getElementById("notifyChip");

  prevBtn.onclick = () => { view.setMonth(view.getMonth()-1); render(); };
  nextBtn.onclick = () => { view.setMonth(view.getMonth()+1); render(); };
  notifyTg.onchange = () => notifyChip.textContent = `Notificações: ${notifyTg.checked ? "ativadas" : "desligadas"}`;

  function ymd(d){ return d.toISOString().slice(0,10); }
  function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

  function render() {
    // cabeçalho mês
    monthLabel.textContent = capitalize(pt.format(view));
    // grid
    cal.innerHTML = "";
    // header dow
    for (const d of dow) {
      const el = document.createElement("div");
      el.className = "dow";
      el.textContent = d;
      cal.appendChild(el);
    }
    // primeiro dia da grade
    const first = new Date(view);
    const startDow = first.getDay();
    const start = new Date(first);
    start.setDate(first.getDate() - startDow);

    // 6 semanas x 7 dias
    for (let i=0; i<42; i++){
      const d = new Date(start);
      d.setDate(start.getDate()+i);
      const el = document.createElement("div");
      el.className = "day";
      el.textContent = d.getDate();

      if (d.getMonth() !== view.getMonth()) el.classList.add("is-other");
      if (sameDay(d, new Date())) el.classList.add("is-today");
      if (sameDay(d, selected)) el.classList.add("is-selected");

      el.onclick = () => { selected = d; render(); };
      cal.appendChild(el);
    }
    // lista do dia
    renderList();
  }

  async function renderList() {
    dayLabel.textContent = `Horários para ${selected.toLocaleDateString("pt-BR")}`;
    list.innerHTML = "";

    // dados demo (JSON) ou vazio
    let data = [];
    if (demoMode) {
      try {
        const res = await fetch("/data/demo-appointments.json");
        const all = await res.json();
        data = (all[ymd(selected)] || []);
      } catch (e) {
        console.warn("demo json não disponível", e);
      }
    }

    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Sem horários neste dia. Use \"Popular com exemplos\" ou crie pelo Dashboard.";
      list.appendChild(empty);
      return;
    }

    for (const appt of data) {
      const row = document.createElement("div");
      row.className = "appt";
      row.innerHTML = `
        <div>
          <div class="who">${appt.paciente}</div>
          <div style="color:var(--tm-text-muted); font-size:.9rem">${appt.especialidade} • ${appt.sala}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px">
          <div class="chip">${appt.hora}</div>
          <a class="btn" href="/consulta?from=agenda&slot=${encodeURIComponent(appt.hora)}">Atender</a>
        </div>
      `;
      list.appendChild(row);
    }
  }

  function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  // inicial
  render();
})();