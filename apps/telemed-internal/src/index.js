import express from 'express'; import morgan from 'morgan'; import { PrismaClient } from '@prisma/client';
const app = express(); const prisma = new PrismaClient(); app.use(express.json()); app.use(morgan('tiny')); app.get('/healthz',(_req,res)=>res.json({ok:true}));
function checkInternal(req,res,next){ const t=req.header('X-Internal-Token'); if(!t || t!==(process.env.INTERNAL_TOKEN||'change-me-internal')) return res.status(401).json({error:'unauthorized'}); next(); }
app.post('/internal/appointments/from-bid', checkInternal, async (req,res)=>{ const { bidId, acceptedSlot, isImmediate } = req.body||{}; if(!bidId) return res.status(400).json({error:'bidId required'});
  const evt = await prisma.externalEvent.create({ data:{ type:'AUCTION_PAID', payload:{ bidId, acceptedSlot, isImmediate } } });
  try{ const appt = await prisma.appointment.create({ data:{ bidId, startsAt: acceptedSlot? new Date(acceptedSlot): new Date(), status: isImmediate?'confirmed':'scheduled', origin:'auction' } }); return res.json({ ok:true, appointmentId: appt.id, eventId: evt.id }); }
  catch(e){ console.warn('Appointment create skipped:', e.message); return res.json({ ok:true, eventId: evt.id, note:'Appointment model not managed here; event logged.' }); }
});
const PORT=process.env.PORT||8080; app.listen(PORT,()=>console.log('telemed-internal on',PORT));
