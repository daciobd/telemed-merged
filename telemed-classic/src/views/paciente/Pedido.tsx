import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ids } from '@/lib/ids';

export default function PacientePedido(){
  const [sp] = useSearchParams();
  const pid = sp.get('patientId') || ids.getPatientId();

  useEffect(()=>{
    const input = document.querySelector<HTMLInputElement>('#patientId');
    if (input && pid) input.value = pid;
  }, [pid]);

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Fazer Pedido de Consulta</h1>
      <p className="text-slate-700 mb-6">Preencha os dados para criar seu pedido de consulta médica.</p>
      
      <form className="space-y-4">
        <div>
          <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
            Patient ID
          </label>
          <input 
            id="patientId" 
            name="patientId" 
            type="text" 
            defaultValue={pid}
            placeholder="ID será preenchido automaticamente do seu cadastro" 
            readOnly 
            disabled 
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            data-testid="input-patient-id" 
          />
        </div>
        
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
            Especialidade
          </label>
          <select id="specialty" className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Selecione a especialidade</option>
            <option value="clinica-geral">Clínica Geral</option>
            <option value="cardiologia">Cardiologia</option>
            <option value="dermatologia">Dermatologia</option>
          </select>
        </div>

        <div>
          <label htmlFor="amountCents" className="block text-sm font-medium text-gray-700 mb-1">
            Valor máximo (R$)
          </label>
          <input 
            id="amountCents" 
            type="number" 
            min="0" 
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: 150.00"
          />
        </div>

        <div>
          <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de consulta
          </label>
          <select id="mode" className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="immediate">Imediata</option>
            <option value="scheduled">Agendada</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          data-testid="button-submit-bid"
        >
          Enviar Pedido
        </button>
      </form>
    </div>
  );
}