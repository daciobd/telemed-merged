export async function retry(fn, { retries = 2, baseMs = 250 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i === retries) break;
      const backoff = baseMs * Math.pow(2, i) + Math.random() * 100;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]);
}
