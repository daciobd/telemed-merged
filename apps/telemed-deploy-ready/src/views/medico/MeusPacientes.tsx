import React, { useMemo, useState, useEffect } from "react";

/**
 * /meus-pacientes — Doc24 → Telemed (clone funcional)
 *
 * ✔️ Filtros no topo: ID Persona, Nome, Sobrenome, Nome da Mãe, Identificação, Especialidade
 * ✔️ Tabela com colunas: ID Persona, Nome completo, Identificação, Data de Nascimento, Idade, Sexo, E-mail, Telefone
 * ✔️ Ações por linha: "Ver PHR"  |  "Nova atenção offline"
 * ✔️ Paginação simples (client-side)
 * ✔️ Navegação: /phr/:id  e  /consulta?patientId=:id
 * ✔️ Dados mockados, prontos para trocar por API
 */

// Tipos
interface Paciente {
  idPersona: string;
  nome: string;
  sobrenome: string;
  mae?: string;
  identificacao?: string; // CPF, RG etc
  dataNascimento: string; // ISO yyyy-mm-dd
  sexo: "M" | "F" | "O";
  email?: string;
  telefone?: string;
  especialidade?: string;
}

// Helpers
const formatarDataBR = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const calcularIdade = (iso: string) => {
  const hoje = new Date();
  const nasc = new Date(iso);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

const ESPECIALIDADES = [
  "Clínica Geral",
  "Psiquiatria",
  "Pediatria",
  "Dermatologia",
  "Ginecologia",
  "Cardiologia",
];

// Mock — substitua por fetch("/api/pacientes")
const MOCK: Paciente[] = [
  {
    idPersona: "3335602",
    nome: "Dheliciane",
    sobrenome: "Da Silva Costa",
    mae: "Maria",
    identificacao: "03262894370",
    dataNascimento: "1988-09-23",
    sexo: "F",
    email: "dhelicanecosta@icloud.com",
    telefone: "-",
    especialidade: "Clínica Geral",
  },
  {
    idPersona: "4537263",
    nome: "Hadassa",
    sobrenome: "Da Silva Santos Garcia",
    mae: "Ana",
    identificacao: "14109089760",
    dataNascimento: "1991-08-01",
    sexo: "F",
    email: "silvadassa@gmail.com",
    telefone: "+5521995040225",
    especialidade: "Psiquiatria",
  },
  {
    idPersona: "4849323",
    nome: "William",
    sobrenome: "Lopes Do Nascimento",
    mae: "Vera",
    identificacao: "02876267179",
    dataNascimento: "1997-09-10",
    sexo: "M",
    email: "02876267179@mail.com",
    telefone: "-",
    especialidade: "Clínica Geral",
  },
  {
    idPersona: "5150400",
    nome: "Erika",
    sobrenome: "Carvalho Mendes",
    mae: "Sonia",
    identificacao: "11892779722",
    dataNascimento: "1987-05-04",
    sexo: "F",
    email: "erika.c.mendes@gmail.com",
    telefone: "+5521960184773",
    especialidade: "Psiquiatria",
  },
  {
    idPersona: "5155665",
    nome: "Natalia",
    sobrenome: "Da Silva Mello",
    mae: "Rita",
    identificacao: "09941565708",
    dataNascimento: "1982-12-27",
    sexo: "F",
    email: "natalla.cathiva@gmail.com",
    telefone: "+5511961725613",
    especialidade: "Clínica Geral",
  },
];

// Componente principal
export default function MeusPacientesDoc24() {
  // Estado: filtros
  const [idPersona, setIdPersona] = useState("");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [mae, setMae] = useState("");
  const [identificacao, setIdentificacao] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  // Estado: dados + paginação
  const [dados, setDados] = useState<Paciente[]>([]);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  // Carregar mock
  useEffect(() => {
    setDados(MOCK);
  }, []);

  // Aplicar filtros (client-side)
  const filtrados = useMemo(() => {
    return dados.filter((p) => {
      if (idPersona && !p.idPersona.includes(idPersona)) return false;
      if (nome && !p.nome.toLowerCase().includes(nome.toLowerCase())) return false;
      if (sobrenome && !p.sobrenome.toLowerCase().includes(sobrenome.toLowerCase())) return false;
      if (mae && !(p.mae || "").toLowerCase().includes(mae.toLowerCase())) return false;
      if (identificacao && !(p.identificacao || "").includes(identificacao)) return false;
      if (especialidade && p.especialidade !== especialidade) return false;
      return true;
    });
  }, [dados, idPersona, nome, sobrenome, mae, identificacao, especialidade]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const paginaAtual = filtrados.slice(inicio, inicio + porPagina);

  // Ações
  const verPHR = (id: string) => {
    window.location.href = `/phr-react.html?id=${id}`;
  };

  const novaAtencao = (id: string) => {
    // Para modo offline ou pré-registro
    window.location.href = `/consulta.html?patientId=${id}`;
  };

  const aplicarFiltro = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
  };

  const limpar = () => {
    setIdPersona("");
    setNome("");
    setSobrenome("");
    setMae("");
    setIdentificacao("");
    setEspecialidade("");
    setPagina(1);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">doc24</div>
          <div className="text-sm opacity-90">Bem-vindo, <span className="font-semibold">Dácio Bonoldi Dutra</span></div>
        </div>
      </header>

      {/* Breadcrumb / título */}
      <div className="w-full bg-[#0e6fb9] text-white">
        <div className="mx-auto max-w-6xl px-6 py-3 text-lg font-semibold">Meus pacientes</div>
      </div>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Filtros */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <form onSubmit={aplicarFiltro} className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">ID Persona</label>
              <input 
                data-testid="input-id-persona"
                value={idPersona} 
                onChange={(e) => setIdPersona(e.target.value)} 
                placeholder="ID Persona" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <input 
                data-testid="input-nome"
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="Nome" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">Sobrenome completo</label>
              <input 
                data-testid="input-sobrenome"
                value={sobrenome} 
                onChange={(e) => setSobrenome(e.target.value)} 
                placeholder="Sobrenome completo" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">Nome da Mãe</label>
              <input 
                data-testid="input-mae"
                value={mae} 
                onChange={(e) => setMae(e.target.value)} 
                placeholder="Nome da Mãe" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">Identificação</label>
              <input 
                data-testid="input-identificacao"
                value={identificacao} 
                onChange={(e) => setIdentificacao(e.target.value)} 
                placeholder="CPF/ID" 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
            </div>
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium">Especialidade</label>
              <select 
                data-testid="select-especialidade"
                value={especialidade} 
                onChange={(e) => setEspecialidade(e.target.value)} 
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]">
                <option value="">-- Especialidade --</option>
                {ESPECIALIDADES.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-6 flex items-center gap-3 pt-1">
              <button 
                data-testid="button-filtrar"
                type="submit" 
                className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9]">Filtrar</button>
              <button 
                data-testid="button-limpar"
                type="button" 
                onClick={limpar} 
                className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50">Limpar</button>
              <span 
                data-testid="text-resultado-count"
                className="ml-auto text-sm text-slate-500">{filtrados.length} resultado(s)</span>
            </div>
          </form>
        </section>

        {/* Lista */}
        <section className="rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-3 text-base font-semibold text-slate-700">Meus pacientes</div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm" data-testid="table-pacientes">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-medium">ID Persona</th>
                  <th className="px-5 py-3 font-medium">Nome completo</th>
                  <th className="px-5 py-3 font-medium">Identificação</th>
                  <th className="px-5 py-3 font-medium">Data de Nascimento</th>
                  <th className="px-5 py-3 font-medium">Idade</th>
                  <th className="px-5 py-3 font-medium">Sexo</th>
                  <th className="px-5 py-3 font-medium">Conta de email</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {paginaAtual.map((p) => (
                  <tr key={p.idPersona} className="border-t" data-testid={`row-patient-${p.idPersona}`}>
                    <td className="px-5 py-3 align-top" data-testid={`text-id-${p.idPersona}`}>{p.idPersona}</td>
                    <td className="px-5 py-3 align-top">
                      <div className="font-medium text-slate-800" data-testid={`text-nome-${p.idPersona}`}>{p.nome} {p.sobrenome}</div>
                    </td>
                    <td className="px-5 py-3 align-top" data-testid={`text-identificacao-${p.idPersona}`}>{p.identificacao || "-"}</td>
                    <td className="px-5 py-3 align-top" data-testid={`text-nascimento-${p.idPersona}`}>{formatarDataBR(p.dataNascimento)}</td>
                    <td className="px-5 py-3 align-top" data-testid={`text-idade-${p.idPersona}`}>{calcularIdade(p.dataNascimento)} anos</td>
                    <td className="px-5 py-3 align-top" data-testid={`text-sexo-${p.idPersona}`}>{p.sexo}</td>
                    <td className="px-5 py-3 align-top" data-testid={`text-email-${p.idPersona}`}>{p.email || "-"}</td>
                    <td className="px-5 py-3 align-top" data-testid={`text-telefone-${p.idPersona}`}>{p.telefone || "-"}</td>
                    <td className="px-5 py-3 align-top">
                      <div className="flex gap-2">
                        <button 
                          data-testid={`button-ver-phr-${p.idPersona}`}
                          onClick={() => verPHR(p.idPersona)} 
                          className="rounded-md bg-[#1282db] px-3 py-1.5 text-white hover:bg-[#0e6fb9]">Ver PHR</button>
                        <button 
                          data-testid={`button-nova-atencao-${p.idPersona}`}
                          onClick={() => novaAtencao(p.idPersona)} 
                          className="rounded-md bg-[#22a2f2] px-3 py-1.5 text-white hover:bg-[#128dd8]">Nova atenção offline</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginaAtual.length === 0 && (
                  <tr>
                    <td className="px-5 py-6 text-center text-slate-500" colSpan={9} data-testid="text-sem-pacientes">Nenhum paciente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
            <div data-testid="text-paginacao-info">Mostrando {Math.min(filtrados.length, inicio + 1)}–{Math.min(filtrados.length, inicio + paginaAtual.length)} de {filtrados.length}</div>
            <div className="flex items-center gap-2">
              <button 
                data-testid="button-pagina-anterior"
                disabled={pagina <= 1} 
                onClick={() => setPagina((p) => Math.max(1, p - 1))} 
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">Anterior</button>
              <span data-testid="text-pagina-atual">
                Página <b>{pagina}</b> de <b>{totalPaginas}</b>
              </span>
              <button 
                data-testid="button-pagina-proxima"
                disabled={pagina >= totalPaginas} 
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} 
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-50">Próxima</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}