import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { mutations, type WellsScoreCriteria } from "@/lib/api";

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

  const calculateScoreMutation = useMutation(mutations.calculateWellsScore((data) => {
    setResult(data);
  }));

  const handleCriteriaChange = (criterion: keyof WellsScoreCriteria, checked: boolean) => {
    setCriteria(prev => ({
      ...prev,
      [criterion]: checked
    }));
  };

  const calculateScore = () => {
    calculateScoreMutation.mutate(criteria);
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

      <div className="mt-3 flex space-x-2">
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
    </div>
  );
}
