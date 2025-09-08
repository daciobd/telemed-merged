import fs from 'fs';

export async function openaiTranscribe({ filePath, model='whisper-1', language='pt' }){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) throw new Error('OPENAI_API_KEY missing');
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(filePath)]), 'audio.webm');
  form.append('model', model);
  form.append('language', language);
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method:'POST', headers: { 'Authorization': `Bearer ${apiKey}` }, body: form });
  if(!r.ok){ throw new Error('OpenAI transcribe failed: ' + await r.text()); }
  const j = await r.json(); return j.text || '';
}

export async function openaiSOAP({ transcript, model='gpt-4o-mini' }){
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey) throw new Error('OPENAI_API_KEY missing');
  const prompt = `Gere um resumo clínico em formato SOAP (Subjective, Objective, Assessment, Plan) a partir da transcrição em PT-BR. Responda em JSON com chaves S,O,A,P. Texto:\n\n${transcript}`;
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method:'POST', headers:{ 'Authorization': `Bearer ${apiKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model, messages: [{ role:'system', content:'Você é um assistente médico que estrutura consultas.' },{ role:'user', content: prompt }], temperature: 0.2 }) });
  if(!r.ok){ throw new Error('OpenAI SOAP failed: ' + await r.text()); }
  const j = await r.json(); const text = j.choices?.[0]?.message?.content || '{}';
  try { return JSON.parse(text); } catch { return { S:text, O:'', A:'', P:'' }; }
}
