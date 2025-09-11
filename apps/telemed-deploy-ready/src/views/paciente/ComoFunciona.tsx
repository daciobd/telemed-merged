export default function PacienteComoFunciona(){
  return (
    <div className="container max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Como funciona (Paciente)</h1>
      <ol className="list-decimal ml-6 space-y-3 text-slate-700">
        <li>Faça seu cadastro.</li>
        <li>Crie um <b>pedido de consulta (BID)</b>.</li>
        <li>Aguarde na <b>Sala de Espera</b> até o médico aceitar ou agendar.</li>
        <li>Entre na <b>Sala da Consulta</b> quando for chamado.</li>
      </ol>
      <div className="mt-6 flex gap-3">
        <a className="btn" href="/cadastro.html">Fazer cadastro</a>
      </div>
    </div>
  );
}