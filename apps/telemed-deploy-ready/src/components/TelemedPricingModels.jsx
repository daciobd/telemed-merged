/**
 * TeleMed - Modelo Conservador de Precificação
 * Conectado ao backend via PricingClient
 */

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import PricingClient from '@/src/services/pricing-client';

export default function TelemedPricingModels() {
  const [step, setStep] = useState('form'); // form | searching | result
  const [patientId, setPatientId] = useState('');
  const [specialty, setSpecialty] = useState('clinica_geral');
  const [amount, setAmount] = useState('120');
  const [mode, setMode] = useState('immediate');
  const [bidData, setBidData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar patientId do localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('patientId') || localStorage.getItem('patientId') || '';
    setPatientId(id);
  }, []);

  // Criar bid
  const handleCreateBid = async () => {
    if (!patientId) {
      setError('Patient ID é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const result = await PricingClient.createBid(patientId, specialty, amountCents, mode);
      
      setBidData(result);
      setStep('searching');

      // Buscar médicos disponíveis
      if (result.bidId || result.id) {
        const searchResult = await PricingClient.searchDoctors(result.bidId || result.id);
        setDoctors(searchResult.doctors || []);
        setStep('result');
      }
    } catch (err) {
      setError('Erro ao criar lance: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Aceitar médico
  const handleAcceptDoctor = async (doctorId) => {
    if (!bidData || !bidData.bidId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await PricingClient.acceptDoctor(bidData.bidId, doctorId);
      alert(`Médico aceito! Status: ${result.status || 'aceito'}`);
      
      // Resetar formulário
      setStep('form');
      setBidData(null);
      setDoctors([]);
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
                <h3 className="font-semibold mb-2">📊 Dados do Lance</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto">
                  {JSON.stringify(bidData, null, 2)}
                </pre>
              </div>

              <h3 className="font-semibold text-lg mb-3">
                👨‍⚕️ Médicos Disponíveis ({doctors.length})
              </h3>

              {doctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum médico disponível no momento
                </p>
              ) : (
                <div className="grid gap-3">
                  {doctors.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
                      data-testid={`doctor-card-${idx}`}
                    >
                      <div>
                        <p className="font-semibold">{doc.name || 'Dr(a). Nome'}</p>
                        <p className="text-sm text-gray-600">
                          {doc.specialty || specialty} • CRM: {doc.crm || 'N/A'}
                        </p>
                        {doc.rating && (
                          <p className="text-sm text-yellow-600">
                            ⭐ {doc.rating}/5
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAcceptDoctor(doc.id)}
                        disabled={loading}
                        data-testid={`button-accept-${idx}`}
                        size="sm"
                      >
                        Aceitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setStep('form');
                  setBidData(null);
                  setDoctors([]);
                }}
                className="w-full mt-4"
                data-testid="button-new-bid"
              >
                Novo Lance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
