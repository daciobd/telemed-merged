// Rate limit em memória com janela deslizante de 1 min, por paciente e por IP.
// Em produção com múltiplas instâncias, prefira Redis.

const WINDOW_MS = 60_000;

export function makeRateLimiter({ perMinuteByPatient, perMinuteByIp }) {
  const byPatient = new Map(); // Map<number, {ts:number}[]>
  const byIp = new Map();      // Map<string,  {ts:number}[]>

  function purge(list, now) {
    while (list.length && now - list[0].ts > WINDOW_MS) list.shift();
  }
  function push(list, now) {
    list.push({ ts: now });
  }

  function allow({ patientId, ip }) {
    const now = Date.now();
    const pList = byPatient.get(patientId) || [];
    const iList = byIp.get(ip) || [];
    purge(pList, now); purge(iList, now);

    if (pList.length >= perMinuteByPatient || iList.length >= perMinuteByIp) {
      const oldestTs = Math.min(pList[0]?.ts ?? now, iList[0]?.ts ?? now);
      const retryAfterSec = Math.max(0, Math.ceil((WINDOW_MS - (now - oldestTs)) / 1000));
      return { ok: false, retryAfterSec };
    }

    push(pList, now); push(iList, now);
    byPatient.set(patientId, pList);
    byIp.set(ip, iList);
    return { ok: true };
  }

  return { allow };
}
