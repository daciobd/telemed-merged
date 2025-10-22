/**
 * TeleMed - Modelo Conservador de Precificação
 * Conectado ao backend via PricingClient
 */

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { pricing } from '@/src/services/pricing-client';

export default function TelemedPricingModels() {
  const [step, setStep] = useState('form'); // form | searching | result
  const [patientId, setPatientId] = useState('');
  const [specialty, setSpecialty] = useState('cardiologia');
  const [amount, setAmount] = useState('140');
  const [mode, setMode] = useState('immediate');
  const [bidData, setBidData] = useState(null);
  const [bidId, setBidId] = useState(null);
  const [doctors, setDoctors] = useState({ immediate: [], scheduled: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extrair patientId do JWT automaticamente
  const getPatientIdFromJWT = () => {
    try {
      const token = localStorage.getItem('tm_auth_token') || sessionStorage.getItem('tm_auth_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      return payload?.sub || null;
    } catch {
      return null;
    }
  };

  // Carregar patientId (JWT > URL > localStorage > manual)
  useEffect(() => {
    const jwtId = getPatientIdFromJWT();
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('patientId');
    const storageId = localStorage.getItem('patientId');
    
    setPatientId(jwtId || urlId || storageId || '');
  }, []);

  // Criar bid
  const handleCreateBid = async () => {
    const finalPatientId = patientId || 'anon';
    
    setLoading(true);
    setError(null);

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const result = await pricing.createBid({ 
        patientId: finalPatientId, 
        specialty, 
        amountCents, 
        mode 
      });
      
      setBidData(result);
      const id = result?.bid?.id || result?.id;
      setBidId(id);
      setStep('searching');

      // Buscar médicos disponíveis
      if (id) {
        const searchResult = await pricing.searchDoctors(id);
        setDoctors({
          immediate: searchResult?.immediate_doctors || [],
          scheduled: searchResult?.scheduled_doctors || []
        });
        setStep('result');
      }
    } catch (err) {
      setError('Erro ao criar lance: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Aumentar proposta e buscar novamente
  const handleIncreaseBid = async (delta = 20) => {
    if (!bidId) return;
    
    setLoading(true);
    setError(null);

    try {
      const newAmount = parseFloat(amount) + delta;
      const newAmountCents = Math.round(newAmount * 100);
      
      await pricing.increaseBid(bidId, newAmountCents);
      setAmount(String(newAmount));
      
      // Buscar médicos novamente
      const searchResult = await pricing.searchDoctors(bidId);
      setDoctors({
        immediate: searchResult?.immediate_doctors || [],
        scheduled: searchResult?.scheduled_doctors || []
      });
    } catch (err) {
      setError('Erro ao aumentar proposta: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Aceitar médico
  const handleAcceptDoctor = async (doctorId) => {
    if (!bidId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await pricing.acceptDoctor(bidId, doctorId);
      alert(`Médico aceito! Status: ${result.status || 'aceito'}`);
      
      // Resetar formulário
      setStep('form');
      setBidData(null);
      setBidId(null);
      setDoctors({ immediate: [], scheduled: [] });
    } catch (err) {
      setError('Erro ao aceitar médico: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" data-feature="pricing">
      <Card>
        <CardHeader>
          <CardTitle>🏥 Modelo Conservador - Precificação TeleMed</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* FORMULÁRIO */}
          {step === 'form' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="ID do paciente"
                  data-testid="input-patient-id"
                />
              </div>

              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <select
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  data-testid="select-specialty"
                >
                  <option value="clinica_geral">Clínica Geral</option>
                  <option value="psiquiatria">Psiquiatria</option>
                  <option value="cardiologia">Cardiologia</option>
                  <option value="pediatria">Pediatria</option>
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="120.00"
                  data-testid="input-amount"
                />
              </div>

              <div>
                <Label>Tipo de Consulta</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={mode === 'immediate'}
                      onChange={() => setMode('immediate')}
                      data-testid="radio-immediate"
                    />
                    Imediata
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={mode === 'scheduled'}
                      onChange={() => setMode('scheduled')}
                      data-testid="radio-scheduled"
                    />
                    Agendada
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleCreateBid} 
                disabled={loading}
                data-testid="button-create-bid"
                className="w-full"
              >
                {loading ? 'Criando...' : 'Criar Lance'}
              </Button>
            </div>
          )}

          {/* BUSCANDO MÉDICOS */}
          {step === 'searching' && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Buscando médicos disponíveis...</p>
            </div>
          )}

          {/* RESULTADOS */}
          {step === 'result' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <h3 className="font-semibold mb-2">📊 Lance Atual</h3>
                <p className="text-2xl font-bold text-blue-600">R$ {amount}</p>
                {bidId && <p className="text-xs text-gray-500 mt-1">ID: {bidId}</p>}
              </div>

              {/* Médicos Imediatos */}
              {doctors.immediate.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h3 className="font-semibold text-lg mb-3 text-green-800">
                    ⚡ Médicos Imediatos ({doctors.immediate.length})
                  </h3>
                  <div className="grid gap-3">
                    {doctors.immediate.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm"
                        data-testid={`doctor-immediate-${idx}`}
                      >
                        <div>
                          <p className="font-semibold">{doc.name || 'Dr(a). Nome'}</p>
                          <p className="text-sm text-gray-600">
                            {doc.specialty || specialty} • CRM: {doc.crm || 'N/A'}
                          </p>
                          {doc.rating && (
                            <p className="text-sm text-yellow-600">⭐ {doc.rating}/5</p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAcceptDoctor(doc.id)}
                          disabled={loading}
                          data-testid={`button-accept-immediate-${idx}`}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Aceitar Agora
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Médicos Agendados */}
              {doctors.scheduled.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <h3 className="font-semibold text-lg mb-3 text-yellow-800">
                    📅 Médicos Disponíveis para Agendamento ({doctors.scheduled.length})
                  </h3>
                  <div className="grid gap-3">
                    {doctors.scheduled.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm"
                        data-testid={`doctor-scheduled-${idx}`}
                      >
                        <div>
                          <p className="font-semibold">{doc.name || 'Dr(a). Nome'}</p>
                          <p className="text-sm text-gray-600">
                            {doc.specialty || specialty} • CRM: {doc.crm || 'N/A'}
                          </p>
                          {doc.next_slot && (
                            <p className="text-sm text-blue-600">
                              📆 Próximo horário: {doc.next_slot}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleAcceptDoctor(doc.id)}
                          disabled={loading}
                          data-testid={`button-accept-scheduled-${idx}`}
                          size="sm"
                          variant="outline"
                        >
                          Agendar
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sem médicos - CTA para aumentar */}
              {doctors.immediate.length === 0 && doctors.scheduled.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
                  <p className="text-red-800 font-semibold mb-3">
                    ⚠️ Nenhum médico disponível no valor atual
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Tente aumentar sua proposta para encontrar médicos disponíveis
                  </p>
                  <Button
                    onClick={() => handleIncreaseBid(20)}
                    disabled={loading}
                    data-testid="button-increase-bid"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Aumentando...' : `Aumentar para R$ ${(parseFloat(amount) + 20).toFixed(2)}`}
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('form');
                    setBidData(null);
                    setBidId(null);
                    setDoctors({ immediate: [], scheduled: [] });
                  }}
                  className="flex-1"
                  data-testid="button-new-bid"
                >
                  Novo Lance
                </Button>
                {bidId && doctors.immediate.length === 0 && doctors.scheduled.length > 0 && (
                  <Button
                    onClick={() => handleIncreaseBid(10)}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-increase-small"
                  >
                    + R$ 10
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
