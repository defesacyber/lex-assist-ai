import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Crown, Check, Zap, Building2, Rocket, 
  Brain, Clock, FileText, Mic, Loader2,
  CreditCard, ExternalLink, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

function SubscriptionContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Fetch plans from Stripe
  const { data: plans, isLoading: loadingPlans } = trpc.stripe.getPlans.useQuery();
  
  // Fetch current subscription status
  const { data: subscriptionStatus, isLoading: loadingStatus, refetch: refetchStatus } = trpc.stripe.getSubscriptionStatus.useQuery();

  // Mutations
  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar sessão de pagamento');
      setProcessingPlan(null);
    }
  });

  const createPortal = trpc.stripe.createPortal.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao acessar portal de assinatura');
    }
  });

  const cancelSubscription = trpc.stripe.cancelSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cancelar assinatura');
    }
  });

  // Check for success/cancel URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');
    
    if (subscription === 'success') {
      toast.success('Assinatura realizada com sucesso! Bem-vindo ao LexAssist AI Pro!');
      refetchStatus();
      // Clean URL
      window.history.replaceState({}, '', '/assinatura');
    } else if (subscription === 'cancelled') {
      toast.info('Processo de assinatura cancelado');
      window.history.replaceState({}, '', '/assinatura');
    }
  }, []);

  const isLoading = loadingPlans || loadingStatus;
  const currentPlan = subscriptionStatus?.currentPlan || 'free';
  const isSubscribed = currentPlan !== 'free';

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }
    
    setProcessingPlan(planId);
    createCheckout.mutate({
      planId: planId as 'professional' | 'enterprise',
      billingPeriod
    });
  };

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  const handleCancelSubscription = () => {
    if (confirm('Tem certeza que deseja cancelar sua assinatura? O acesso continuará até o final do período pago.')) {
      cancelSubscription.mutate();
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Zap;
      case 'professional': return Building2;
      case 'enterprise': return Rocket;
      default: return Zap;
    }
  };

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
      {isSubscribed && subscriptionStatus && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Sua Assinatura Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="text-xl font-bold capitalize">{subscriptionStatus.planDetails?.name || currentPlan}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={subscriptionStatus.stripeDetails?.status === 'active' ? "default" : "secondary"}>
                  {subscriptionStatus.stripeDetails?.status === 'active' ? 'Ativo' : 
                   subscriptionStatus.stripeDetails?.status === 'trialing' ? 'Período de Teste' :
                   subscriptionStatus.stripeDetails?.cancelAtPeriodEnd ? 'Cancelamento Agendado' : 'Ativo'}
                </Badge>
              </div>
              {subscriptionStatus.expiresAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Válido até</p>
                  <p className="font-medium">
                    {format(new Date(subscriptionStatus.expiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={createPortal.isPending}>
                  {createPortal.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Gerenciar
                </Button>
                {!subscriptionStatus.stripeDetails?.cancelAtPeriodEnd && (
                  <Button variant="ghost" size="sm" onClick={handleCancelSubscription} disabled={cancelSubscription.isPending}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            {subscriptionStatus.stripeDetails?.cancelAtPeriodEnd && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-yellow-600">
                  Sua assinatura será cancelada ao final do período atual. Você pode reativar a qualquer momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Period Toggle */}
      <div className="flex justify-center">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')}>
          <TabsList>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Anual
              <Badge className="absolute -top-2 -right-2 text-[10px] px-1" variant="default">
                -17%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const PlanIcon = getPlanIcon(plan.id);
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.popular;
            const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const priceFormatted = billingPeriod === 'yearly' ? plan.priceYearlyFormatted : plan.priceMonthlyFormatted;
            const isProcessing = processingPlan === plan.id;

            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative flex flex-col",
                  isPopular && "border-primary shadow-lg scale-105 z-10",
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
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? "Grátis" : priceFormatted}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    )}
                    {billingPeriod === 'yearly' && price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        equivale a {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price / 100 / 12)}/mês
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, i) => (
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
                    disabled={isCurrentPlan || isProcessing || createCheckout.isPending}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isProcessing || (createCheckout.isPending && processingPlan === plan.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      "Plano Atual"
                    ) : plan.id === 'free' ? (
                      "Plano Gratuito"
                    ) : (
                      <>
                        Assinar Agora
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Security Badge */}
      <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>Pagamento seguro via Stripe</span>
        </div>
        <span>•</span>
        <span>Cancele a qualquer momento</span>
        <span>•</span>
        <span>Garantia de 7 dias</span>
      </div>

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
              A cobrança é automática via cartão de crédito através do Stripe. Você receberá um recibo por email após cada pagamento.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Posso fazer upgrade do plano?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Sim, você pode fazer upgrade a qualquer momento. O valor será calculado proporcionalmente ao período restante.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Quais formas de pagamento são aceitas?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express, Elo) através do Stripe.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Existe período de teste?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              O plano gratuito permite testar as principais funcionalidades. Oferecemos garantia de 7 dias em todos os planos pagos.
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
