import axios from 'axios';

export type ReceitaCertaResponse = {
  ok: boolean;
  url?: string; // link to hosted doc (if their API supports hosting)
  id?: string;
};

export async function sendToReceitaCerta(payload: any): Promise<ReceitaCertaResponse> {
  const baseURL = process.env.RECEITA_CERTA_API_URL;
  const apiKey = process.env.RECEITA_CERTA_API_KEY;
  if (!baseURL || !apiKey) {
    return { ok: false };
  }
  try {
    const res = await axios.post(`${baseURL}/documents`, payload, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return { ok: true, url: res.data?.url, id: res.data?.id };
  } catch (err) {
    console.error('[Receita Certa] error', err);
    return { ok: false };
  }
}