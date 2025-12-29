import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, Edit, Brain, MessageSquare, Clock, FileText,
  Calendar, User, Building, Scale, Trash2, Plus
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  civil: "Cível",
  trabalhista: "Trabalhista",
  criminal: "Criminal",
  tributario: "Tributário",
  familia: "Família",
  consumidor: "Consumidor",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  empresarial: "Empresarial",
  outro: "Outro"
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  closed: "Encerrado",
  archived: "Arquivado",
  pending: "Pendente"
};

function CaseDetailContent() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const caseId = Number(params.id);

  const { data: caseData, isLoading } = trpc.cases.get.useQuery({ id: caseId });
  const { data: analyses } = trpc.analysis.getByCase.useQuery({ caseId });
  const { data: deadlines } = trpc.deadlines.listByCase.useQuery({ caseId });
  const { data: documents } = trpc.documents.listByCase.useQuery({ caseId });
  const { data: hearings } = trpc.hearings.listByCase.useQuery({ caseId });

  const deleteMutation = trpc.cases.delete.useMutation({
    onSuccess: () => {
      toast.success("Caso excluído com sucesso!");
      setLocation("/cases");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir caso: " + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Caso não encontrado</h2>
        <Link href="/cases">
          <Button variant="link">Voltar para lista de casos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/cases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
              <Badge variant={
                caseData.status === 'active' ? 'default' :
                caseData.status === 'closed' ? 'secondary' : 'outline'
              }>
                {statusLabels[caseData.status] || caseData.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {categoryLabels[caseData.category] || caseData.category} • {caseData.jurisdiction}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/analysis?caseId=${caseId}`}>
            <Button variant="outline" className="gap-2">
              <Brain className="h-4 w-4" />
              Analisar
            </Button>
          </Link>
          <Link href={`/simulator?caseId=${caseId}`}>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Simular
            </Button>
          </Link>
          <Link href={`/cases/${caseId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Case Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Caso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {caseData.caseNumber && (
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Número do Processo</p>
                  <p className="font-medium">{caseData.caseNumber}</p>
                </div>
              </div>
            )}
            {caseData.court && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Vara/Tribunal</p>
                  <p className="font-medium">{caseData.court}</p>
                </div>
              </div>
            )}
            {caseData.clientName && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{caseData.clientName}</p>
                </div>
              </div>
            )}
            {caseData.opposingParty && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Parte Contrária</p>
                  <p className="font-medium">{caseData.opposingParty}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-2">Descrição</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{caseData.description}</p>
          </div>

          {caseData.arguments && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Argumentos Legais</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{caseData.arguments}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultValue="analyses" className="w-full">
        <TabsList>
          <TabsTrigger value="analyses" className="gap-2">
            <Brain className="h-4 w-4" />
            Análises ({analyses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="gap-2">
            <Clock className="h-4 w-4" />
            Prazos ({deadlines?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="hearings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Audiências ({hearings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos ({documents?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Análises Preditivas</CardTitle>
                <CardDescription>Histórico de análises realizadas para este caso</CardDescription>
              </div>
              <Link href={`/analysis?caseId=${caseId}`}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Análise
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {analyses && analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis: any) => (
                    <div key={analysis.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Probabilidade de Sucesso: {analysis.successProbability}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(analysis.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={
                          Number(analysis.successProbability) >= 70 ? "default" :
                          Number(analysis.successProbability) >= 40 ? "secondary" : "destructive"
                        }>
                          {Number(analysis.successProbability) >= 70 ? "Alta" :
                           Number(analysis.successProbability) >= 40 ? "Média" : "Baixa"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma análise realizada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prazos</CardTitle>
                <CardDescription>Prazos processuais deste caso</CardDescription>
              </div>
              <Link href="/deadlines">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Prazo
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {deadlines && deadlines.length > 0 ? (
                <div className="space-y-4">
                  {deadlines.map((deadline: any) => (
                    <div key={deadline.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{deadline.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {format(new Date(deadline.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={deadline.status === "completed" ? "secondary" : "default"}>
                          {deadline.status === "completed" ? "Concluído" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum prazo cadastrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hearings">
          <Card>
            <CardHeader>
              <CardTitle>Audiências</CardTitle>
              <CardDescription>Audiências agendadas para este caso</CardDescription>
            </CardHeader>
            <CardContent>
              {hearings && hearings.length > 0 ? (
                <div className="space-y-4">
                  {hearings.map((hearing: any) => (
                    <div key={hearing.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{hearing.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(hearing.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={hearing.isVirtual ? "default" : "outline"}>
                          {hearing.isVirtual ? "Virtual" : "Presencial"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma audiência agendada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>Documentos anexados a este caso</CardDescription>
              </div>
              <Link href="/documents">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Enviar Documento
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 rounded-lg border flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum documento anexado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis para este caso</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            className="gap-2"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir este caso? Esta ação é irreversível.")) {
                deleteMutation.mutate({ id: caseId });
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir Caso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseDetail() {
  return (
    <DashboardLayout>
      <CaseDetailContent />
    </DashboardLayout>
  );
}
