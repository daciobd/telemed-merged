import { useSearchParams, Link } from 'react-router-dom';
import { ids } from '@/lib/ids';

export default function CadastroSucesso(){
  const [sp] = useSearchParams();
  const id = sp.get('patientId') || ids.getPatientId();
  if (!id) return <p>Não foi possível localizar seu Patient ID.</p>;
  const copy = async ()=>{ await navigator.clipboard.writeText(id); alert('Patient ID copiado'); };
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Cadastro concluído ✅</h1>
      <p className="text-slate-700">Guarde o seu <b>Patient ID</b>:</p>
      <pre className="p-3 bg-slate-100 rounded-md select-all">{id}</pre>
      <div className="flex gap-3 mt-4">
        <button className="btn" onClick={copy}>Copiar ID</button>
        <Link className="btn" to={`/paciente/pedido?patientId=${encodeURIComponent(id)}`}>Fazer pedido de consulta</Link>
        <a className="btn" href="/">Voltar ao Hub</a>
      </div>
    </div>
  );
}