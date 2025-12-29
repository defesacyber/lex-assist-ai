import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { 
  Scale, Brain, Clock, FileText, Shield, Zap, 
  BarChart3, MessageSquare, Calendar, Bell, 
  ArrowRight, CheckCircle2, Star, Users
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: Brain,
    title: "Análise Preditiva com IA",
    description: "Utilize inteligência artificial avançada para prever resultados de casos com base em jurisprudência e dados históricos."
  },
  {
    icon: MessageSquare,
    title: "Simulador de Audiência",
    description: "Prepare-se para audiências com simulações de perguntas do juiz e parte contrária, incluindo sugestões de respostas estratégicas."
  },
  {
    icon: Zap,
    title: "Assistente em Tempo Real",
    description: "Transcrição automática de audiências virtuais com alertas estratégicos para manter o foco na argumentação."
  },
  {
    icon: Clock,
    title: "Controle de Prazos Inteligente",
    description: "Cálculo automatizado de prazos processuais considerando feriados, suspensões e regras específicas de cada tribunal."
  },
  {
    icon: FileText,
    title: "Geração de Minutas",
    description: "Crie automaticamente resumos executivos e minutas de petições baseadas nas transcrições de audiências."
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Visualize todos os seus casos, prazos e audiências em um painel centralizado e intuitivo."
  }
];

const plans = [
  {
    name: "Básico",
    price: "R$ 97",
    period: "/mês",
    description: "Ideal para advogados autônomos",
    features: [
      "Até 10 casos ativos",
      "5 análises preditivas/mês",
      "3 simulações de audiência/mês",
      "Controle de prazos básico",
      "Suporte por email"
    ],
    popular: false
  },
  {
    name: "Profissional",
    price: "R$ 197",
    period: "/mês",
    description: "Para escritórios em crescimento",
    features: [
      "Até 50 casos ativos",
      "20 análises preditivas/mês",
      "15 simulações de audiência/mês",
      "Transcrição de audiências (5h/mês)",
      "Geração de minutas automática",
      "Alertas por email",
      "Suporte prioritário"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "R$ 497",
    period: "/mês",
    description: "Para grandes escritórios",
    features: [
      "Casos ilimitados",
      "Análises preditivas ilimitadas",
      "Simulações ilimitadas",
      "Transcrição ilimitada",
      "Integração com Datajud",
      "API de integração",
      "Suporte 24/7",
      "Treinamento personalizado"
    ],
    popular: false
  }
];

const testimonials = [
  {
    name: "Dr. Ricardo Mendes",
    role: "Advogado Trabalhista",
    content: "O LexAssist AI revolucionou minha preparação para audiências. A análise preditiva me dá confiança e o simulador me ajuda a antecipar argumentos da parte contrária.",
    rating: 5
  },
  {
    name: "Dra. Camila Santos",
    role: "Advogada Cível",
    content: "Nunca mais perdi um prazo desde que comecei a usar o sistema. O controle de prazos inteligente é simplesmente indispensável.",
    rating: 5
  },
  {
    name: "Dr. Fernando Costa",
    role: "Sócio de Escritório",
    content: "A transcrição automática de audiências economiza horas de trabalho da minha equipe. O ROI foi imediato.",
    rating: 5
  }
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">LexAssist AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Acessar Dashboard</Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Entrar</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button>Começar Grátis</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Inteligência Artificial para Advocacia
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Transforme sua prática jurídica com{" "}
              <span className="gradient-text">IA Preditiva</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Análise preditiva de casos, simulação de audiências, controle inteligente de prazos e 
              transcrição automática. Tudo que você precisa para vencer mais causas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  Começar Agora <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="#features">
                <Button size="lg" variant="outline">
                  Ver Funcionalidades
                </Button>
              </a>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Dados seguros</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <span>+1.000 advogados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Funcionalidades que fazem a diferença
            </h2>
            <p className="text-lg text-muted-foreground">
              Ferramentas desenvolvidas especificamente para as necessidades do advogado brasileiro moderno.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-border/50">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Em poucos passos, tenha acesso a insights poderosos para seus casos.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Cadastre seu caso</h3>
              <p className="text-muted-foreground">
                Insira os detalhes do processo, incluindo fatos, argumentos e jurisdição.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Receba análises</h3>
              <p className="text-muted-foreground">
                Nossa IA analisa jurisprudência e gera predições de sucesso e estratégias.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Vença mais causas</h3>
              <p className="text-muted-foreground">
                Use os insights para preparar audiências e tomar decisões estratégicas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Planos para cada necessidade
            </h2>
            <p className="text-lg text-muted-foreground">
              Escolha o plano ideal para o seu escritório. Todos incluem 7 dias de teste grátis.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative card-hover ${plan.popular ? 'border-primary shadow-lg' : 'border-border/50'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      <Star className="h-3 w-3" /> Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={getLoginUrl()}>
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      Começar Teste Grátis
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              O que dizem nossos clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Advogados de todo o Brasil já transformaram sua prática com o LexAssist AI.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover border-border/50">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Pronto para transformar sua advocacia?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Junte-se a mais de 1.000 advogados que já utilizam o LexAssist AI para vencer mais causas.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="gap-2">
                Começar Teste Grátis de 7 Dias <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">LexAssist AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Inteligência artificial a serviço da advocacia brasileira.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} LexAssist AI. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
