import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Crown, Check, Zap, Building2, Rocket, 
  Brain, Clock, FileText, Mic, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const planFeatures: Record<string, { icon: any; features: string[] }> = {
  free: {
    icon: Zap,
    features: [
      "5 análises preditivas/mês",
      "3 simulações de audiência/mês",
      "Controle básico de prazos",
      "1 caso ativo",
      "Suporte por email"
    ]
  },
  professional: {
    icon: Building2,
    features: [
      "50 análises preditivas/mês",
      "30 simulações de audiência/mês",
      "Controle avançado de prazos",
      "20 casos ativos",
      "Transcrição de audiências",
      "Geração de minutas",
      "Alertas por email e app",
      "Suporte prioritário"
    ]
  },
  enterprise: {
    icon: Rocket,
    features: [
      "Análises ilimitadas",
      "Simulações ilimitadas",
      "Casos ilimitados",
      "Transcrição ilimitada",
      "API de integração",
      "Relatórios personalizados",
      "Treinamento dedicado",
      "Suporte 24/7",
      "SLA garantido"
    ]
  }
};

function SubscriptionContent() {
  const { data: plans, isLoading: loadingPlans } = trpc.subscription.plans.useQuery();
  const { data: currentSubscription, isLoading: loadingCurrent } = trpc.subscription.current.useQuery();
  // Usage stats would come from a usage tracking endpoint
  const usage = {
    analyses: 0,
    analysesLimit: 5,
    simulations: 0,
    simulationsLimit: 3,
    transcriptions: 0,
    transcriptionsLimit: 0,
    minutes: 0,
    minutesLimit: 0
  };

  const isLoading = loadingPlans || loadingCurrent;

  const currentPlan = currentSubscription?.plan || "free";
  const isSubscribed = currentPlan !== "free";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Planos e Assinatura</h1>
        <p className="text-muted-foreground mt-2">
          Escolha o plano ideal para potencializar sua prática jurídica com inteligência artificial
        </p>
      </div>

      {/* Current Subscription Status */}
      {isSubscribed && currentSubscription && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Sua Assinatura Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="text-xl font-bold capitalize">{currentSubscription.plan}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={true ? "default" : "secondary"}>
                  {true ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {currentSubscription.expiresAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="font-medium">
                    {format(new Date(currentSubscription.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Stats */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Uso do Mês</CardTitle>
            <CardDescription>Acompanhe o consumo das funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Análises
                  </span>
                  <span>{usage.analyses || 0} / {usage.analysesLimit || 5}</span>
                </div>
                <Progress value={((usage.analyses || 0) / (usage.analysesLimit || 5)) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    Simulações
                  </span>
                  <span>{usage.simulations || 0} / {usage.simulationsLimit || 3}</span>
                </div>
                <Progress value={((usage.simulations || 0) / (usage.simulationsLimit || 3)) * 100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Transcrições
                  </span>
                  <span>{usage.transcriptions || 0} / {usage.transcriptionsLimit || 0}</span>
                </div>
                <Progress value={usage.transcriptionsLimit ? ((usage.transcriptions || 0) / usage.transcriptionsLimit) * 100 : 0} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Minutas
                  </span>
                  <span>{usage.minutes || 0} / {usage.minutesLimit || 0}</span>
                </div>
                <Progress value={usage.minutesLimit ? ((usage.minutes || 0) / usage.minutesLimit) * 100 : 0} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const features = planFeatures[plan.name] || planFeatures.free;
            const PlanIcon = features.icon;
            const isCurrentPlan = currentPlan === plan.name;
            const isPopular = plan.name === "professional";

            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative",
                  isPopular && "border-primary shadow-lg scale-105",
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Mais Popular</Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="outline" className="bg-background">Plano Atual</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                    isPopular ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  )}>
                    <PlanIcon className={cn("h-6 w-6", !isPopular && "text-primary")} />
                  </div>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {Number(plan.priceMonthly) === 0 ? "Grátis" : `R$ ${plan.priceMonthly}`}
                    </span>
                    {Number(plan.priceMonthly) > 0 && (
                      <span className="text-muted-foreground">/mês</span>
                    )}
                  </div>
                  <ul className="space-y-3 text-left">
                    {features.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => {
                      if (!isCurrentPlan) {
                        toast.info("Entre em contato para assinar este plano");
                      }
                    }}
                  >
                    {isCurrentPlan ? "Plano Atual" : 
                     plan.name === "free" ? "Começar Grátis" : 
                     "Assinar Agora"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Posso cancelar a qualquer momento?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Sim, você pode cancelar sua assinatura a qualquer momento. O acesso continua até o fim do período pago.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Como funciona a cobrança?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              A cobrança é mensal e automática. Você pode alterar ou cancelar seu plano nas configurações.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Posso fazer upgrade do plano?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Sim, você pode fazer upgrade a qualquer momento. O valor será calculado proporcionalmente.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Existe período de teste?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              O plano gratuito permite testar as principais funcionalidades. Para recursos avançados, oferecemos 7 dias de teste grátis no plano Professional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Subscription() {
  return (
    <DashboardLayout>
      <SubscriptionContent />
    </DashboardLayout>
  );
}
