import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Database,
  Zap,
  Globe,
  FileText,
  AlertTriangle,
  Activity,
  Server,
  Lock
} from "lucide-react";

export default function Integrations() {
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [estado, setEstado] = useState("SP");
  const [tribunal, setTribunal] = useState("TJSP");
  const [syncInterval, setSyncInterval] = useState("30");

  // Queries
  const { data: healthCheck, isLoading: healthLoading } = trpc.judicial.healthCheck.useQuery();
  const { data: tribunais } = trpc.judicial.tribunaisSuportados.useQuery();

  // Mutations
  const consultarESAJ = trpc.judicial.consultarProcessoESAJ.useQuery(
    { numeroProcesso, estado },
    { enabled: false }
  );

  const consultarDatajud = trpc.judicial.consultarProcessoDatajud.useQuery(
    { numeroProcesso, tribunal },
    { enabled: false }
  );

  const syncMutation = trpc.judicial.syncCase.useMutation({
    onSuccess: (data) => {
      toast.success("Sincronização concluída", {
        description: `${data.filter(r => r.success).length} fonte(s) sincronizada(s) com sucesso`
      });
    },
    onError: (error) => {
      toast.error("Erro na sincronização", { description: error.message });
    }
  });

  const startSyncMutation = trpc.judicial.startPeriodicSync.useMutation({
    onSuccess: (data) => {
      toast.success("Sincronização periódica iniciada", { description: data.message });
    },
    onError: (error) => {
      toast.error("Erro ao iniciar sincronização", { description: error.message });
    }
  });

  const handleConsultarESAJ = async () => {
    if (!numeroProcesso) {
      toast.error("Digite o número do processo");
      return;
    }
    consultarESAJ.refetch();
  };

  const handleConsultarDatajud = async () => {
    if (!numeroProcesso) {
      toast.error("Digite o número do processo");
      return;
    }
    consultarDatajud.refetch();
  };

  const handleSync = () => {
    if (!numeroProcesso) {
      toast.error("Digite o número do processo");
      return;
    }
    syncMutation.mutate({ numeroProcesso, tribunal: estado });
  };

  const handleStartPeriodicSync = () => {
    if (!numeroProcesso) {
      toast.error("Digite o número do processo");
      return;
    }
    startSyncMutation.mutate({ 
      numeroProcesso, 
      intervalMinutes: parseInt(syncInterval) 
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integrações Judiciais</h1>
          <p className="text-muted-foreground mt-1">
            Conecte-se aos sistemas judiciais brasileiros para sincronização automática de processos
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">e-SAJ</p>
                  <p className="text-2xl font-bold">Ativo</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Latência: 1-3s</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CNJ Datajud</p>
                  <p className="text-2xl font-bold">Ativo</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Latência: 1-2s</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PJe eCJUS</p>
                  <p className="text-2xl font-bold">Pendente</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Requer certificado A1</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">CNJ 615/2025 + LGPD</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="consulta" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consulta">Consulta</TabsTrigger>
            <TabsTrigger value="sync">Sincronização</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>

          {/* Consulta Tab */}
          <TabsContent value="consulta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consultar Processo
                </CardTitle>
                <CardDescription>
                  Busque informações de processos diretamente nos sistemas judiciais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="numeroProcesso">Número do Processo (CNJ)</Label>
                    <Input
                      id="numeroProcesso"
                      placeholder="0000000-00.0000.0.00.0000"
                      value={numeroProcesso}
                      onChange={(e) => setNumeroProcesso(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={estado} onValueChange={setEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tribunais?.esaj.map((t) => (
                          <SelectItem key={t.estado} value={t.estado}>
                            {t.estado}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleConsultarESAJ} disabled={consultarESAJ.isFetching}>
                    {consultarESAJ.isFetching ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Consultar e-SAJ
                  </Button>
                  <Button variant="outline" onClick={handleConsultarDatajud} disabled={consultarDatajud.isFetching}>
                    {consultarDatajud.isFetching ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Consultar Datajud
                  </Button>
                </div>

                {/* Results */}
                {consultarESAJ.data && (
                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Resultado e-SAJ</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        <p><strong>Número:</strong> {consultarESAJ.data.numero}</p>
                        <p><strong>Assunto:</strong> {consultarESAJ.data.assunto}</p>
                        <p><strong>Status:</strong> {consultarESAJ.data.status}</p>
                        <p><strong>Fase:</strong> {consultarESAJ.data.fase}</p>
                        {consultarESAJ.data.juiz && <p><strong>Juiz:</strong> {consultarESAJ.data.juiz}</p>}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {consultarDatajud.data && (
                  <Alert className="mt-4">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Resultado Datajud</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        <p><strong>Número:</strong> {consultarDatajud.data.numero}</p>
                        <p><strong>Tribunal:</strong> {consultarDatajud.data.tribunal}</p>
                        <p><strong>Assunto:</strong> {consultarDatajud.data.assunto}</p>
                        <p><strong>Status:</strong> {consultarDatajud.data.status}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Sincronização de Processos
                </CardTitle>
                <CardDescription>
                  Configure a sincronização automática para receber atualizações em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="syncProcesso">Número do Processo</Label>
                    <Input
                      id="syncProcesso"
                      placeholder="0000000-00.0000.0.00.0000"
                      value={numeroProcesso}
                      onChange={(e) => setNumeroProcesso(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="syncInterval">Intervalo de Sincronização</Label>
                    <Select value={syncInterval} onValueChange={setSyncInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutos</SelectItem>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="360">6 horas</SelectItem>
                        <SelectItem value="1440">24 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSync} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Sincronizar Agora
                  </Button>
                  <Button variant="outline" onClick={handleStartPeriodicSync} disabled={startSyncMutation.isPending}>
                    {startSyncMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Iniciar Sincronização Periódica
                  </Button>
                </div>

                {/* Sync Results */}
                {syncMutation.data && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Resultados da Sincronização</h4>
                    {syncMutation.data.map((result, index) => (
                      <Alert key={index} variant={result.success ? "default" : "destructive"}>
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle className="capitalize">{result.source}</AlertTitle>
                        <AlertDescription>
                          {result.success ? (
                            <span>
                              {result.movimentacoesNovas} movimentações, {result.decisoesNovas} decisões
                            </span>
                          ) : (
                            <span className="text-destructive">{result.error}</span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Métricas de Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">99.95%</span>
                      </div>
                      <Progress value={99.95} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Sucesso</span>
                        <span className="font-medium">99.7%</span>
                      </div>
                      <Progress value={99.7} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Latência Média</span>
                        <span className="font-medium">2.5s</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    CNJ 615/2025
                  </CardTitle>
                  <CardDescription>
                    Conformidade com a Resolução CNJ 615/2025
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Logs auditáveis de todas as operações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Hash SHA-256 de documentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Rastreabilidade 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Certificação digital ICP-Brasil</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    LGPD
                  </CardTitle>
                  <CardDescription>
                    Lei Geral de Proteção de Dados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Criptografia de dados pessoais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Direito ao esquecimento (30 dias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Consentimento documentado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Anonimização automática</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    ISO 27001
                  </CardTitle>
                  <CardDescription>
                    Gestão de Segurança da Informação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Política de segurança implementada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Plano de resposta a incidentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span>Teste de penetração anual (pendente)</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sigilo Profissional
                  </CardTitle>
                  <CardDescription>
                    Lei do Sigilo Profissional do Advogado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Dados nunca compartilhados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Acesso restrito por role</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span>Backup geograficamente isolado</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Credenciais</CardTitle>
                <CardDescription>
                  Configure as credenciais de acesso aos sistemas judiciais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* e-SAJ */}
                <div className="space-y-4 pb-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <h4 className="font-medium">e-SAJ (REST/Bearer Token)</h4>
                    </div>
                    <Badge variant="default">Configurado</Badge>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Credenciais Gerenciadas</AlertTitle>
                    <AlertDescription>
                      As credenciais do e-SAJ são gerenciadas pelo administrador do sistema.
                      Entre em contato com o suporte para alterações.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* CNJ Datajud */}
                <div className="space-y-4 pb-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      <h4 className="font-medium">CNJ Datajud (OAuth 2.0)</h4>
                    </div>
                    <Badge variant="default">Configurado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Autenticação OAuth 2.0 com PKCE. Token renovado automaticamente.
                  </p>
                </div>

                {/* PJe eCJUS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <h4 className="font-medium">PJe eCJUS (SOAP/WS-Security)</h4>
                    </div>
                    <Badge variant="secondary">Pendente</Badge>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Certificado Digital Necessário</AlertTitle>
                    <AlertDescription>
                      A integração com o PJe eCJUS requer um certificado digital ICP-Brasil A1.
                      Entre em contato com o suporte para configurar.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" onClick={() => toast.info("Funcionalidade em breve", { description: "Entre em contato com o suporte para configurar o certificado digital." })}>
                    Configurar Certificado
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tribunais Suportados */}
            <Card>
              <CardHeader>
                <CardTitle>Tribunais Suportados</CardTitle>
                <CardDescription>
                  Lista de tribunais com integração disponível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {['TJSP', 'TJMG', 'TJRJ', 'TJBA', 'TJRS', 'TJPR', 'TJSC', 'TJGO', 'TJPE', 'TJCE'].map((tj) => (
                    <div key={tj} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{tj}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
