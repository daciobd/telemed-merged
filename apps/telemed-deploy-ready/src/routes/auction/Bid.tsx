import { useState, useEffect } from "react"; 
import { Button } from "@/src/components/ui/button"; 
import { Input } from "@/src/components/ui/input"; 
import { Label } from "@/src/components/ui/label"; 
import { AUCTION_URL, authToken } from "./shared"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function Bid() { 
  const [specialty, setSpecialty] = useState('clinica_geral'); 
  const [immediate, setImmediate] = useState(true); 
  const [amount, setAmount] = useState('120'); 
  const [slot, setSlot] = useState(''); 
  const [patientId, setPatientId] = useState('');

  // Patch 2: Pré-preencher patientId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('patientId') || localStorage.getItem('patientId') || '';
    setPatientId(id);
  }, []);

  async function submit() { 
    if (!patientId) {
      alert('Patient ID é obrigatório. Por favor, complete o cadastro primeiro.');
      return;
    }

    const r = await fetch(`${AUCTION_URL}/bids`, { 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken(),
        'X-Internal-Token': localStorage.getItem('INTERNAL_TOKEN') || ''
      }, 
      body: JSON.stringify({ 
        patientId, // Incluir patientId no payload
        specialty, 
        mode: immediate ? 'immediate' : 'scheduled',
        amountCents: Math.round(parseFloat(amount) * 100), 
        proposedSlot: slot || undefined 
      })
    }); 
    const j = await r.json(); 
    localStorage.setItem('lastBid', JSON.stringify(j)); 
    location.href = '/auction/result'; 
  } 

  return (
    <div className='p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Fazer lance</CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Patient ID</Label>
          <Input 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)} 
            placeholder="ID do paciente"
            data-testid="input-patient-id"
          />
          
          <Label>Especialidade</Label>
          <Input 
            value={specialty} 
            onChange={e => setSpecialty(e.target.value)} 
            data-testid="input-specialty"
          />
          
          <div>
            <input 
              type='checkbox' 
              checked={immediate} 
              onChange={e => setImmediate(e.target.checked)} 
              data-testid="checkbox-immediate"
            /> 
            Imediato
          </div>
          
          <Label>Valor (R$)</Label>
          <Input 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            data-testid="input-amount"
          />
          
          <Label>Horário (não imediato)</Label>
          <Input 
            type='datetime-local' 
            value={slot} 
            onChange={e => setSlot(e.target.value)} 
            data-testid="input-slot"
          />
          
          <div className='text-right'>
            <Button onClick={submit} data-testid="button-submit">Enviar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ); 
}