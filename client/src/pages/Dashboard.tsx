import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  Briefcase, Brain, Clock, Calendar, AlertTriangle, 
  TrendingUp, ArrowRight, Plus, FileText, HelpCircle
} from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OnboardingTour, useOnboardingTour } from "@/components/OnboardingTour";

function DashboardContent() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: upcomingDeadlines } = trpc.deadlines.upcoming.useQuery({ days: 7 });
  const { data: cases } = trpc.cases.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Casos Ativos",
      value: stats?.activeCases || 0,
      description: "casos em andamento",
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Análises Realizadas",
      value: stats?.totalCases || 0,
      description: "este mês",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
      title: "Prazos Próximos",
      value: stats?.upcomingDeadlines || 0,
      description: "nos próximos 7 dias",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30"
    },
    {
      title: "Audiências Agendadas",
      value: stats?.upcomingHearings || 0,
      description: "esta semana",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    }
  ];

  const { startTour } = useOnboardingTour();

  return (
    <div className="space-y-6">
      {/* Onboarding Tour - auto-starts for new users */}
      <OnboardingTour autoStart={true} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" data-tour="welcome">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua prática jurídica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={startTour} className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Tour
          </Button>
          <Link href="/cases/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Caso
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="stats">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Prazos Próximos</CardTitle>
              <CardDescription>Prazos vencendo nos próximos 7 dias</CardDescription>
            </div>
            <Link href="/deadlines">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-4">
                {upcomingDeadlines.slice(0, 5).map((deadline) => {
                  const dueDate = new Date(deadline.dueDate);
                  const isUrgent = dueDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                  return (
                    <div 
                      key={deadline.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isUrgent ? 'border-destructive/50 bg-destructive/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        <div>
                          <p className="font-medium text-sm">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {deadline.deadlineType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isUrgent ? 'text-destructive' : ''}`}>
                          {format(dueDate, "dd/MM", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(dueDate, { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum prazo próximo</p>
                <Link href="/deadlines/new">
                  <Button variant="link" size="sm">Adicionar prazo</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Casos Recentes</CardTitle>
              <CardDescription>Últimos casos cadastrados</CardDescription>
            </div>
            <Link href="/cases">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {cases && cases.length > 0 ? (
              <div className="space-y-4">
                {cases.slice(0, 5).map((caseItem) => (
                  <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{caseItem.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.category} • {caseItem.jurisdiction}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        caseItem.status === 'active' ? 'status-active' :
                        caseItem.status === 'closed' ? 'status-completed' :
                        'status-pending'
                      }`}>
                        {caseItem.status === 'active' ? 'Ativo' :
                         caseItem.status === 'closed' ? 'Encerrado' :
                         caseItem.status === 'archived' ? 'Arquivado' : 'Pendente'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum caso cadastrado</p>
                <Link href="/cases/new">
                  <Button variant="link" size="sm">Criar primeiro caso</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/analysis">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Brain className="h-6 w-6 text-primary" />
                <span>Nova Análise Preditiva</span>
              </Button>
            </Link>
            <Link href="/simulator">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span>Simular Audiência</span>
              </Button>
            </Link>
            <Link href="/deadlines/new">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <span>Adicionar Prazo</span>
              </Button>
            </Link>
            <Link href="/assistant">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>Assistente de Audiência</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
