import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageSquare, Loader2, User, Scale, AlertCircle,
  Lightbulb, ChevronRight, RefreshCw
} from "lucide-react";
import { useSearchParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const temperamentLabels: Record<string, { label: string; color: string; description: string }> = {
  conciliatory: { 
    label: "Conciliatório", 
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    description: "Tendência a buscar acordos e soluções consensuais"
  },
  technical: { 
    label: "Técnico", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    description: "Foco em aspectos processuais e fundamentação legal"
  },
  contentious: { 
    label: "Contencioso", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    description: "Ambiente mais adversarial, debates intensos esperados"
  },
  neutral: { 
    label: "Neutro", 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    description: "Sem indicadores claros de tendência"
  }
};

function SimulatorContent() {
  const [searchParams] = useSearchParams();
  const initialCaseId = searchParams.get("caseId");
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || "");
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const { data: cases } = trpc.cases.list.useQuery();
  const { data: existingSimulations } = trpc.simulation.getByCase.useQuery(
    { caseId: Number(selectedCaseId) },
    { enabled: !!selectedCaseId }
  );

  const simulateMutation = trpc.simulation.generate.useMutation({
    onSuccess: (data) => {
      setSimulationResult(data);
      toast.success("Simulação de audiência gerada!");
    },
    onError: (error) => {
      toast.error("Erro na simulação: " + error.message);
    }
  });

  useEffect(() => {
    if (existingSimulations && existingSimulations.length > 0) {
      setSimulationResult(existingSimulations[0]);
    }
  }, [existingSimulations]);

  const handleSimulate = () => {
    if (!selectedCaseId) {
      toast.error("Selecione um caso para simular");
      return;
    }
    simulateMutation.mutate({ caseId: Number(selectedCaseId) });
  };

  const selectedCase = cases?.find(c => c.id === Number(selectedCaseId));
  const temperament = simulationResult?.predictedTemperament 
    ? temperamentLabels[simulationResult.predictedTemperament] 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          Simulador de Audiência
        </h1>
        <p className="text-muted-foreground">
          Prepare-se para audiências com simulações de perguntas e respostas estratégicas
        </p>
      </div>

      {/* Case Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione o Caso</CardTitle>
          <CardDescription>
            Escolha um caso para gerar a simulação de audiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select 
              value={selectedCaseId} 
              onValueChange={(value) => {
                setSelectedCaseId(value);
                setSimulationResult(null);
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
              onClick={handleSimulate}
              disabled={!selectedCaseId || simulateMutation.isPending}
              className="gap-2"
            >
              {simulateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : simulationResult ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Nova Simulação
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Gerar Simulação
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Result */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Predicted Temperament */}
          {temperament && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Clima Previsto da Audiência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className={`${temperament.color} text-lg px-4 py-2`}>
                    {temperament.label}
                  </Badge>
                  <p className="text-muted-foreground">{temperament.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions Tabs */}
          <Tabs defaultValue="judge" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="judge" className="gap-2">
                <Scale className="h-4 w-4" />
                Perguntas do Juiz
              </TabsTrigger>
              <TabsTrigger value="opposing" className="gap-2">
                <User className="h-4 w-4" />
                Parte Contrária
              </TabsTrigger>
              <TabsTrigger value="objections" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Pontos de Objeção
              </TabsTrigger>
            </TabsList>

            {/* Judge Questions */}
            <TabsContent value="judge">
              <Card>
                <CardHeader>
                  <CardTitle>Perguntas Prováveis do Juiz</CardTitle>
                  <CardDescription>
                    Prepare-se para estas perguntas que podem ser feitas pelo magistrado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {simulationResult.judgeQuestions?.map((q: any, i: number) => (
                      <AccordionItem key={i} value={`judge-${i}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                              {i + 1}
                            </div>
                            <span>{q.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="ml-11 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                              <Lightbulb className="h-4 w-4" />
                              Resposta Sugerida:
                            </div>
                            <p className="text-sm">{q.suggestedAnswer}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Opposing Party Questions */}
            <TabsContent value="opposing">
              <Card>
                <CardHeader>
                  <CardTitle>Perguntas da Parte Contrária</CardTitle>
                  <CardDescription>
                    Antecipe as perguntas e argumentos que a parte contrária pode levantar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {simulationResult.opposingQuestions?.map((q: any, i: number) => (
                      <AccordionItem key={i} value={`opposing-${i}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-semibold shrink-0">
                              {i + 1}
                            </div>
                            <span>{q.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="ml-11 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium mb-2">
                              <Lightbulb className="h-4 w-4" />
                              Resposta Estratégica:
                            </div>
                            <p className="text-sm">{q.suggestedAnswer}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objection Points */}
            <TabsContent value="objections">
              <Card>
                <CardHeader>
                  <CardTitle>Pontos de Objeção</CardTitle>
                  <CardDescription>
                    Objeções que você pode levantar durante a audiência
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {simulationResult.objectionPoints?.map((obj: any, i: number) => (
                      <Card key={i} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                {obj.point}
                              </h4>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Fundamento Legal:
                                </p>
                                <p className="text-sm">{obj.basis}</p>
                              </div>
                              <div className="p-3 bg-primary/5 rounded-lg">
                                <p className="text-xs font-medium text-primary mb-1">
                                  Como Responder:
                                </p>
                                <p className="text-sm">{obj.response}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Strategic Notes */}
          {simulationResult.strategicNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Notas Estratégicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm whitespace-pre-wrap">{simulationResult.strategicNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!simulationResult && !simulateMutation.isPending && (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma simulação realizada</h3>
            <p className="text-muted-foreground mb-4">
              Selecione um caso e clique em "Gerar Simulação" para preparar-se para a audiência
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Simulator() {
  return (
    <DashboardLayout>
      <SimulatorContent />
    </DashboardLayout>
  );
}
