import { useEffect, useState } from "react";

// Hook para pré-preenchimento conforme especificação
function useDrAiPrefill() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q") ?? "";
    const age = url.searchParams.get("age") ?? "";
    const sex = (url.searchParams.get("sex") ?? "").toLowerCase();

    const symptomEl = document.getElementById("symptom-input") as HTMLInputElement | null;
    const ageEl = document.getElementById("age-input") as HTMLInputElement | null;
    const sexEl = document.getElementById("gender-select") as HTMLSelectElement | null;

    if (symptomEl && q) symptomEl.value = q;
    if (ageEl && age) ageEl.value = age;
    if (sexEl && (sex === "male" || sex === "female" || sex === "other")) sexEl.value = sex;

    // banner (opcional)
    if (q || age || sex) {
      const container = document.querySelector(".dr-ai-container") ?? document.body;
      const div = document.createElement("div");
      div.className = "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6";
      div.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="text-blue-600">📋</div>
          <div class="flex-1">
            <strong class="text-blue-900">Contexto da Consulta:</strong>
            <span class="text-blue-800 ml-2">
              ${q ? q : "—"} | ${age ? age + " anos" : "—"} | ${sex || "—"}
            </span>
          </div>
          <button 
            aria-label="Fechar" 
            onclick="this.parentElement.parentElement.remove()" 
            class="text-blue-500 hover:text-blue-700 font-bold text-lg leading-none"
          >×</button>
        </div>
      `;
      container.prepend(div);
    }

    // se existe função que dispara a sugestão inicial, chame aqui:
    // if (q) runInitialSuggestion(q, age, sex);

  }, []);
}

export default function DrAi() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Aplicar pré-preenchimento
  useDrAiPrefill();

  const handleAnalyze = async () => {
    if (!symptoms.trim() || !age || !gender) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth': 'dev-token-123'
        },
        body: JSON.stringify({
          symptoms_text: symptoms,
          idade: parseInt(age),
          genero: gender
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      } else {
        alert("Erro na análise. Tente novamente.");
      }
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dr-ai-container min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-gray-900 no-underline">
                🩺 TeleMed
              </a>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                DR. AI BETA
              </span>
            </div>
            <nav className="flex gap-6">
              <a href="/dashboard/" className="text-gray-600 hover:text-gray-900 no-underline">Dashboard</a>
              <a href="/agenda/" className="text-gray-600 hover:text-gray-900 no-underline">Agenda</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Dr. AI
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Triagem médica inteligente para direcionamento de especialidade
          </p>
          <p className="text-sm text-gray-500">
            ⚡ Análise em menos de 30 segundos • 🎯 85%+ de precisão validada • 🔒 100% seguro e privado
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Análise de Sintomas</h2>
          
          <div className="space-y-6">
            {/* Symptom Input */}
            <div>
              <label htmlFor="symptom-input" className="block text-sm font-medium text-gray-700 mb-2">
                Descreva seus sintomas principais *
              </label>
              <textarea
                id="symptom-input"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Dor de cabeça forte há 2 dias, pior com luz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                data-testid="input-symptoms"
              />
            </div>

            {/* Age Input */}
            <div>
              <label htmlFor="age-input" className="block text-sm font-medium text-gray-700 mb-2">
                Idade *
              </label>
              <input
                id="age-input"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex: 35"
                min="0"
                max="120"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="input-age"
              />
            </div>

            {/* Gender Select */}
            <div>
              <label htmlFor="gender-select" className="block text-sm font-medium text-gray-700 mb-2">
                Sexo *
              </label>
              <select
                id="gender-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="select-gender"
              >
                <option value="">Selecione...</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !symptoms.trim() || !age || !gender}
              className={`px-6 py-3 rounded-md font-medium ${
                loading || !symptoms.trim() || !age || !gender
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              data-testid="button-analyze"
            >
              {loading ? "Analisando..." : "🔍 Analisar Sintomas"}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resultado da Análise</h2>
            
            {/* Specialty Suggestion */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Especialidade Sugerida: {analysis.especialidade}
              </h3>
              <p className="text-blue-800 text-sm mb-2">
                Confiança: {analysis.confianca}%
              </p>
              <p className="text-blue-700 text-sm">
                {analysis.explicacao}
              </p>
            </div>

            {/* Red Flags */}
            {analysis.red_flags && analysis.red_flags.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-900 mb-2">⚠️ Sinais de Alerta</h3>
                <ul className="text-red-800 text-sm space-y-1">
                  {analysis.red_flags.map((flag: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-600">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Guidelines */}
            {analysis.orientacoes && analysis.orientacoes.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">📋 Orientações Pré-Consulta</h3>
                <ul className="text-green-800 text-sm space-y-2">
                  {analysis.orientacoes.map((orientacao: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{orientacao}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}