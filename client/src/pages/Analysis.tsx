import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { 
  Brain, Loader2, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, Shield, Target, Clock, ArrowRight
} from "lucide-react";
import { useSearchParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

function AnalysisContent() {
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get("caseId");
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || "");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const { data: cases, isLoading: loadingCases } = trpc.cases.list.useQuery();
  const { data: existingAnalysis, refetch: refetchAnalysis } = trpc.analysis.getLatest.useQuery(
    { caseId: Number(selectedCaseId) },
    { enabled: !!selectedCaseId }
  );

  const analyzeMutation = trpc.analysis.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success("Análise preditiva concluída!");
      refetchAnalysis();
    },
    onError: (error) => {
      toast.error("Erro na análise: " + error.message);
    }
  });

  useEffect(() => {
    if (existingAnalysis) {
      setAnalysisResult(existingAnalysis);
    }
  }, [existingAnalysis]);

  const handleAnalyze = () => {
    if (!selectedCaseId) {
      toast.error("Selecione um caso para analisar");
      return;
    }
    analyzeMutation.mutate({ caseId: Number(selectedCaseId) });
  };

  const selectedCase = cases?.find(c => c.id === Number(selectedCaseId));

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return "probability-high";
    if (prob >= 40) return "probability-medium";
    return "probability-low";
  };

  const getProbabilityBg = (prob: number) => {
    if (prob >= 70) return "bg-green-500";
    if (prob >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          Análise Preditiva com IA
        </h1>
        <p className="text-muted-foreground">
          Utilize inteligência artificial para prever resultados e definir estratégias
        </p>
      </div>

      {/* Case Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione o Caso</CardTitle>
          <CardDescription>
            Escolha um caso cadastrado para realizar a análise preditiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select 
              value={selectedCaseId} 
              onValueChange={(value) => {
                setSelectedCaseId(value);
                setAnalysisResult(null);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um caso..." />
              </SelectTrigger>
              <SelectContent>
                {cases?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.title} {c.caseNumber && `(${c.caseNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAnalyze}
              disabled={!selectedCaseId || analyzeMutation.isPending}
              className="gap-2"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Analisar Caso
                </>
              )}
            </Button>
          </div>

          {selectedCase && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">{selectedCase.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCase.category} • {selectedCase.jurisdiction}
              </p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {selectedCase.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="grid gap-6">
          {/* Success Probability */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Probabilidade de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className={`text-6xl font-bold ${getProbabilityColor(Number(analysisResult.successProbability))}`}>
                  {analysisResult.successProbability}%
                </div>
                <div className="flex-1">
                  <Progress 
                    value={Number(analysisResult.successProbability)} 
                    className="h-4"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Baseado na análise de jurisprudência e dados do caso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reasoning */}
          <Card>
            <CardHeader>
              <CardTitle>Raciocínio Jurídico</CardTitle>
              <CardDescription>Fundamentação da análise preditiva</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <Streamdown>{analysisResult.reasoning}</Streamdown>
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Pontos Fortes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.strengths?.map((strength: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Pontos Fracos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.weaknesses?.map((weakness: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                      <span className="text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Risks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Riscos Identificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {analysisResult.risks?.map((risk: any, i: number) => (
                  <AccordionItem key={i} value={`risk-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          risk.impact === "Alto" ? "destructive" :
                          risk.impact === "Médio" ? "default" : "secondary"
                        }>
                          {risk.impact}
                        </Badge>
                        <span>{risk.description}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h5 className="font-medium mb-2">Mitigação Sugerida:</h5>
                        <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Estratégia Processual Recomendada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.strategy?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {i + 1}
                      </div>
                      {i < analysisResult.strategy.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <h4 className="font-semibold">{step.phase}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.action}</p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Objetivo:</span> {step.objective}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Duration Estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Estimativa de Duração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  {analysisResult.estimatedDurationMonths} meses
                </div>
                <p className="text-muted-foreground">
                  Tempo estimado até a conclusão do processo, considerando o trâmite normal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => window.location.href = `/simulator?caseId=${selectedCaseId}`}>
              Simular Audiência <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysisResult && !analyzeMutation.isPending && (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma análise realizada</h3>
            <p className="text-muted-foreground mb-4">
              Selecione um caso e clique em "Analisar Caso" para obter uma análise preditiva completa
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Analysis() {
  return (
    <DashboardLayout>
      <AnalysisContent />
    </DashboardLayout>
  );
}
