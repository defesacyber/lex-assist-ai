import { useEffect, useState } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// Tour steps for different sections
const dashboardSteps: DriveStep[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: '👋 Bem-vindo ao LexAssist AI!',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades. Este assistente vai transformar sua prática jurídica com inteligência artificial.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: '📋 Menu de Navegação',
      description: 'Aqui você encontra todas as funcionalidades: casos, análises preditivas, simulador de audiência, prazos, documentos e muito mais.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stats"]',
    popover: {
      title: '📊 Estatísticas Rápidas',
      description: 'Visualize rapidamente seus casos ativos, prazos pendentes, audiências agendadas e análises realizadas.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="cases"]',
    popover: {
      title: '📁 Gestão de Casos',
      description: 'Cadastre e gerencie todos os seus processos. Cada caso pode ter análises preditivas, audiências, prazos e documentos vinculados.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="analysis"]',
    popover: {
      title: '🧠 Análise Preditiva',
      description: 'Nossa IA analisa seu caso e prevê a probabilidade de sucesso, identifica pontos fortes e fracos, riscos e sugere estratégias.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="simulator"]',
    popover: {
      title: '🎯 Simulador de Audiência',
      description: 'Prepare-se para audiências com perguntas prováveis do juiz e da parte contrária, sugestões de respostas e pontos de objeção.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="deadlines"]',
    popover: {
      title: '⏰ Controle de Prazos',
      description: 'Nunca mais perca um prazo! O sistema calcula automaticamente considerando dias úteis, feriados e suspensões.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="assistant"]',
    popover: {
      title: '🎙️ Assistente de Audiência',
      description: 'Grave ou faça upload de áudio de audiências para transcrição automática e geração de minutas pós-audiência.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="intelligence"]',
    popover: {
      title: '🔮 Inteligência Avançada',
      description: 'Funcionalidades premium: Olho da Lei, Match de Juízes, Health Score, Calculadora de Honorários e muito mais.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="subscription"]',
    popover: {
      title: '💎 Planos e Assinatura',
      description: 'Escolha o plano ideal para você. O plano gratuito permite testar as principais funcionalidades.',
      side: 'right',
      align: 'start'
    }
  },
  {
    popover: {
      title: '🚀 Pronto para começar!',
      description: 'Agora você conhece as principais funcionalidades do LexAssist AI. Comece cadastrando seu primeiro caso ou explore o dashboard. Bom trabalho!',
    }
  }
];

interface OnboardingTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ autoStart = false, onComplete }: OnboardingTourProps) {
  const { user } = useAuth();
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  
  // Check if user has completed onboarding
  const { data: onboardingStatus } = trpc.user.getOnboardingStatus.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutation to mark onboarding as complete
  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: () => {
      setHasSeenTour(true);
    }
  });

  useEffect(() => {
    if (onboardingStatus !== undefined) {
      setHasSeenTour(onboardingStatus.completed);
    }
  }, [onboardingStatus]);

  useEffect(() => {
    // Only auto-start if user hasn't seen the tour and autoStart is true
    if (autoStart && hasSeenTour === false && user) {
      startTour();
    }
  }, [autoStart, hasSeenTour, user]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps: dashboardSteps,
      onDestroyStarted: () => {
        // Mark onboarding as complete when tour ends
        if (user) {
          completeOnboarding.mutate();
        }
        if (onComplete) {
          onComplete();
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  return null; // This component doesn't render anything visible
}

// Hook to manually trigger the tour
export function useOnboardingTour() {
  const { user } = useAuth();
  const completeOnboarding = trpc.user.completeOnboarding.useMutation();
  const resetOnboardingMutation = trpc.user.resetOnboarding.useMutation();

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      steps: dashboardSteps,
      onDestroyStarted: () => {
        if (user) {
          completeOnboarding.mutate();
        }
        driverObj.destroy();
      },
    });

    driverObj.drive();
  };

  return { startTour, resetTour: resetOnboardingMutation.mutate };
}

export default OnboardingTour;
