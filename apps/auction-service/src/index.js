import express from 'express'; import cors from 'cors'; import morgan from 'morgan'; import { PrismaClient } from '@prisma/client'; import { z } from 'zod'; import { authMiddleware } from './middleware/auth.js';
const app = express(); const prisma = new PrismaClient(); app.use(cors()); app.use(express.json()); app.use(morgan('tiny')); app.get('/healthz',(_req,res)=>res.json({ok:true}));
app.get('/auction/info',(_req,res)=>res.json({enabled:process.env.AUCTION_ENABLED==='true'}));
const schema = z.object({specialty:z.string().min(2), isImmediate:z.boolean(), amountCents:z.number().int().positive(), proposedSlot:z.string().datetime().optional()});
app.post('/auction/bids', authMiddleware(['patient']), async (req,res)=>{ const p=schema.safeParse(req.body); if(!p.success) return res.status(400).json({error:p.error.flatten()});
  const {specialty,isImmediate,amountCents,proposedSlot}=p.data; const expiresMin=parseInt(process.env.AUCTION_IMMEDIATE_EXPIRES_MIN||'15',10);
  const bid=await prisma.bid.create({data:{patientId:req.user.id,specialty,isImmediate,amountCents,proposedSlot:proposedSlot?new Date(proposedSlot):null,expiresAt:new Date(Date.now()+(isImmediate?expiresMin:60)*60*1000)}});
  let status='pending', offered=null; const minI=parseInt(process.env.AUCTION_MIN_PRICE_DEFAULT_IMMEDIATE_CENTS||'8000',10); const minS=parseInt(process.env.AUCTION_MIN_PRICE_DEFAULT_SCHEDULED_CENTS||'6000',10);
  if(isImmediate && amountCents>=minI){ status='accepted_immediate'; } else if(!isImmediate && amountCents>=minS){ status='accepted_scheduled'; offered=new Date(Date.now()+2*60*60*1000);} else { status='rejected'; }
  const updated = await prisma.bid.update({ where:{id:bid.id}, data:{ status, acceptedSlot:offered, suggestedNextAmountCents: status==='rejected' ? (isImmediate?minI:minS) : null } });
  if(status==='accepted_immediate'||status==='accepted_scheduled'){ await prisma.payment.create({data:{bidId:bid.id,amountCents,status:'created',provider:process.env.PAYMENTS_PROVIDER||'mock'}}); }
  res.json({ bidId: updated.id, status: updated.status, offeredSlot: updated.acceptedSlot, suggestedNextAmountCents: updated.suggestedNextAmountCents });
});
app.post('/payments/mock-capture', async (req,res)=>{ const { bidId } = req.body||{}; if(!bidId) return res.status(400).json({error:'bidId required'}); const bid=await prisma.bid.findUnique({where:{id:bidId}}); if(!bid) return res.status(404).json({error:'Bid not found'});
  await prisma.payment.create({data:{bidId:bid.id,amountCents:bid.amountCents,status:'paid',provider:'mock',providerRef:'mock-ref'}}); await prisma.bid.update({where:{id:bid.id},data:{status:'paid'}});
  try{ const internal = process.env.INTERNAL_URL_TELEMED; const token = process.env.INTERNAL_TOKEN || 'change-me-internal'; if(internal){ await fetch(`${internal}/internal/appointments/from-bid`,{ method:'POST', headers:{'Content-Type':'application/json','X-Internal-Token':token}, body: JSON.stringify({ bidId: bid.id, acceptedSlot: bid.acceptedSlot, isImmediate: bid.isImmediate }) }); } } catch(e){ console.error('Notify internal failed', e.message); }
  res.json({ok:true});
});
const PORT=process.env.PORT||8080; app.listen(PORT,()=>console.log('auction-service on',PORT));
