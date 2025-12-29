/**
 * Stripe Products and Prices Configuration
 * 
 * Defines the subscription plans for LexAssist AI:
 * - Free: Basic features, limited usage
 * - Professional: Full features for individual lawyers
 * - Enterprise: Unlimited usage for law firms
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // in cents (BRL)
  priceYearly: number; // in cents (BRL)
  features: string[];
  limits: {
    casesPerMonth: number;
    analysesPerMonth: number;
    hearingsPerMonth: number;
    storageGB: number;
    teamMembers: number;
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para advogados que querem experimentar',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Até 3 casos ativos',
      '5 análises preditivas/mês',
      '2 simulações de audiência/mês',
      '1 GB de armazenamento',
      'Suporte por email'
    ],
    limits: {
      casesPerMonth: 3,
      analysesPerMonth: 5,
      hearingsPerMonth: 2,
      storageGB: 1,
      teamMembers: 1
    }
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Para advogados autônomos e pequenos escritórios',
    priceMonthly: 19900, // R$ 199,00
    priceYearly: 199000, // R$ 1.990,00 (2 meses grátis)
    features: [
      'Casos ilimitados',
      'Análises preditivas ilimitadas',
      'Simulações de audiência ilimitadas',
      'Transcrição de audiências',
      'Controle de prazos avançado',
      'Integrações judiciais (PJe, e-SAJ)',
      '10 GB de armazenamento',
      'Suporte prioritário',
      'Relatórios avançados'
    ],
    limits: {
      casesPerMonth: -1, // unlimited
      analysesPerMonth: -1,
      hearingsPerMonth: -1,
      storageGB: 10,
      teamMembers: 1
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Escritório',
    description: 'Para escritórios de advocacia e equipes',
    priceMonthly: 49900, // R$ 499,00
    priceYearly: 499000, // R$ 4.990,00 (2 meses grátis)
    features: [
      'Tudo do Profissional',
      'Até 10 membros da equipe',
      '100 GB de armazenamento',
      'API de integração',
      'Olho da Lei - Monitoramento 24/7',
      'Match de Juízes - Análise de perfil',
      'Health Score avançado',
      'Calculadora de honorários',
      'Modo pós-audiência em 90s',
      'Gerente de conta dedicado',
      'Treinamento personalizado'
    ],
    limits: {
      casesPerMonth: -1,
      analysesPerMonth: -1,
      hearingsPerMonth: -1,
      storageGB: 100,
      teamMembers: 10
    }
  }
];

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

/**
 * Check if a feature is available for a plan
 */
export function isPlanFeatureAvailable(planId: string, feature: string): boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;
  return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Check if user has reached plan limits
 */
export function checkPlanLimits(
  planId: string,
  usage: { cases?: number; analyses?: number; hearings?: number; storage?: number }
): { allowed: boolean; reason?: string } {
  const plan = getPlanById(planId);
  if (!plan) return { allowed: false, reason: 'Plano não encontrado' };

  const { limits } = plan;

  if (limits.casesPerMonth !== -1 && (usage.cases || 0) >= limits.casesPerMonth) {
    return { allowed: false, reason: `Limite de ${limits.casesPerMonth} casos atingido` };
  }

  if (limits.analysesPerMonth !== -1 && (usage.analyses || 0) >= limits.analysesPerMonth) {
    return { allowed: false, reason: `Limite de ${limits.analysesPerMonth} análises atingido` };
  }

  if (limits.hearingsPerMonth !== -1 && (usage.hearings || 0) >= limits.hearingsPerMonth) {
    return { allowed: false, reason: `Limite de ${limits.hearingsPerMonth} audiências atingido` };
  }

  if (limits.storageGB !== -1 && (usage.storage || 0) >= limits.storageGB * 1024 * 1024 * 1024) {
    return { allowed: false, reason: `Limite de ${limits.storageGB} GB de armazenamento atingido` };
  }

  return { allowed: true };
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(priceInCents / 100);
}
