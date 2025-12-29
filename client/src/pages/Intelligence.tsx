import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  Eye,
  Scale,
  Heart,
  Calendar,
  Calculator,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Gavel,
  Search,
  Brain,
  Zap,
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Shield,
  Sparkles
} from "lucide-react";

export default function Intelligence() {
  const [activeTab, setActiveTab] = useState("olho-da-lei");
  
  // Olho da Lei state
  const [jurisprudenciaQuery, setJurisprudenciaQuery] = useState({
    casoDescricao: "",
    categoria: "",
    tesesPrincipais: ""
  });
  const [jurisprudenciaResults, setJurisprudenciaResults] = useState<any[]>([]);
  
  // Match de Juízes state
  const [juizQuery, setJuizQuery] = useState({
    nomeJuiz: "",
    tribunal: "",
    vara: ""
  });
  const [perfilJuiz, setPerfilJuiz] = useState<any>(null);
  
  // Health Score state
  const [healthScoreInput, setHealthScoreInput] = useState({
    caseId: 1,
    prazosCumpridos: 80,
    documentacaoCompleta: 70,
    jurisprudenciaFavoravel: 60,
    complexidade: 5,
    diasSemMovimentacao: 10
  });
  const [healthScoreResult, setHealthScoreResult] = useState<any>(null);
  
  // Calculadora de Honorários state
  const [honorariosInput, setHonorariosInput] = useState({
    tipoAcao: "",
    valorCausa: 0,
    complexidade: 5,
    tribunal: "",
    tempoEstimadoMeses: 12
  });
  const [honorariosResult, setHonorariosResult] = useState<any>(null);

  // Mutations
  const analisarJurisprudenciaMutation = trpc.intelligence.analisarJurisprudencia.useMutation({
    onSuccess: (data) => {
      setJurisprudenciaResults(data);
      toast.success("Análise de jurisprudência concluída!");
    },
    onError: (error) => {
      toast.error("Erro ao analisar jurisprudência: " + error.message);
    }
  });

  const analisarPerfilJuizMutation = trpc.intelligence.analisarPerfilJuiz.useMutation({
    onSuccess: (data) => {
      setPerfilJuiz(data);
      toast.success("Perfil do juiz analisado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao analisar perfil do juiz: " + error.message);
    }
  });

  const calcularHonorariosMutation = trpc.intelligence.calcularHonorarios.useMutation({
    onSuccess: (data) => {
      setHonorariosResult(data);
      toast.success("Honorários calculados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao calcular honorários: " + error.message);
    }
  });

  // Health Score Query
  const healthScoreQuery = trpc.intelligence.calcularHealthScore.useQuery(healthScoreInput, {
    enabled: false
  });

  const handleCalcularHealthScore = async () => {
    const result = await healthScoreQuery.refetch();
    if (result.data) {
      setHealthScoreResult(result.data);
      toast.success("Health Score calculado!");
    }
  };

  const handleAnalisarJurisprudencia = () => {
    const teses = jurisprudenciaQuery.tesesPrincipais.split('\n').filter(t => t.trim());
    analisarJurisprudenciaMutation.mutate({
      casoDescricao: jurisprudenciaQuery.casoDescricao,
      categoria: jurisprudenciaQuery.categoria,
      tesesPrincipais: teses
    });
  };

  const handleAnalisarPerfilJuiz = () => {
    analisarPerfilJuizMutation.mutate(juizQuery);
  };

  const handleCalcularHonorarios = () => {
    calcularHonorariosMutation.mutate(honorariosInput);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'melhorando': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'piorando': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Inteligência Avançada
            </h1>
            <p className="text-muted-foreground mt-1">
              Ferramentas de IA para análise preditiva, perfil de juízes e estratégia processual
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by AI
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="olho-da-lei" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Olho da Lei</span>
            </TabsTrigger>
            <TabsTrigger value="match-juizes" className="flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">Match de Juízes</span>
            </TabsTrigger>
            <TabsTrigger value="health-score" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health Score</span>
            </TabsTrigger>
            <TabsTrigger value="radar-prazos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Radar de Prazos</span>
            </TabsTrigger>
            <TabsTrigger value="honorarios" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Honorários</span>
            </TabsTrigger>
          </TabsList>

          {/* Olho da Lei */}
          <TabsContent value="olho-da-lei" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Monitoramento de Jurisprudência
                  </CardTitle>
                  <CardDescription>
                    Analise jurisprudência relevante dos tribunais superiores (STF, STJ) e estaduais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição do Caso</Label>
                    <Textarea
                      placeholder="Descreva os fatos e questões jurídicas do caso..."
                      value={jurisprudenciaQuery.casoDescricao}
                      onChange={(e) => setJurisprudenciaQuery(prev => ({ ...prev, casoDescricao: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={jurisprudenciaQuery.categoria}
                      onValueChange={(value) => setJurisprudenciaQuery(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="criminal">Criminal</SelectItem>
                        <SelectItem value="tributario">Tributário</SelectItem>
                        <SelectItem value="consumidor">Consumidor</SelectItem>
                        <SelectItem value="familia">Família</SelectItem>
                        <SelectItem value="previdenciario">Previdenciário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Teses Principais (uma por linha)</Label>
                    <Textarea
                      placeholder="Digite as teses principais, uma por linha..."
                      value={jurisprudenciaQuery.tesesPrincipais}
                      onChange={(e) => setJurisprudenciaQuery(prev => ({ ...prev, tesesPrincipais: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAnalisarJurisprudencia}
                    disabled={analisarJurisprudenciaMutation.isPending || !jurisprudenciaQuery.casoDescricao || !jurisprudenciaQuery.categoria}
                    className="w-full"
                  >
                    {analisarJurisprudenciaMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Analisar Jurisprudência
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultados da Análise</CardTitle>
                  <CardDescription>
                    Jurisprudências relevantes encontradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {jurisprudenciaResults.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma análise realizada ainda.</p>
                        <p className="text-sm">Preencha os dados e clique em analisar.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jurisprudenciaResults.map((juris, index) => (
                          <Card key={index} className="border-l-4" style={{ borderLeftColor: juris.impacto === 'favoravel' ? '#22c55e' : juris.impacto === 'desfavoravel' ? '#ef4444' : '#eab308' }}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline">{juris.tribunal}</Badge>
                                <Badge variant={juris.impacto === 'favoravel' ? 'default' : juris.impacto === 'desfavoravel' ? 'destructive' : 'secondary'}>
                                  {juris.impacto === 'favoravel' ? 'Favorável' : juris.impacto === 'desfavoravel' ? 'Desfavorável' : 'Neutro'}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mb-1">{juris.numeroProcesso}</p>
                              <p className="text-sm text-muted-foreground mb-2">{juris.ementa}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Relevância:</span>
                                <Progress value={juris.relevancia} className="h-2 flex-1" />
                                <span className="text-xs font-medium">{juris.relevancia}%</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Match de Juízes */}
          <TabsContent value="match-juizes" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    Análise de Perfil Judicial
                  </CardTitle>
                  <CardDescription>
                    Analise o perfil decisório de magistrados para estratégia processual
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Juiz</Label>
                    <Input
                      placeholder="Ex: Dr. João Silva"
                      value={juizQuery.nomeJuiz}
                      onChange={(e) => setJuizQuery(prev => ({ ...prev, nomeJuiz: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Select
                      value={juizQuery.tribunal}
                      onValueChange={(value) => setJuizQuery(prev => ({ ...prev, tribunal: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tribunal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TJSP">TJSP - São Paulo</SelectItem>
                        <SelectItem value="TJMG">TJMG - Minas Gerais</SelectItem>
                        <SelectItem value="TJRJ">TJRJ - Rio de Janeiro</SelectItem>
                        <SelectItem value="TJBA">TJBA - Bahia</SelectItem>
                        <SelectItem value="TJRS">TJRS - Rio Grande do Sul</SelectItem>
                        <SelectItem value="TRT">TRT - Trabalho</SelectItem>
                        <SelectItem value="TRF">TRF - Federal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vara</Label>
                    <Input
                      placeholder="Ex: 1ª Vara Cível"
                      value={juizQuery.vara}
                      onChange={(e) => setJuizQuery(prev => ({ ...prev, vara: e.target.value }))}
                    />
                  </div>
                  <Button 
                    onClick={handleAnalisarPerfilJuiz}
                    disabled={analisarPerfilJuizMutation.isPending || !juizQuery.nomeJuiz || !juizQuery.tribunal || !juizQuery.vara}
                    className="w-full"
                  >
                    {analisarPerfilJuizMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando Perfil...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Analisar Perfil do Juiz
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Perfil do Magistrado</CardTitle>
                  <CardDescription>
                    Análise detalhada do perfil decisório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!perfilJuiz ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum perfil analisado ainda.</p>
                      <p className="text-sm">Preencha os dados e clique em analisar.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{perfilJuiz.nome}</h3>
                          <p className="text-sm text-muted-foreground">{perfilJuiz.vara} - {perfilJuiz.tribunal}</p>
                        </div>
                        <Badge>{perfilJuiz.especialidade}</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{perfilJuiz.taxaAceitacao.geral}%</p>
                          <p className="text-xs text-muted-foreground">Taxa de Aceitação</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{perfilJuiz.tempoMedioDecisao}</p>
                          <p className="text-xs text-muted-foreground">Dias p/ Decisão</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Taxa por Tipo de Ação</h4>
                        {Object.entries(perfilJuiz.taxaAceitacao.porTipo).map(([tipo, taxa]) => (
                          <div key={tipo} className="flex items-center gap-2">
                            <span className="text-xs capitalize w-24">{tipo}</span>
                            <Progress value={taxa as number} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10">{taxa as number}%</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Padrões Identificados</h4>
                        <div className="flex flex-wrap gap-2">
                          {perfilJuiz.padroes.prefereTutela && (
                            <Badge variant="outline" className="text-green-600">Prefere Tutela</Badge>
                          )}
                          {perfilJuiz.padroes.exigeProvaPericial && (
                            <Badge variant="outline" className="text-yellow-600">Exige Perícia</Badge>
                          )}
                          {perfilJuiz.padroes.aceitaAcordos && (
                            <Badge variant="outline" className="text-blue-600">Aceita Acordos</Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Teses Preferidas</h4>
                        <div className="flex flex-wrap gap-1">
                          {perfilJuiz.tesesPreferidas.map((tese: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{tese}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Health Score */}
          <TabsContent value="health-score" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Health Score do Caso
                  </CardTitle>
                  <CardDescription>
                    Avalie a saúde processual do seu caso com base em múltiplos fatores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prazos Cumpridos (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={healthScoreInput.prazosCumpridos}
                      onChange={(e) => setHealthScoreInput(prev => ({ ...prev, prazosCumpridos: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Documentação Completa (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={healthScoreInput.documentacaoCompleta}
                      onChange={(e) => setHealthScoreInput(prev => ({ ...prev, documentacaoCompleta: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jurisprudência Favorável (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={healthScoreInput.jurisprudenciaFavoravel}
                      onChange={(e) => setHealthScoreInput(prev => ({ ...prev, jurisprudenciaFavoravel: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Complexidade (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={healthScoreInput.complexidade}
                      onChange={(e) => setHealthScoreInput(prev => ({ ...prev, complexidade: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias sem Movimentação</Label>
                    <Input
                      type="number"
                      min="0"
                      value={healthScoreInput.diasSemMovimentacao}
                      onChange={(e) => setHealthScoreInput(prev => ({ ...prev, diasSemMovimentacao: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <Button 
                    onClick={handleCalcularHealthScore}
                    disabled={healthScoreQuery.isFetching}
                    className="w-full"
                  >
                    {healthScoreQuery.isFetching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Calcular Health Score
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultado do Health Score</CardTitle>
                  <CardDescription>
                    Análise detalhada da saúde processual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!healthScoreResult ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum score calculado ainda.</p>
                      <p className="text-sm">Preencha os dados e clique em calcular.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-6xl font-bold ${getScoreColor(healthScoreResult.score)}`}>
                          {healthScoreResult.score}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {getTendenciaIcon(healthScoreResult.tendencia)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {healthScoreResult.tendencia}
                          </span>
                        </div>
                        <Progress 
                          value={healthScoreResult.score} 
                          className={`h-3 mt-4 ${getScoreBg(healthScoreResult.score)}`}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Fatores Analisados</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prazos:</span>
                            <span className="font-medium">{healthScoreResult.fatores.prazosCumpridos}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Documentação:</span>
                            <span className="font-medium">{healthScoreResult.fatores.documentacaoCompleta}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Jurisprudência:</span>
                            <span className="font-medium">{healthScoreResult.fatores.jurisprudenciaFavoravel}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Risco de Perda:</span>
                            <span className="font-medium text-red-500">{healthScoreResult.fatores.riscoPerda}%</span>
                          </div>
                        </div>
                      </div>

                      {healthScoreResult.alertas.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Alertas
                          </h4>
                          <ul className="text-sm space-y-1">
                            {healthScoreResult.alertas.map((alerta: string, i: number) => (
                              <li key={i} className="text-yellow-600 flex items-start gap-2">
                                <span>•</span>
                                <span>{alerta}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {healthScoreResult.recomendacoes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Recomendações
                          </h4>
                          <ul className="text-sm space-y-1">
                            {healthScoreResult.recomendacoes.map((rec: string, i: number) => (
                              <li key={i} className="text-green-600 flex items-start gap-2">
                                <span>•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Radar de Prazos */}
          <TabsContent value="radar-prazos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Radar de Prazos Cruzados
                </CardTitle>
                <CardDescription>
                  Detecta conflitos entre audiências e prazos de diferentes processos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Detecção Automática de Conflitos</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    O radar analisa automaticamente todos os seus prazos e audiências cadastrados para detectar conflitos de agenda.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Conflito Alto</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Conflito Médio</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Sem Conflitos</span>
                    </div>
                  </div>
                  <Button className="mt-6" variant="outline" asChild>
                    <a href="/deadlines">
                      <Clock className="mr-2 h-4 w-4" />
                      Ver Prazos Cadastrados
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculadora de Honorários */}
          <TabsContent value="honorarios" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Calculadora de Honorários Preditiva
                  </CardTitle>
                  <CardDescription>
                    Calcule honorários baseados em complexidade, valor da causa e histórico de mercado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Ação</Label>
                    <Select
                      value={honorariosInput.tipoAcao}
                      onValueChange={(value) => setHonorariosInput(prev => ({ ...prev, tipoAcao: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indenizatoria">Ação Indenizatória</SelectItem>
                        <SelectItem value="cobranca">Ação de Cobrança</SelectItem>
                        <SelectItem value="trabalhista">Reclamação Trabalhista</SelectItem>
                        <SelectItem value="divorcio">Divórcio</SelectItem>
                        <SelectItem value="inventario">Inventário</SelectItem>
                        <SelectItem value="execucao">Execução</SelectItem>
                        <SelectItem value="mandado_seguranca">Mandado de Segurança</SelectItem>
                        <SelectItem value="habeas_corpus">Habeas Corpus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Causa (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={honorariosInput.valorCausa}
                      onChange={(e) => setHonorariosInput(prev => ({ ...prev, valorCausa: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Complexidade (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={honorariosInput.complexidade}
                      onChange={(e) => setHonorariosInput(prev => ({ ...prev, complexidade: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Select
                      value={honorariosInput.tribunal}
                      onValueChange={(value) => setHonorariosInput(prev => ({ ...prev, tribunal: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tribunal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TJSP">TJSP - São Paulo</SelectItem>
                        <SelectItem value="TJMG">TJMG - Minas Gerais</SelectItem>
                        <SelectItem value="TJRJ">TJRJ - Rio de Janeiro</SelectItem>
                        <SelectItem value="TRT">TRT - Trabalho</SelectItem>
                        <SelectItem value="TRF">TRF - Federal</SelectItem>
                        <SelectItem value="STJ">STJ - Superior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo Estimado (meses)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={honorariosInput.tempoEstimadoMeses}
                      onChange={(e) => setHonorariosInput(prev => ({ ...prev, tempoEstimadoMeses: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <Button 
                    onClick={handleCalcularHonorarios}
                    disabled={calcularHonorariosMutation.isPending || !honorariosInput.tipoAcao || !honorariosInput.tribunal}
                    className="w-full"
                  >
                    {calcularHonorariosMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Calcular Honorários
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Previsão de Honorários</CardTitle>
                  <CardDescription>
                    Valores sugeridos com base em análise de mercado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!honorariosResult ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum cálculo realizado ainda.</p>
                      <p className="text-sm">Preencha os dados e clique em calcular.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Valor Sugerido</p>
                        <p className="text-4xl font-bold text-primary">
                          R$ {honorariosResult.valorSugerido.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Faixa: R$ {honorariosResult.faixaMinima.toLocaleString('pt-BR')} - R$ {honorariosResult.faixaMaxima.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Comparativo de Mercado</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Seu valor</span>
                              <span className="font-medium">Percentil {honorariosResult.comparativoMercado.percentil}%</span>
                            </div>
                            <Progress value={honorariosResult.comparativoMercado.percentil} className="h-2" />
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Média de mercado: R$ {honorariosResult.comparativoMercado.mediaMercado.toLocaleString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Confiança da Previsão</span>
                        <Badge variant={honorariosResult.confianca >= 80 ? "default" : honorariosResult.confianca >= 60 ? "secondary" : "outline"}>
                          {honorariosResult.confianca}%
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Fatores Considerados</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="ml-1 font-medium capitalize">{honorariosResult.fatoresConsiderados.tipoAcao.replace('_', ' ')}</span>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Tribunal:</span>
                            <span className="ml-1 font-medium">{honorariosResult.fatoresConsiderados.tribunal}</span>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Complexidade:</span>
                            <span className="ml-1 font-medium">{honorariosResult.fatoresConsiderados.complexidade}/10</span>
                          </div>
                          <div className="p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Tempo:</span>
                            <span className="ml-1 font-medium">{honorariosResult.fatoresConsiderados.tempoEstimado} meses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
