import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { mutations, type SystemStats, type AnalysisResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SymptomInputPanelProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalysisResponse) => void;
  stats?: SystemStats;
}

export default function SymptomInputPanel({ onAnalysisStart, onAnalysisComplete, stats }: SymptomInputPanelProps) {
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [symptomInput, setSymptomInput] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string[]>(["Dor torácica", "Dispneia"]);
  const { toast } = useToast();

  const analyzeSymptomsMutation = useMutation(mutations.analyzeSymptoms((data) => {
    onAnalysisComplete(data);
    toast({
      title: "Análise concluída",
      description: `${data.suggestions.length} sugestões clínicas geradas`,
    });
  }));

  const addSymptom = () => {
    const symptom = symptomInput.trim();
    if (symptom && !symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
      setSymptomInput("");
    }
  };

  const removeSymptom = (symptomToRemove: string) => {
    setSymptoms(symptoms.filter(s => s !== symptomToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (symptoms.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um sintoma",
        variant: "destructive",
      });
      return;
    }

    if (!age || !gender) {
      toast({
        title: "Erro",
        description: "Idade e sexo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onAnalysisStart();
    
    analyzeSymptomsMutation.mutate({
      symptoms,
      age: parseInt(age),
      gender: gender as "masculino" | "feminino" | "nao_informado",
      location: location || undefined,
      doctorId: "doc-1", // Default doctor ID
    });
  };

  return (
    <div className="space-y-4">
      {/* Patient Data Form */}
      <div className="clinical-card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <i className="fas fa-user-plus text-primary text-lg"></i>
          <h3 className="text-lg font-semibold text-foreground">Dados do Paciente</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-patient-data">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="age" className="text-sm font-medium text-foreground">Idade</Label>
              <Input 
                id="age"
                type="number" 
                placeholder="45" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="0"
                max="120"
                className="mt-1"
                data-testid="input-age"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm font-medium text-foreground">Sexo</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="mt-1" data-testid="select-gender">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="nao_informado">Não informado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="location" className="text-sm font-medium text-foreground">Município (opcional)</Label>
            <Input 
              id="location"
              type="text" 
              placeholder="São Paulo, SP" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1"
              data-testid="input-location"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Sintomas Relatados</Label>
            <div className="flex space-x-2 mb-3">
              <Input 
                type="text" 
                placeholder="Digite um sintoma"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                className="flex-1"
                data-testid="input-symptom"
              />
              <Button 
                type="button" 
                onClick={addSymptom}
                variant="outline"
                data-testid="button-add-symptom"
              >
                Adicionar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4" data-testid="symptoms-list">
              {symptoms.map((symptom) => (
                <span key={symptom} className="symptom-tag" data-testid={`symptom-tag-${symptom}`}>
                  {symptom}
                  <button 
                    type="button" 
                    onClick={() => removeSymptom(symptom)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    data-testid={`button-remove-symptom-${symptom}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={analyzeSymptomsMutation.isPending}
            data-testid="button-analyze-symptoms"
          >
            {analyzeSymptomsMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Analisando...
              </>
            ) : (
              <>
                <i className="fas fa-search mr-2"></i>
                Analisar Sintomas
              </>
            )}
          </Button>
        </form>
      </div>
      
      {/* Quick Stats */}
      <div className="clinical-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Estatísticas do Sistema</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Protocolos ativos</span>
            <span className="font-medium text-foreground" data-testid="stat-active-protocols">
              {stats?.activeProtocols ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sugestões hoje</span>
            <span className="font-medium text-foreground" data-testid="stat-today-suggestions">
              {stats?.todaySuggestions ?? 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Alertas de viés</span>
            <span className="font-medium text-orange-600" data-testid="stat-bias-alerts">
              {stats?.biasAlerts ?? 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
