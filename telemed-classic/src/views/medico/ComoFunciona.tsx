export default function MedicoComoFunciona(){
  return (
    <div className="container max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Como funciona (Médico)</h1>
      <ol className="list-decimal ml-6 space-y-3 text-slate-700">
        <li>Faça seu cadastro de médico.</li>
        <li>Acesse o <b>Dashboard</b> para ver BIDs pendentes e agenda.</li>
        <li><b>Aceite</b> o BID ou <b>agende</b> um horário.</li>
        <li>Abra a <b>Sala da Consulta</b> quando chegar a hora.</li>
      </ol>
      <div className="mt-6 flex gap-3">
        <a className="btn" href="/cadastro-medico.html">Cadastro de médico</a>
        <a className="btn" href="/dashboard">Ir ao dashboard</a>
      </div>
    </div>
  );
}