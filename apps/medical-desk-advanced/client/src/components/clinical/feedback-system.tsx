import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ClinicalSuggestion } from "@shared/schema";

interface FeedbackSystemProps {
  suggestion: ClinicalSuggestion;
  consultationId?: string;
}

interface FeedbackFormData {
  wasHelpful: boolean;
  actualDiagnosis: string;
  missedFindings: string[];
  improvementSuggestion: string;
  confidence: number;
}

export default function FeedbackSystem({ suggestion, consultationId }: FeedbackSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackFormData>({
    wasHelpful: true,
    actualDiagnosis: "",
    missedFindings: [],
    improvementSuggestion: "",
    confidence: 4,
  });
  const [newFinding, setNewFinding] = useState("");
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao enviar feedback");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback enviado",
        description: "Obrigado por ajudar a melhorar o sistema!",
      });
      setIsOpen(false);
      // Reset form
      setFeedback({
        wasHelpful: true,
        actualDiagnosis: "",
        missedFindings: [],
        improvementSuggestion: "",
        confidence: 4,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o feedback",
        variant: "destructive",
      });
    },
  });

  const handleQuickFeedback = (helpful: boolean) => {
    submitFeedbackMutation.mutate({
      suggestionId: suggestion.id,
      consultationId,
      wasHelpful: helpful,
      doctorId: "doc-1",
      confidence: helpful ? 4 : 2,
    });
  };

  const addMissedFinding = () => {
    if (newFinding.trim()) {
      setFeedback(prev => ({
        ...prev,
        missedFindings: [...prev.missedFindings, newFinding.trim()]
      }));
      setNewFinding("");
    }
  };

  const removeMissedFinding = (index: number) => {
    setFeedback(prev => ({
      ...prev,
      missedFindings: prev.missedFindings.filter((_, i) => i !== index)
    }));
  };

  const handleDetailedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitFeedbackMutation.mutate({
      suggestionId: suggestion.id,
      consultationId,
      wasHelpful: feedback.wasHelpful,
      actualDiagnosis: feedback.actualDiagnosis || undefined,
      missedFindings: feedback.missedFindings.length > 0 ? feedback.missedFindings : undefined,
      improvementSuggestion: feedback.improvementSuggestion || undefined,
      confidence: feedback.confidence,
      doctorId: "doc-1",
    });
  };

  return (
    <div className="flex items-center space-x-2 mt-3" data-testid={`feedback-${suggestion.id}`}>
      {/* Quick Feedback Buttons */}
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback(true)}
          disabled={submitFeedbackMutation.isPending}
          data-testid={`button-helpful-${suggestion.id}`}
          className="text-xs py-1 px-2 h-7"
        >
          <i className="fas fa-thumbs-up text-green-600 mr-1"></i>
          Útil
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickFeedback(false)}
          disabled={submitFeedbackMutation.isPending}
          data-testid={`button-not-helpful-${suggestion.id}`}
          className="text-xs py-1 px-2 h-7"
        >
          <i className="fas fa-thumbs-down text-red-600 mr-1"></i>
          Não útil
        </Button>
      </div>

      {/* Detailed Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-detailed-feedback-${suggestion.id}`}
            className="text-xs py-1 px-2 h-7 text-muted-foreground hover:text-foreground"
          >
            <i className="fas fa-comment-medical mr-1"></i>
            Detalhado
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-stethoscope text-primary mr-2"></i>
              Feedback Clínico Detalhado
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleDetailedSubmit} className="space-y-4 mt-4">
            {/* Suggestion Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 text-sm">{suggestion.title}</h4>
              <p className="text-blue-700 text-xs mt-1">{suggestion.description}</p>
            </div>

            {/* Was Helpful */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Esta sugestão foi útil?</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={feedback.wasHelpful}
                    onCheckedChange={(checked) => setFeedback(prev => ({ ...prev, wasHelpful: !!checked }))}
                  />
                  <span className="text-sm">Sim, foi útil</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={!feedback.wasHelpful}
                    onCheckedChange={(checked) => setFeedback(prev => ({ ...prev, wasHelpful: !checked }))}
                  />
                  <span className="text-sm">Não foi útil</span>
                </label>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="space-y-2">
              <Label htmlFor="confidence" className="text-sm font-medium">
                Nível de confiança na sugestão (1-5)
              </Label>
              <Select 
                value={feedback.confidence.toString()} 
                onValueChange={(value) => setFeedback(prev => ({ ...prev, confidence: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Muito baixa</SelectItem>
                  <SelectItem value="2">2 - Baixa</SelectItem>
                  <SelectItem value="3">3 - Média</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Muito alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actual Diagnosis */}
            <div className="space-y-2">
              <Label htmlFor="actual-diagnosis" className="text-sm font-medium">
                Diagnóstico real (opcional)
              </Label>
              <Input
                id="actual-diagnosis"
                placeholder="Ex: Pneumonia adquirida na comunidade"
                value={feedback.actualDiagnosis}
                onChange={(e) => setFeedback(prev => ({ ...prev, actualDiagnosis: e.target.value }))}
              />
            </div>

            {/* Missed Findings */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Achados importantes não mencionados</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ex: Ausculta de estertores"
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMissedFinding())}
                />
                <Button type="button" size="sm" onClick={addMissedFinding}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {feedback.missedFindings.map((finding, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                    {finding}
                    <button
                      type="button"
                      onClick={() => removeMissedFinding(index)}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Improvement Suggestion */}
            <div className="space-y-2">
              <Label htmlFor="improvement" className="text-sm font-medium">
                Sugestão de melhoria (opcional)
              </Label>
              <Textarea
                id="improvement"
                placeholder="Como o sistema poderia ter sido mais preciso ou útil?"
                value={feedback.improvementSuggestion}
                onChange={(e) => setFeedback(prev => ({ ...prev, improvementSuggestion: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitFeedbackMutation.isPending}
                data-testid="button-submit-feedback"
              >
                {submitFeedbackMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Enviar Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}