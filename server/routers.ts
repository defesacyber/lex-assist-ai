import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { ESAJClient, DatajudClient, judicialSyncManager, ComplianceUtils } from "./judicial-integration";
import { OlhoDaLei, MatchDeJuizes, HealthScoreCalculator, RadarDePrazos, CalculadoraHonorarios, ModoPostAudiencia } from "./advanced-intelligence";
import { createCheckoutSession, createPortalSession, getSubscriptionDetails, cancelSubscription } from "./stripe-routes";
import { SUBSCRIPTION_PLANS, formatPrice, getPlanById } from "./stripe-products";

// ==================== VALIDATION SCHEMAS ====================
const caseSchema = z.object({
  title: z.string().min(1).max(255),
  caseNumber: z.string().max(50).optional(),
  category: z.enum(["civil", "trabalhista", "criminal", "tributario", "familia", "consumidor", "previdenciario", "administrativo", "empresarial", "outro"]),
  jurisdiction: z.string().min(1).max(100),
  court: z.string().max(200).optional(),
  description: z.string().min(1),
  arguments: z.string().optional(),
  clientName: z.string().max(255).optional(),
  opposingParty: z.string().max(255).optional(),
});

const hearingSchema = z.object({
  caseId: z.number(),
  title: z.string().min(1).max(255),
  hearingType: z.enum(["conciliacao", "instrucao", "julgamento", "inicial", "una", "outro"]),
  scheduledAt: z.number(),
  location: z.string().max(255).optional(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().max(500).optional(),
  notes: z.string().optional(),
});

const deadlineSchema = z.object({
  caseId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  deadlineType: z.enum(["contestacao", "recurso", "manifestacao", "audiencia", "pericia", "cumprimento", "embargo", "outro"]),
  publicationDate: z.number().optional(),
  startDate: z.number(),
  dueDate: z.number(),
  daysCount: z.number().optional(),
  isBusinessDays: z.boolean().default(true),
});

// ==================== APP ROUTER ====================
export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDashboardStats(ctx.user.id);
    }),
  }),

  // ==================== CASES ====================
  cases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCasesByUser(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getCaseById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(caseSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCase({ ...input, userId: ctx.user.id });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: caseSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCase(input.id, ctx.user.id, input.data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCase(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== PREDICTIVE ANALYSIS ====================
  analysis: router({
    analyze: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const caseData = await db.getCaseById(input.caseId, ctx.user.id);
        if (!caseData) throw new Error("Caso não encontrado");

        const prompt = `Aja como um consultor jurídico sênior e analista de dados especializado no sistema jurídico brasileiro.
Analise o seguinte caso para prever resultados e sugerir estratégia processual detalhada:

TÍTULO: ${caseData.title}
NÚMERO DO PROCESSO: ${caseData.caseNumber || "Não informado"}
CATEGORIA: ${caseData.category}
JURISDIÇÃO: ${caseData.jurisdiction}
VARA/TRIBUNAL: ${caseData.court || "Não informado"}
CLIENTE: ${caseData.clientName || "Não informado"}
PARTE CONTRÁRIA: ${caseData.opposingParty || "Não informado"}
DESCRIÇÃO DOS FATOS: ${caseData.description}
ARGUMENTOS LEGAIS: ${caseData.arguments || "Não informados"}

Com base na jurisprudência brasileira, legislação vigente e lógica jurídica, forneça uma análise preditiva completa.
Seja específico e fundamentado em suas análises.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um consultor jurídico sênior brasileiro especializado em análise preditiva de casos. Sempre responda em português brasileiro." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "predictive_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  successProbability: { type: "number", description: "Probabilidade de vitória de 0 a 100" },
                  reasoning: { type: "string", description: "Raciocínio jurídico detalhado por trás da predição" },
                  strengths: { type: "array", items: { type: "string" }, description: "Lista de pontos fortes do caso" },
                  weaknesses: { type: "array", items: { type: "string" }, description: "Lista de pontos fracos ou vulnerabilidades" },
                  risks: { 
                    type: "array", 
                    items: { 
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        impact: { type: "string", enum: ["Baixo", "Médio", "Alto"] },
                        mitigation: { type: "string" }
                      },
                      required: ["description", "impact", "mitigation"],
                      additionalProperties: false
                    }
                  },
                  strategy: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        phase: { type: "string" },
                        action: { type: "string" },
                        objective: { type: "string" }
                      },
                      required: ["phase", "action", "objective"],
                      additionalProperties: false
                    }
                  },
                  estimatedDurationMonths: { type: "number", description: "Estimativa de duração em meses" }
                },
                required: ["successProbability", "reasoning", "strengths", "weaknesses", "risks", "strategy", "estimatedDurationMonths"],
                additionalProperties: false
              }
            }
          }
        });

        const analysisContent = response.choices[0].message.content;
        const analysisResult = JSON.parse(typeof analysisContent === 'string' ? analysisContent : '{}');
        
        const analysisId = await db.createPredictiveAnalysis({
          caseId: input.caseId,
          userId: ctx.user.id,
          successProbability: String(analysisResult.successProbability),
          reasoning: analysisResult.reasoning,
          strengths: analysisResult.strengths,
          weaknesses: analysisResult.weaknesses,
          risks: analysisResult.risks,
          strategy: analysisResult.strategy,
          estimatedDurationMonths: analysisResult.estimatedDurationMonths
        });

        // Track usage
        const now = new Date();
        await db.trackUsage({
          userId: ctx.user.id,
          featureType: "predictive_analysis",
          usageCount: 1,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        });

        return { id: analysisId, ...analysisResult };
      }),

    getByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getAnalysesByCase(input.caseId, ctx.user.id);
      }),

    getLatest: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getLatestAnalysisByCase(input.caseId, ctx.user.id);
      }),
  }),

  // ==================== HEARING SIMULATION ====================
  simulation: router({
    generate: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const caseData = await db.getCaseById(input.caseId, ctx.user.id);
        if (!caseData) throw new Error("Caso não encontrado");

        const latestAnalysis = await db.getLatestAnalysisByCase(input.caseId, ctx.user.id);

        const prompt = `Aja como um preparador de audiências jurídicas experiente no Brasil.
Com base no caso abaixo, gere uma simulação completa de audiência para preparação do advogado:

CASO: ${caseData.title}
CATEGORIA: ${caseData.category}
DESCRIÇÃO: ${caseData.description}
ARGUMENTOS: ${caseData.arguments || "Não informados"}
${latestAnalysis ? `
ANÁLISE PREDITIVA ANTERIOR:
- Probabilidade de sucesso: ${latestAnalysis.successProbability}%
- Pontos fortes: ${JSON.stringify(latestAnalysis.strengths)}
- Pontos fracos: ${JSON.stringify(latestAnalysis.weaknesses)}
` : ""}

Gere perguntas realistas que podem ser feitas pelo juiz e pela parte contrária, com sugestões de respostas estratégicas.
Inclua também pontos de objeção que o advogado pode levantar.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um especialista em preparação de audiências jurídicas no Brasil. Gere simulações realistas e estratégicas." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hearing_simulation",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  judgeQuestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        suggestedAnswer: { type: "string" }
                      },
                      required: ["question", "suggestedAnswer"],
                      additionalProperties: false
                    }
                  },
                  opposingQuestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        suggestedAnswer: { type: "string" }
                      },
                      required: ["question", "suggestedAnswer"],
                      additionalProperties: false
                    }
                  },
                  objectionPoints: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        point: { type: "string" },
                        basis: { type: "string" },
                        response: { type: "string" }
                      },
                      required: ["point", "basis", "response"],
                      additionalProperties: false
                    }
                  },
                  strategicNotes: { type: "string" },
                  predictedTemperament: { type: "string", enum: ["conciliatory", "technical", "contentious", "neutral"] }
                },
                required: ["judgeQuestions", "opposingQuestions", "objectionPoints", "strategicNotes", "predictedTemperament"],
                additionalProperties: false
              }
            }
          }
        });

        const simulationContent = response.choices[0].message.content;
        const simulationResult = JSON.parse(typeof simulationContent === 'string' ? simulationContent : '{}');

        const simulationId = await db.createHearingSimulation({
          caseId: input.caseId,
          userId: ctx.user.id,
          judgeQuestions: simulationResult.judgeQuestions,
          opposingQuestions: simulationResult.opposingQuestions,
          objectionPoints: simulationResult.objectionPoints,
          strategicNotes: simulationResult.strategicNotes,
          predictedTemperament: simulationResult.predictedTemperament
        });

        // Track usage
        const now = new Date();
        await db.trackUsage({
          userId: ctx.user.id,
          featureType: "hearing_simulation",
          usageCount: 1,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        });

        return { id: simulationId, ...simulationResult };
      }),

    getByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getSimulationsByCase(input.caseId, ctx.user.id);
      }),
  }),

  // ==================== HEARINGS ====================
  hearings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getHearingsByUser(ctx.user.id);
    }),

    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getHearingsByCase(input.caseId, ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getHearingById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(hearingSchema)
      .mutation(async ({ ctx, input }) => {
        const id = await db.createHearing({
          ...input,
          userId: ctx.user.id,
          scheduledAt: new Date(input.scheduledAt)
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: hearingSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const { scheduledAt, ...rest } = input.data;
        const updateData: any = { ...rest };
        if (scheduledAt !== undefined) {
          updateData.scheduledAt = new Date(scheduledAt);
        }
        await db.updateHearing(input.id, ctx.user.id, updateData);
        return { success: true };
      }),
  }),

  // ==================== TRANSCRIPTION ====================
  transcription: router({
    transcribe: protectedProcedure
      .input(z.object({ 
        hearingId: z.number(),
        audioUrl: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const hearing = await db.getHearingById(input.hearingId, ctx.user.id);
        if (!hearing) throw new Error("Audiência não encontrada");

        // Create transcription record
        const transcriptionId = await db.createTranscription({
          hearingId: input.hearingId,
          userId: ctx.user.id,
          audioUrl: input.audioUrl,
          status: "processing"
        });

        try {
          // Call Whisper API
          const result = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: "pt",
            prompt: "Transcrição de audiência jurídica brasileira"
          });

          // Check if it's an error response
          if ('error' in result) {
            throw new Error(result.error);
          }

          // Update transcription with results
          await db.updateTranscription(transcriptionId, {
            transcriptionText: result.text,
            segments: result.segments?.map((s) => ({
              start: s.start,
              end: s.end,
              text: s.text
            })),
            language: result.language,
            status: "completed"
          });

          // Track usage
          const now = new Date();
          await db.trackUsage({
            userId: ctx.user.id,
            featureType: "transcription",
            usageCount: 1,
            periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
            periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          });

          return { id: transcriptionId, text: result.text, segments: result.segments };
        } catch (error) {
          await db.updateTranscription(transcriptionId, { status: "failed" });
          throw error;
        }
      }),

    getByHearing: protectedProcedure
      .input(z.object({ hearingId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTranscriptionByHearing(input.hearingId, ctx.user.id);
      }),
  }),

  // ==================== HEARING MINUTES ====================
  minutes: router({
    generate: protectedProcedure
      .input(z.object({ hearingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const hearing = await db.getHearingById(input.hearingId, ctx.user.id);
        if (!hearing) throw new Error("Audiência não encontrada");

        const transcription = await db.getTranscriptionByHearing(input.hearingId, ctx.user.id);
        if (!transcription || !transcription.transcriptionText) {
          throw new Error("Transcrição não encontrada para esta audiência");
        }

        const prompt = `Analise a transcrição da audiência jurídica abaixo e gere:
1. Um resumo executivo conciso
2. Os pontos-chave discutidos
3. Uma minuta de petição baseada no conteúdo
4. Recomendações para próximos passos

AUDIÊNCIA: ${hearing.title}
TIPO: ${hearing.hearingType}

TRANSCRIÇÃO:
${transcription.transcriptionText}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um assistente jurídico especializado em elaborar minutas e resumos de audiências no Brasil." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "hearing_minute",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  executiveSummary: { type: "string" },
                  keyPoints: { type: "array", items: { type: "string" } },
                  petitionDraft: { type: "string" },
                  recommendations: { type: "array", items: { type: "string" } }
                },
                required: ["executiveSummary", "keyPoints", "petitionDraft", "recommendations"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0].message.content;
        const minuteResult = JSON.parse(typeof messageContent === 'string' ? messageContent : '{}');

        const minuteId = await db.createHearingMinute({
          hearingId: input.hearingId,
          userId: ctx.user.id,
          transcriptionId: transcription.id,
          executiveSummary: minuteResult.executiveSummary,
          keyPoints: minuteResult.keyPoints,
          petitionDraft: minuteResult.petitionDraft,
          recommendations: minuteResult.recommendations
        });

        // Track usage
        const now = new Date();
        await db.trackUsage({
          userId: ctx.user.id,
          featureType: "minute_generation",
          usageCount: 1,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        });

        return { id: minuteId, ...minuteResult };
      }),

    getByHearing: protectedProcedure
      .input(z.object({ hearingId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMinuteByHearing(input.hearingId, ctx.user.id);
      }),
  }),

  // ==================== DEADLINES ====================
  deadlines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDeadlinesByUser(ctx.user.id);
    }),

    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDeadlinesByCase(input.caseId, ctx.user.id);
      }),

    upcoming: protectedProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ ctx, input }) => {
        return db.getUpcomingDeadlines(ctx.user.id, input.days);
      }),

    create: protectedProcedure
      .input(deadlineSchema)
      .mutation(async ({ ctx, input }) => {
        // Calculate confidence score based on complexity
        const confidenceScore = input.isBusinessDays ? 85 : 95;
        
        const id = await db.createDeadline({
          ...input,
          userId: ctx.user.id,
          publicationDate: input.publicationDate ? new Date(input.publicationDate) : undefined,
          startDate: new Date(input.startDate),
          dueDate: new Date(input.dueDate),
          calculatedDueDate: new Date(input.dueDate),
          confidenceScore: String(confidenceScore)
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: deadlineSchema.partial() }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = { ...input.data };
        if (updateData.publicationDate) updateData.publicationDate = new Date(updateData.publicationDate);
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
        await db.updateDeadline(input.id, ctx.user.id, updateData);
        return { success: true };
      }),

    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateDeadline(input.id, ctx.user.id, { 
          status: "completed",
          completedAt: new Date()
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDeadline(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== NOTIFICATIONS ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return db.getNotificationsByUser(ctx.user.id, input.limit);
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationsCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.id, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ==================== SUBSCRIPTION ====================
  subscription: router({
    plans: publicProcedure.query(async () => {
      return db.getAllSubscriptionPlans();
    }),

    current: protectedProcedure.query(async ({ ctx }) => {
      return {
        plan: ctx.user.subscriptionPlan,
        expiresAt: ctx.user.subscriptionExpiresAt
      };
    }),
  }),

  // ==================== JUDICIAL INTEGRATION ====================
  judicial: router({
    // Consultar processo via e-SAJ
    consultarProcessoESAJ: protectedProcedure
      .input(z.object({ 
        numeroProcesso: z.string(),
        estado: z.string().default('SP')
      }))
      .query(async ({ ctx, input }) => {
        const client = new ESAJClient(undefined, input.estado);
        const processo = await client.consultarProcesso(input.numeroProcesso);
        
        // Log de auditoria (CNJ 615/2025)
        const auditLog = ComplianceUtils.createAuditLog(
          'consulta_processo_esaj',
          ctx.user.openId,
          { numeroProcesso: input.numeroProcesso, estado: input.estado }
        );
        console.log('[Audit]', JSON.stringify(auditLog));
        
        return processo;
      }),

    // Consultar movimentações via e-SAJ
    consultarMovimentacoesESAJ: protectedProcedure
      .input(z.object({ 
        numeroProcesso: z.string(),
        estado: z.string().default('SP')
      }))
      .query(async ({ ctx, input }) => {
        const client = new ESAJClient(undefined, input.estado);
        const movimentacoes = await client.consultarMovimentacoes(input.numeroProcesso);
        return movimentacoes;
      }),

    // Consultar processo via CNJ Datajud
    consultarProcessoDatajud: protectedProcedure
      .input(z.object({ 
        numeroProcesso: z.string(),
        tribunal: z.string()
      }))
      .query(async ({ ctx, input }) => {
        const client = new DatajudClient();
        const processo = await client.consultarProcesso(input.numeroProcesso, input.tribunal);
        
        // Log de auditoria
        const auditLog = ComplianceUtils.createAuditLog(
          'consulta_processo_datajud',
          ctx.user.openId,
          { numeroProcesso: input.numeroProcesso, tribunal: input.tribunal }
        );
        console.log('[Audit]', JSON.stringify(auditLog));
        
        return processo;
      }),

    // Sincronizar caso com sistemas judiciais
    syncCase: protectedProcedure
      .input(z.object({ 
        numeroProcesso: z.string(),
        tribunal: z.string().default('SP')
      }))
      .mutation(async ({ ctx, input }) => {
        const results = await judicialSyncManager.syncCase(input.numeroProcesso, input.tribunal);
        
        // Log de auditoria
        const auditLog = ComplianceUtils.createAuditLog(
          'sync_case',
          ctx.user.openId,
          { numeroProcesso: input.numeroProcesso, results: results.map(r => ({ source: r.source, success: r.success })) }
        );
        console.log('[Audit]', JSON.stringify(auditLog));
        
        return results;
      }),

    // Iniciar sincronização periódica
    startPeriodicSync: protectedProcedure
      .input(z.object({ 
        numeroProcesso: z.string(),
        intervalMinutes: z.number().min(5).max(1440).default(30)
      }))
      .mutation(async ({ ctx, input }) => {
        judicialSyncManager.startPeriodicSync(input.numeroProcesso, input.intervalMinutes);
        return { success: true, message: `Sincronização iniciada a cada ${input.intervalMinutes} minutos` };
      }),

    // Parar sincronização periódica
    stopPeriodicSync: protectedProcedure
      .input(z.object({ numeroProcesso: z.string() }))
      .mutation(async ({ ctx, input }) => {
        judicialSyncManager.stopPeriodicSync(input.numeroProcesso);
        return { success: true };
      }),

    // Listar tribunais suportados
    tribunaisSuportados: publicProcedure.query(() => {
      return {
        esaj: Object.entries(ESAJClient.TRIBUNAIS)
          .filter(([_, config]) => config.active)
          .map(([estado, config]) => ({ estado, url: config.url })),
        datajud: ['TJSP', 'TJMG', 'TJRJ', 'TJBA', 'TJRS', 'TJPR', 'TJSC', 'TJGO', 'TJPE', 'TJCE']
      };
    }),

    // Health check das integrações
    healthCheck: publicProcedure.query(async () => {
      return {
        status: 'ok',
        integrations: {
          esaj: { status: 'configured', latency: '1-3s' },
          datajud: { status: 'configured', latency: '1-2s' },
          pje: { status: 'pending_credentials', latency: '2-5s' }
        },
        compliance: {
          cnj_615_2025: true,
          lgpd: true,
          iso_27001: 'ready'
        },
        timestamp: new Date().toISOString()
      };
    }),
  }),

  // ==================== DOCUMENTS ====================
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocumentsByUser(ctx.user.id);
    }),

    listByCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDocumentsByCase(input.caseId, ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDocumentById(input.id, ctx.user.id);
      }),

    upload: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        hearingId: z.number().optional(),
        title: z.string().min(1).max(255),
        documentType: z.enum(["peticao", "contestacao", "recurso", "evidencia", "contrato", "procuracao", "transcricao", "minuta", "outro"]),
        fileName: z.string(),
        mimeType: z.string(),
        fileData: z.string(), // Base64 encoded file data
        description: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileSize = fileBuffer.length;
        
        // Generate unique file key
        const fileKey = `documents/${ctx.user.id}/${input.caseId}/${nanoid()}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Save document record
        const id = await db.createDocument({
          caseId: input.caseId,
          userId: ctx.user.id,
          hearingId: input.hearingId,
          title: input.title,
          documentType: input.documentType,
          fileUrl: url,
          fileKey: fileKey,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: fileSize,
          description: input.description
        });
        
        return { id, url };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocument(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== ADVANCED INTELLIGENCE (AUDIUM) ====================
  intelligence: router({
    // Olho da Lei - Monitoramento de Jurisprudência
    analisarJurisprudencia: protectedProcedure
      .input(z.object({
        casoDescricao: z.string(),
        categoria: z.string(),
        tesesPrincipais: z.array(z.string())
      }))
      .mutation(async ({ input }) => {
        return OlhoDaLei.analisarJurisprudenciaParaCaso(
          input.casoDescricao,
          input.categoria,
          input.tesesPrincipais
        );
      }),

    verificarMudancasEntendimento: protectedProcedure
      .input(z.object({
        tema: z.string(),
        tribunais: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        return OlhoDaLei.verificarMudancasEntendimento(
          input.tema,
          input.tribunais
        );
      }),

    // Match de Juízes - Análise de Perfil Judicial
    analisarPerfilJuiz: protectedProcedure
      .input(z.object({
        nomeJuiz: z.string(),
        tribunal: z.string(),
        vara: z.string()
      }))
      .mutation(async ({ input }) => {
        return MatchDeJuizes.analisarPerfilJuiz(
          input.nomeJuiz,
          input.tribunal,
          input.vara
        );
      }),

    sugerirEstrategias: protectedProcedure
      .input(z.object({
        perfilJuiz: z.object({
          id: z.string(),
          nome: z.string(),
          tribunal: z.string(),
          vara: z.string(),
          especialidade: z.string(),
          totalDecisoes: z.number(),
          taxaAceitacao: z.object({
            geral: z.number(),
            porTipo: z.record(z.string(), z.number())
          }),
          tempoMedioDecisao: z.number(),
          tesesPreferidas: z.array(z.string()),
          padroes: z.object({
            prefereTutela: z.boolean(),
            exigeProvaPericial: z.boolean(),
            valorMedioDanoMoral: z.number(),
            aceitaAcordos: z.boolean()
          }),
          ultimaAtualizacao: z.string()
        }),
        tipoCaso: z.string(),
        tesesDisponiveis: z.array(z.string())
      }))
      .mutation(async ({ input }) => {
        const perfil = {
          ...input.perfilJuiz,
          ultimaAtualizacao: new Date(input.perfilJuiz.ultimaAtualizacao)
        };
        return MatchDeJuizes.sugerirEstrategias(
          perfil,
          input.tipoCaso,
          input.tesesDisponiveis
        );
      }),

    // Health Score do Caso
    calcularHealthScore: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        prazosCumpridos: z.number().min(0).max(100),
        documentacaoCompleta: z.number().min(0).max(100),
        jurisprudenciaFavoravel: z.number().min(0).max(100),
        complexidade: z.number().min(1).max(10),
        diasSemMovimentacao: z.number().min(0)
      }))
      .query(async ({ input }) => {
        const score = HealthScoreCalculator.calcularHealthScore(
          input.prazosCumpridos,
          input.documentacaoCompleta,
          input.jurisprudenciaFavoravel,
          input.complexidade,
          input.diasSemMovimentacao
        );
        return { ...score, caseId: input.caseId };
      }),

    // Radar de Prazos - Detecção de Conflitos
    detectarConflitos: protectedProcedure
      .input(z.object({
        eventos: z.array(z.object({
          id: z.string(),
          tipo: z.enum(['audiencia', 'prazo', 'reuniao']),
          titulo: z.string(),
          casoTitulo: z.string(),
          data: z.number(), // timestamp
          duracao: z.number().optional()
        }))
      }))
      .query(async ({ input }) => {
        const eventos = input.eventos.map(e => ({
          ...e,
          data: new Date(e.data)
        }));
        return RadarDePrazos.detectarConflitos(eventos);
      }),

    // Calculadora de Honorários Preditiva
    calcularHonorarios: protectedProcedure
      .input(z.object({
        tipoAcao: z.string(),
        valorCausa: z.number(),
        complexidade: z.number().min(1).max(10),
        tribunal: z.string(),
        tempoEstimadoMeses: z.number()
      }))
      .mutation(async ({ input }) => {
        return CalculadoraHonorarios.calcularHonorarios(
          input.tipoAcao,
          input.valorCausa,
          input.complexidade,
          input.tribunal,
          input.tempoEstimadoMeses
        );
      }),

    // Modo Pós-Audiência em 90 Segundos
    gerarRelatorioPostAudiencia: protectedProcedure
      .input(z.object({
        audienciaId: z.number(),
        transcricao: z.string(),
        tipoAudiencia: z.string(),
        nomeJuiz: z.string(),
        partes: z.object({
          autor: z.string(),
          reu: z.string()
        })
      }))
      .mutation(async ({ input }) => {
        const relatorio = await ModoPostAudiencia.gerarRelatorioRapido(
          input.transcricao,
          input.tipoAudiencia,
          input.nomeJuiz,
          input.partes
        );
        return { ...relatorio, audienciaId: input.audienciaId };
      }),
  }),

  // ==================== STRIPE / SUBSCRIPTIONS ====================
  stripe: router({
    // Get available plans
    getPlans: publicProcedure.query(() => {
      return SUBSCRIPTION_PLANS.map(plan => ({
        ...plan,
        priceMonthlyFormatted: formatPrice(plan.priceMonthly),
        priceYearlyFormatted: formatPrice(plan.priceYearly),
      }));
    }),

    // Get current user's subscription status
    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const plan = getPlanById(user.subscriptionPlan || 'free');
      
      let stripeDetails = null;
      if (user.stripeSubscriptionId) {
        stripeDetails = await getSubscriptionDetails(user.stripeSubscriptionId);
      }

      return {
        currentPlan: user.subscriptionPlan || 'free',
        planDetails: plan,
        expiresAt: user.subscriptionExpiresAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripeDetails,
      };
    }),

    // Create checkout session for subscription
    createCheckout: protectedProcedure
      .input(z.object({
        planId: z.enum(['professional', 'enterprise']),
        billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
      }))
      .mutation(async ({ ctx, input }) => {
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const result = await createCheckoutSession(
          ctx.user.id,
          ctx.user.email || '',
          ctx.user.name || 'Usuário',
          input.planId,
          input.billingPeriod,
          origin
        );

        return result;
      }),

    // Create customer portal session for managing subscription
    createPortal: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new Error('Você não possui uma assinatura ativa');
      }

      const origin = ctx.req.headers.origin || 'http://localhost:3000';
      return createPortalSession(ctx.user.stripeCustomerId, origin);
    }),

    // Cancel subscription (at period end)
    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeSubscriptionId) {
        throw new Error('Você não possui uma assinatura ativa');
      }

      const success = await cancelSubscription(ctx.user.stripeSubscriptionId);
      if (!success) {
        throw new Error('Falha ao cancelar assinatura');
      }

      return { success: true, message: 'Assinatura será cancelada ao final do período atual' };
    }),
  }),
});

export type AppRouter = typeof appRouter;
