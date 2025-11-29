import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { mutations, type WellsScoreCriteria } from "@/lib/api";
import { toast } from "react-hot-toast";

interface WellsHistoryItem {
  id: string;
  score: number;
  interpretation: string;
  recommendation: string;
  criteria: WellsScoreCriteria;
  timestamp: string;
}

export default function WellsScoreCalculator() {
  const [criteria, setCriteria] = useState<WellsScoreCriteria>({
    clinicalSignsTVP: false,
    tepmorelikely: false,
    heartRateOver100: false,
    immobilizationSurgery: false,
    previousTEP: false,
    hemoptysis: false,
    cancer: false,
  });

  const [result, setResult] = useState<{
    score: number;
    interpretation: string;
    recommendation: string;
  } | null>(null);

  const [history, setHistory] = useState<WellsHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wells-score-history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  }, []);

  const calculateScoreMutation = useMutation(mutations.calculateWellsScore((data) => {
    setResult(data);
    
    // Salvar no histórico
    const newItem: WellsHistoryItem = {
      id: Date.now().toString(),
      score: data.score,
      interpretation: data.interpretation,
      recommendation: data.recommendation,
      criteria,
      timestamp: new Date().toLocaleString('pt-BR')
    };
    
    const updated = [newItem, ...history].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('wells-score-history', JSON.stringify(updated));
    
    toast.success(`✅ Escore calculado: ${data.score} pontos`, { duration: 3000 });
  }));

  const handleCriteriaChange = (criterion: keyof WellsScoreCriteria, checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      [criterion]: checked
    }));
  };

  const calculateScore = () => {
    const selected = Object.values(criteria).some(v => v);
    if (!selected) {
      toast.error('⚠️ Selecione pelo menos um critério', { duration: 3000 });
      return;
    }
    calculateScoreMutation.mutate(criteria);
  };

  const recalculateFromHistory = (item: WellsHistoryItem) => {
    setCriteria(item.criteria);
    setResult(null);
    toast.info(`🔄 Critérios carregados de ${item.timestamp}`, { duration: 2000 });
  };

  const exportPDF = async () => {
    try {
      if (!result) return;

      const response = await fetch('/api/export-pdf/wells-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: result.score,
          interpretation: result.interpretation,
          recommendation: result.recommendation,
          criteria
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar PDF');
      }

      const html = await response.text();
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF: ' + error.message);
    }
  };

  return (
    <div className="bg-orange-50 rounded-md p-3 mt-3" data-testid="wells-score-calculator">
      <h5 className="font-medium text-orange-900 mb-2">Critérios de Wells (TEP):</h5>
      <div className="space-y-2 text-sm">
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.clinicalSignsTVP}
            onCheckedChange={(checked) => handleCriteriaChange('clinicalSignsTVP', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-clinical-signs-tvp"
          />
          <span className="text-orange-800">Sinais clínicos de TVP (+3)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.tepmorelikely}
            onCheckedChange={(checked) => handleCriteriaChange('tepmorelikely', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-tep-more-likely"
          />
          <span className="text-orange-800">TEP mais provável que outro diagnóstico (+3)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.heartRateOver100}
            onCheckedChange={(checked) => handleCriteriaChange('heartRateOver100', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-heart-rate"
          />
          <span className="text-orange-800">FC {'>'}  100 bpm (+1.5)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.immobilizationSurgery}
            onCheckedChange={(checked) => handleCriteriaChange('immobilizationSurgery', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-immobilization"
          />
          <span className="text-orange-800">Imobilização/cirurgia nas últimas 4 semanas (+1.5)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.previousTEP}
            onCheckedChange={(checked) => handleCriteriaChange('previousTEP', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-previous-tep"
          />
          <span className="text-orange-800">TEP ou TVP prévio (+1.5)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.hemoptysis}
            onCheckedChange={(checked) => handleCriteriaChange('hemoptysis', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-hemoptysis"
          />
          <span className="text-orange-800">Hemoptise (+1)</span>
        </label>
        <label className="flex items-center space-x-2">
          <Checkbox
            checked={criteria.cancer}
            onCheckedChange={(checked) => handleCriteriaChange('cancer', !!checked)}
            className="border-orange-300 text-orange-600 focus:ring-orange-500"
            data-testid="checkbox-cancer"
          />
          <span className="text-orange-800">Câncer ativo (+1)</span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={calculateScore}
          disabled={calculateScoreMutation.isPending}
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
          data-testid="button-calculate-wells"
        >
          {calculateScoreMutation.isPending ? "Calculando..." : "Calcular Escore"}
        </Button>
        {result && (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => exportPDF()}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              data-testid="button-export-pdf"
            >
              📄 Exportar PDF
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowHistory(!showHistory)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              📋 Histórico ({history.length})
            </Button>
          </>
        )}
      </div>

      {result && (
        <Card className="mt-3" data-testid="wells-score-result">
          <CardContent className="p-3">
            <div className="text-center mb-2">
              <span className="text-sm font-medium text-orange-900">Escore Total: </span>
              <span className="text-lg font-bold text-orange-700" data-testid="wells-score-value">
                {result.score}
              </span>
              <span className="text-sm text-orange-700 ml-1">pontos</span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium text-orange-900">Interpretação: </span>
                <span className="text-orange-800" data-testid="wells-interpretation">
                  {result.interpretation}
                </span>
              </div>
              <div>
                <span className="font-medium text-orange-900">Recomendação: </span>
                <span className="text-orange-800" data-testid="wells-recommendation">
                  {result.recommendation}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showHistory && history.length > 0 && (
        <Card className="mt-3 bg-orange-50 border-orange-200">
          <CardContent className="p-3">
            <h6 className="font-medium text-orange-900 mb-2">📋 Últimos Cálculos:</h6>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item) => (
                <div key={item.id} className="p-2 bg-white rounded border border-orange-100 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-orange-700">{item.score}</span>
                      <span className="text-xs text-gray-500 ml-2">{item.timestamp}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => recalculateFromHistory(item)}
                      className="h-6 px-2 text-xs"
                    >
                      🔄 Usar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.interpretation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
