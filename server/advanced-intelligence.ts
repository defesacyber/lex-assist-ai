/**
 * AUDIUM Advanced Intelligence Module
 * Funcionalidades avançadas de IA para advogados
 * - Olho da Lei: Monitoramento de Jurisprudência
 * - Match de Juízes: Análise de Perfil Judicial
 * - Health Score: Score de Saúde do Caso
 * - Radar de Prazos: Detecção de Conflitos
 * - Calculadora de Honorários Preditiva
 */

import { invokeLLM } from "./_core/llm";

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface JurisprudenciaAlert {
  id: string;
  tribunal: string;
  numeroProcesso: string;
  assunto: string;
  ementa: string;
  dataDecisao: Date;
  relevancia: number; // 0-100
  impacto: 'favoravel' | 'desfavoravel' | 'neutro';
  casosRelacionados: number[];
  createdAt: Date;
}

export interface JuizProfile {
  id: string;
  nome: string;
  tribunal: string;
  vara: string;
  especialidade: string;
  totalDecisoes: number;
  taxaAceitacao: {
    geral: number;
    porTipo: Record<string, number>;
  };
  tempoMedioDecisao: number; // em dias
  tesesPreferidas: string[];
  padroes: {
    prefereTutela: boolean;
    exigeProvaPericial: boolean;
    valorMedioDanoMoral: number;
    aceitaAcordos: boolean;
  };
  ultimaAtualizacao: Date;
}

export interface CaseHealthScore {
  caseId: number;
  score: number; // 0-100
  fatores: {
    prazosCumpridos: number;
    documentacaoCompleta: number;
    jurisprudenciaFavoravel: number;
    riscoPerda: number;
    complexidade: number;
  };
  alertas: string[];
  recomendacoes: string[];
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  ultimaAtualizacao: Date;
}

export interface PrazoConflito {
  id: string;
  tipo: 'audiencia' | 'prazo' | 'reuniao';
  data: Date;
  conflitos: {
    outroEvento: string;
    outroCaso: string;
    gravidade: 'alta' | 'media' | 'baixa';
  }[];
  sugestaoReagendamento?: Date;
}

export interface HonorariosPrevisao {
  valorSugerido: number;
  faixaMinima: number;
  faixaMaxima: number;
  fatoresConsiderados: {
    complexidade: number;
    valorCausa: number;
    tribunal: string;
    tipoAcao: string;
    tempoEstimado: number;
    historicoPagamento: number;
  };
  comparativoMercado: {
    percentil: number;
    mediaMercado: number;
  };
  confianca: number; // 0-100
}

export interface PostAudienciaReport {
  audienciaId: number;
  resumoExecutivo: string;
  pontosChave: string[];
  alertas: {
    tipo: 'prazo' | 'risco' | 'oportunidade';
    mensagem: string;
    urgencia: 'alta' | 'media' | 'baixa';
  }[];
  tarefasAutomaticas: {
    titulo: string;
    prazo: Date;
    prioridade: 'alta' | 'media' | 'baixa';
  }[];
  indicadorRisco: {
    score: number;
    motivos: string[];
  };
  proximosPassos: string[];
  geradoEm: Date;
}

// ==========================================
// OLHO DA LEI - MONITORAMENTO DE JURISPRUDÊNCIA
// ==========================================

export class OlhoDaLei {
  private static TRIBUNAIS_MONITORADOS = ['STF', 'STJ', 'TST', 'TJSP', 'TJMG', 'TJRJ', 'TJBA', 'TJRS'];

  /**
   * Analisa jurisprudência relevante para um caso específico
   */
  static async analisarJurisprudenciaParaCaso(
    casoDescricao: string,
    categoria: string,
    tesesPrincipais: string[]
  ): Promise<JurisprudenciaAlert[]> {
    const prompt = `Você é um especialista em jurisprudência brasileira. Analise o caso descrito e identifique jurisprudências relevantes dos tribunais superiores (STF, STJ) e tribunais estaduais.

CASO:
${casoDescricao}

CATEGORIA: ${categoria}

TESES PRINCIPAIS:
${tesesPrincipais.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Retorne uma análise estruturada com jurisprudências relevantes, indicando:
1. Tribunal e número do processo
2. Ementa resumida
3. Relevância para o caso (0-100)
4. Impacto: favorável, desfavorável ou neutro
5. Data aproximada da decisão`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente jurídico especializado em pesquisa de jurisprudência brasileira." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "jurisprudencia_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              jurisprudencias: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tribunal: { type: "string" },
                    numeroProcesso: { type: "string" },
                    ementa: { type: "string" },
                    relevancia: { type: "number" },
                    impacto: { type: "string" },
                    dataAproximada: { type: "string" }
                  },
                  required: ["tribunal", "numeroProcesso", "ementa", "relevancia", "impacto", "dataAproximada"],
                  additionalProperties: false
                }
              }
            },
            required: ["jurisprudencias"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : '{"jurisprudencias": []}');

    return result.jurisprudencias.map((j: any, index: number) => ({
      id: `juris-${Date.now()}-${index}`,
      tribunal: j.tribunal,
      numeroProcesso: j.numeroProcesso,
      assunto: categoria,
      ementa: j.ementa,
      dataDecisao: new Date(j.dataAproximada),
      relevancia: j.relevancia,
      impacto: j.impacto as 'favoravel' | 'desfavoravel' | 'neutro',
      casosRelacionados: [],
      createdAt: new Date()
    }));
  }

  /**
   * Verifica mudanças recentes de entendimento nos tribunais
   */
  static async verificarMudancasEntendimento(
    tema: string,
    tribunais: string[] = this.TRIBUNAIS_MONITORADOS
  ): Promise<{ mudancas: any[]; alertas: string[] }> {
    const prompt = `Analise se houve mudanças recentes de entendimento jurisprudencial sobre o tema "${tema}" nos tribunais: ${tribunais.join(', ')}.

Considere:
1. Mudanças de súmulas
2. Decisões em recursos repetitivos
3. Overruling de entendimentos anteriores
4. Novas teses fixadas

Retorne as mudanças identificadas com data aproximada e impacto.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um especialista em acompanhamento de jurisprudência brasileira." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mudancas_entendimento",
          strict: true,
          schema: {
            type: "object",
            properties: {
              mudancas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tribunal: { type: "string" },
                    descricao: { type: "string" },
                    impacto: { type: "string" },
                    dataAproximada: { type: "string" }
                  },
                  required: ["tribunal", "descricao", "impacto", "dataAproximada"],
                  additionalProperties: false
                }
              },
              alertas: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["mudancas", "alertas"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === 'string' ? content : '{"mudancas": [], "alertas": []}');
  }
}

// ==========================================
// MATCH DE JUÍZES - ANÁLISE DE PERFIL JUDICIAL
// ==========================================

export class MatchDeJuizes {
  /**
   * Analisa o perfil de um juiz baseado em padrões de decisão
   */
  static async analisarPerfilJuiz(
    nomeJuiz: string,
    tribunal: string,
    vara: string
  ): Promise<JuizProfile> {
    const prompt = `Analise o perfil decisório do magistrado "${nomeJuiz}" da ${vara} do ${tribunal}.

Considere padrões típicos de magistrados brasileiros em varas similares e forneça:
1. Especialidade principal
2. Taxa de aceitação geral e por tipo de ação
3. Tempo médio para decisões
4. Teses que costuma aceitar
5. Padrões de comportamento (tutela de urgência, provas, acordos, valores de dano moral)

Baseie-se em padrões estatísticos típicos do judiciário brasileiro.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um analista de perfis judiciais especializado no judiciário brasileiro." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "perfil_juiz",
          strict: true,
          schema: {
            type: "object",
            properties: {
              especialidade: { type: "string" },
              taxaAceitacaoGeral: { type: "number" },
              taxasPorTipo: {
                type: "object",
                properties: {
                  trabalhista: { type: "number" },
                  civel: { type: "number" },
                  consumidor: { type: "number" },
                  familia: { type: "number" }
                },
                required: ["trabalhista", "civel", "consumidor", "familia"],
                additionalProperties: false
              },
              tempoMedioDecisao: { type: "number" },
              tesesPreferidas: { type: "array", items: { type: "string" } },
              prefereTutela: { type: "boolean" },
              exigeProvaPericial: { type: "boolean" },
              valorMedioDanoMoral: { type: "number" },
              aceitaAcordos: { type: "boolean" }
            },
            required: ["especialidade", "taxaAceitacaoGeral", "taxasPorTipo", "tempoMedioDecisao", "tesesPreferidas", "prefereTutela", "exigeProvaPericial", "valorMedioDanoMoral", "aceitaAcordos"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : '{}');

    return {
      id: `juiz-${Date.now()}`,
      nome: nomeJuiz,
      tribunal,
      vara,
      especialidade: result.especialidade,
      totalDecisoes: Math.floor(Math.random() * 5000) + 1000, // Simulado
      taxaAceitacao: {
        geral: result.taxaAceitacaoGeral,
        porTipo: result.taxasPorTipo
      },
      tempoMedioDecisao: result.tempoMedioDecisao,
      tesesPreferidas: result.tesesPreferidas,
      padroes: {
        prefereTutela: result.prefereTutela,
        exigeProvaPericial: result.exigeProvaPericial,
        valorMedioDanoMoral: result.valorMedioDanoMoral,
        aceitaAcordos: result.aceitaAcordos
      },
      ultimaAtualizacao: new Date()
    };
  }

  /**
   * Sugere estratégias baseadas no perfil do juiz
   */
  static async sugerirEstrategias(
    perfilJuiz: JuizProfile,
    tipoCaso: string,
    tesesDisponiveis: string[]
  ): Promise<{ estrategias: string[]; tesesRecomendadas: string[]; alertas: string[] }> {
    const prompt = `Com base no perfil do juiz ${perfilJuiz.nome}:
- Taxa de aceitação geral: ${perfilJuiz.taxaAceitacao.geral}%
- Especialidade: ${perfilJuiz.especialidade}
- Prefere tutela de urgência: ${perfilJuiz.padroes.prefereTutela ? 'Sim' : 'Não'}
- Exige prova pericial: ${perfilJuiz.padroes.exigeProvaPericial ? 'Sim' : 'Não'}
- Aceita acordos: ${perfilJuiz.padroes.aceitaAcordos ? 'Sim' : 'Não'}
- Teses preferidas: ${perfilJuiz.tesesPreferidas.join(', ')}

Para um caso de ${tipoCaso}, com as seguintes teses disponíveis:
${tesesDisponiveis.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Sugira:
1. Estratégias processuais
2. Teses recomendadas (das disponíveis)
3. Alertas e cuidados`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um estrategista jurídico especializado em análise de perfis judiciais." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "estrategias_juiz",
          strict: true,
          schema: {
            type: "object",
            properties: {
              estrategias: { type: "array", items: { type: "string" } },
              tesesRecomendadas: { type: "array", items: { type: "string" } },
              alertas: { type: "array", items: { type: "string" } }
            },
            required: ["estrategias", "tesesRecomendadas", "alertas"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(typeof content === 'string' ? content : '{"estrategias": [], "tesesRecomendadas": [], "alertas": []}');
  }
}

// ==========================================
// HEALTH SCORE - SCORE DE SAÚDE DO CASO
// ==========================================

export class HealthScoreCalculator {
  /**
   * Calcula o Health Score de um caso
   */
  static calcularHealthScore(
    prazosCumpridos: number, // 0-100
    documentacaoCompleta: number, // 0-100
    jurisprudenciaFavoravel: number, // 0-100
    complexidade: number, // 1-10
    diasSemMovimentacao: number
  ): CaseHealthScore {
    // Calcular risco de perda baseado nos fatores
    const riscoPerda = Math.max(0, 100 - (prazosCumpridos * 0.3 + documentacaoCompleta * 0.3 + jurisprudenciaFavoravel * 0.4));
    
    // Penalidade por dias sem movimentação
    const penalidade = Math.min(20, diasSemMovimentacao * 0.5);
    
    // Score final
    const score = Math.max(0, Math.min(100, 
      (prazosCumpridos * 0.25) +
      (documentacaoCompleta * 0.25) +
      (jurisprudenciaFavoravel * 0.30) +
      ((10 - complexidade) * 2) -
      penalidade
    ));

    // Gerar alertas
    const alertas: string[] = [];
    if (prazosCumpridos < 80) alertas.push("Atenção: Alguns prazos não foram cumpridos adequadamente");
    if (documentacaoCompleta < 70) alertas.push("Documentação incompleta pode prejudicar o caso");
    if (jurisprudenciaFavoravel < 50) alertas.push("Jurisprudência majoritariamente desfavorável");
    if (diasSemMovimentacao > 30) alertas.push(`Caso sem movimentação há ${diasSemMovimentacao} dias`);
    if (complexidade > 7) alertas.push("Caso de alta complexidade requer atenção especial");

    // Gerar recomendações
    const recomendacoes: string[] = [];
    if (prazosCumpridos < 100) recomendacoes.push("Revisar e regularizar prazos pendentes");
    if (documentacaoCompleta < 100) recomendacoes.push("Completar documentação faltante");
    if (jurisprudenciaFavoravel < 60) recomendacoes.push("Buscar jurisprudência favorável adicional");
    if (diasSemMovimentacao > 15) recomendacoes.push("Verificar andamento processual e impulsionar se necessário");

    // Determinar tendência (simulada - em produção seria baseada em histórico)
    const tendencia = score > 70 ? 'melhorando' : score > 50 ? 'estavel' : 'piorando';

    return {
      caseId: 0, // Será preenchido pelo chamador
      score: Math.round(score),
      fatores: {
        prazosCumpridos,
        documentacaoCompleta,
        jurisprudenciaFavoravel,
        riscoPerda: Math.round(riscoPerda),
        complexidade
      },
      alertas,
      recomendacoes,
      tendencia,
      ultimaAtualizacao: new Date()
    };
  }
}

// ==========================================
// RADAR DE PRAZOS - DETECÇÃO DE CONFLITOS
// ==========================================

export class RadarDePrazos {
  /**
   * Detecta conflitos de prazos e audiências
   */
  static detectarConflitos(
    eventos: Array<{
      id: string;
      tipo: 'audiencia' | 'prazo' | 'reuniao';
      titulo: string;
      casoTitulo: string;
      data: Date;
      duracao?: number; // em minutos
    }>
  ): PrazoConflito[] {
    const conflitos: PrazoConflito[] = [];
    
    // Ordenar eventos por data
    const eventosOrdenados = [...eventos].sort((a, b) => a.data.getTime() - b.data.getTime());
    
    // Verificar conflitos
    for (let i = 0; i < eventosOrdenados.length; i++) {
      const evento = eventosOrdenados[i];
      const conflitosEvento: PrazoConflito['conflitos'] = [];
      
      for (let j = i + 1; j < eventosOrdenados.length; j++) {
        const outroEvento = eventosOrdenados[j];
        
        // Verificar se estão no mesmo dia
        const mesmoDia = 
          evento.data.toDateString() === outroEvento.data.toDateString();
        
        if (mesmoDia) {
          // Verificar sobreposição de horário
          const duracaoEvento = evento.duracao || 60;
          const fimEvento = new Date(evento.data.getTime() + duracaoEvento * 60000);
          
          const sobreposicao = outroEvento.data < fimEvento;
          
          if (sobreposicao) {
            conflitosEvento.push({
              outroEvento: outroEvento.titulo,
              outroCaso: outroEvento.casoTitulo,
              gravidade: evento.tipo === 'audiencia' && outroEvento.tipo === 'audiencia' 
                ? 'alta' 
                : evento.tipo === 'prazo' || outroEvento.tipo === 'prazo'
                  ? 'media'
                  : 'baixa'
            });
          }
        }
      }
      
      if (conflitosEvento.length > 0) {
        // Sugerir reagendamento (próximo horário disponível)
        const sugestao = new Date(evento.data);
        sugestao.setDate(sugestao.getDate() + 1);
        sugestao.setHours(9, 0, 0, 0);
        
        conflitos.push({
          id: evento.id,
          tipo: evento.tipo,
          data: evento.data,
          conflitos: conflitosEvento,
          sugestaoReagendamento: sugestao
        });
      }
    }
    
    return conflitos;
  }
}

// ==========================================
// CALCULADORA DE HONORÁRIOS PREDITIVA
// ==========================================

export class CalculadoraHonorarios {
  /**
   * Calcula previsão de honorários baseada em múltiplos fatores
   */
  static async calcularHonorarios(
    tipoAcao: string,
    valorCausa: number,
    complexidade: number, // 1-10
    tribunal: string,
    tempoEstimadoMeses: number
  ): Promise<HonorariosPrevisao> {
    const prompt = `Calcule uma previsão de honorários advocatícios para:
- Tipo de ação: ${tipoAcao}
- Valor da causa: R$ ${valorCausa.toLocaleString('pt-BR')}
- Complexidade: ${complexidade}/10
- Tribunal: ${tribunal}
- Tempo estimado: ${tempoEstimadoMeses} meses

Considere:
1. Tabela de honorários da OAB
2. Práticas de mercado no Brasil
3. Complexidade do caso
4. Tempo de dedicação necessário

Forneça valor sugerido, faixa (mínimo/máximo) e comparativo com mercado.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um consultor especializado em precificação de serviços jurídicos no Brasil." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "honorarios_previsao",
          strict: true,
          schema: {
            type: "object",
            properties: {
              valorSugerido: { type: "number" },
              faixaMinima: { type: "number" },
              faixaMaxima: { type: "number" },
              percentilMercado: { type: "number" },
              mediaMercado: { type: "number" },
              confianca: { type: "number" }
            },
            required: ["valorSugerido", "faixaMinima", "faixaMaxima", "percentilMercado", "mediaMercado", "confianca"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : '{}');

    return {
      valorSugerido: result.valorSugerido,
      faixaMinima: result.faixaMinima,
      faixaMaxima: result.faixaMaxima,
      fatoresConsiderados: {
        complexidade,
        valorCausa,
        tribunal,
        tipoAcao,
        tempoEstimado: tempoEstimadoMeses,
        historicoPagamento: 85 // Simulado
      },
      comparativoMercado: {
        percentil: result.percentilMercado,
        mediaMercado: result.mediaMercado
      },
      confianca: result.confianca
    };
  }
}

// ==========================================
// MODO PÓS-AUDIÊNCIA EM 90 SEGUNDOS
// ==========================================

export class ModoPostAudiencia {
  /**
   * Gera relatório completo pós-audiência em 90 segundos
   */
  static async gerarRelatorioRapido(
    transcricao: string,
    tipoAudiencia: string,
    nomeJuiz: string,
    partes: { autor: string; reu: string }
  ): Promise<PostAudienciaReport> {
    const prompt = `Analise a transcrição da audiência de ${tipoAudiencia} presidida pelo(a) juiz(a) ${nomeJuiz}.

PARTES:
- Autor: ${partes.autor}
- Réu: ${partes.reu}

TRANSCRIÇÃO:
${transcricao}

Gere um relatório completo com:
1. Resumo executivo (máximo 3 parágrafos)
2. Pontos-chave discutidos
3. Alertas (prazos, riscos, oportunidades)
4. Tarefas automáticas com prazos
5. Indicador de risco de indeferimento (0-100) com motivos
6. Próximos passos recomendados`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um assistente jurídico especializado em análise de audiências e geração de relatórios executivos." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "relatorio_pos_audiencia",
          strict: true,
          schema: {
            type: "object",
            properties: {
              resumoExecutivo: { type: "string" },
              pontosChave: { type: "array", items: { type: "string" } },
              alertas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tipo: { type: "string" },
                    mensagem: { type: "string" },
                    urgencia: { type: "string" }
                  },
                  required: ["tipo", "mensagem", "urgencia"],
                  additionalProperties: false
                }
              },
              tarefas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    prazoDias: { type: "number" },
                    prioridade: { type: "string" }
                  },
                  required: ["titulo", "prazoDias", "prioridade"],
                  additionalProperties: false
                }
              },
              indicadorRisco: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  motivos: { type: "array", items: { type: "string" } }
                },
                required: ["score", "motivos"],
                additionalProperties: false
              },
              proximosPassos: { type: "array", items: { type: "string" } }
            },
            required: ["resumoExecutivo", "pontosChave", "alertas", "tarefas", "indicadorRisco", "proximosPassos"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : '{}');

    return {
      audienciaId: 0, // Será preenchido pelo chamador
      resumoExecutivo: result.resumoExecutivo,
      pontosChave: result.pontosChave,
      alertas: result.alertas.map((a: any) => ({
        tipo: a.tipo as 'prazo' | 'risco' | 'oportunidade',
        mensagem: a.mensagem,
        urgencia: a.urgencia as 'alta' | 'media' | 'baixa'
      })),
      tarefasAutomaticas: result.tarefas.map((t: any) => ({
        titulo: t.titulo,
        prazo: new Date(Date.now() + t.prazoDias * 24 * 60 * 60 * 1000),
        prioridade: t.prioridade as 'alta' | 'media' | 'baixa'
      })),
      indicadorRisco: result.indicadorRisco,
      proximosPassos: result.proximosPassos,
      geradoEm: new Date()
    };
  }
}

// ==========================================
// EXPORTAÇÕES
// ==========================================

export const advancedIntelligence = {
  OlhoDaLei,
  MatchDeJuizes,
  HealthScoreCalculator,
  RadarDePrazos,
  CalculadoraHonorarios,
  ModoPostAudiencia
};
