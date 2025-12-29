import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "professional", "enterprise"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  // Stripe integration fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  // Onboarding fields
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  // Notification preferences
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  whatsappEnabled: boolean("whatsappEnabled").default(false).notNull(),
  telegramChatId: varchar("telegramChatId", { length: 50 }),
  telegramEnabled: boolean("telegramEnabled").default(false).notNull(),
  notificationQuietStart: varchar("notificationQuietStart", { length: 5 }), // HH:MM format
  notificationQuietEnd: varchar("notificationQuietEnd", { length: 5 }), // HH:MM format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== CASES (Casos Jurídicos) ====================
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  caseNumber: varchar("caseNumber", { length: 50 }),
  category: mysqlEnum("category", [
    "civil", "trabalhista", "criminal", "tributario", "familia", 
    "consumidor", "previdenciario", "administrativo", "empresarial", "outro"
  ]).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(),
  court: varchar("court", { length: 200 }),
  description: text("description").notNull(),
  arguments: text("arguments"),
  clientName: varchar("clientName", { length: 255 }),
  opposingParty: varchar("opposingParty", { length: 255 }),
  status: mysqlEnum("status", ["active", "archived", "closed", "won", "lost"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ==================== PREDICTIVE ANALYSIS (Análises Preditivas) ====================
export const predictiveAnalyses = mysqlTable("predictive_analyses", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  successProbability: decimal("successProbability", { precision: 5, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  strengths: json("strengths").$type<string[]>().notNull(),
  weaknesses: json("weaknesses").$type<string[]>().notNull(),
  risks: json("risks").$type<Array<{ description: string; impact: string; mitigation: string }>>().notNull(),
  strategy: json("strategy").$type<Array<{ phase: string; action: string; objective: string }>>().notNull(),
  estimatedDurationMonths: int("estimatedDurationMonths"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PredictiveAnalysis = typeof predictiveAnalyses.$inferSelect;
export type InsertPredictiveAnalysis = typeof predictiveAnalyses.$inferInsert;

// ==================== HEARING SIMULATIONS (Simulações de Audiência) ====================
export const hearingSimulations = mysqlTable("hearing_simulations", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  judgeQuestions: json("judgeQuestions").$type<Array<{ question: string; suggestedAnswer: string }>>().notNull(),
  opposingQuestions: json("opposingQuestions").$type<Array<{ question: string; suggestedAnswer: string }>>().notNull(),
  objectionPoints: json("objectionPoints").$type<Array<{ point: string; basis: string; response: string }>>().notNull(),
  strategicNotes: text("strategicNotes"),
  predictedTemperament: mysqlEnum("predictedTemperament", ["conciliatory", "technical", "contentious", "neutral"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HearingSimulation = typeof hearingSimulations.$inferSelect;
export type InsertHearingSimulation = typeof hearingSimulations.$inferInsert;

// ==================== HEARINGS (Audiências) ====================
export const hearings = mysqlTable("hearings", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  hearingType: mysqlEnum("hearingType", ["conciliacao", "instrucao", "julgamento", "inicial", "una", "outro"]).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  location: varchar("location", { length: 255 }),
  isVirtual: boolean("isVirtual").default(false).notNull(),
  virtualLink: varchar("virtualLink", { length: 500 }),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = typeof hearings.$inferInsert;

// ==================== TRANSCRIPTIONS (Transcrições) ====================
export const transcriptions = mysqlTable("transcriptions", {
  id: int("id").autoincrement().primaryKey(),
  hearingId: int("hearingId").notNull(),
  userId: int("userId").notNull(),
  audioUrl: varchar("audioUrl", { length: 500 }),
  audioFileKey: varchar("audioFileKey", { length: 255 }),
  transcriptionText: text("transcriptionText"),
  segments: json("segments").$type<Array<{ start: number; end: number; text: string }>>(),
  language: varchar("language", { length: 10 }).default("pt"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;

// ==================== HEARING MINUTES (Minutas Pós-Audiência) ====================
export const hearingMinutes = mysqlTable("hearing_minutes", {
  id: int("id").autoincrement().primaryKey(),
  hearingId: int("hearingId").notNull(),
  userId: int("userId").notNull(),
  transcriptionId: int("transcriptionId"),
  executiveSummary: text("executiveSummary").notNull(),
  keyPoints: json("keyPoints").$type<string[]>().notNull(),
  petitionDraft: text("petitionDraft"),
  recommendations: json("recommendations").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HearingMinute = typeof hearingMinutes.$inferSelect;
export type InsertHearingMinute = typeof hearingMinutes.$inferInsert;

// ==================== DEADLINES (Prazos Processuais) ====================
export const deadlines = mysqlTable("deadlines", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadlineType: mysqlEnum("deadlineType", [
    "contestacao", "recurso", "manifestacao", "audiencia", 
    "pericia", "cumprimento", "embargo", "outro"
  ]).notNull(),
  publicationDate: timestamp("publicationDate"),
  startDate: timestamp("startDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  calculatedDueDate: timestamp("calculatedDueDate"),
  daysCount: int("daysCount"),
  isBusinessDays: boolean("isBusinessDays").default(true).notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["pending", "completed", "overdue", "cancelled"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  alert7Days: boolean("alert7Days").default(false).notNull(),
  alert3Days: boolean("alert3Days").default(false).notNull(),
  alert1Day: boolean("alert1Day").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = typeof deadlines.$inferInsert;

// ==================== DOCUMENTS (Documentos) ====================
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  hearingId: int("hearingId"),
  title: varchar("title", { length: 255 }).notNull(),
  documentType: mysqlEnum("documentType", [
    "peticao", "contestacao", "recurso", "evidencia", 
    "contrato", "procuracao", "transcricao", "minuta", "outro"
  ]).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ==================== NOTIFICATIONS (Notificações) ====================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  notificationType: mysqlEnum("notificationType", [
    "deadline_alert", "hearing_reminder", "analysis_complete", 
    "system", "subscription"
  ]).notNull(),
  relatedEntityType: varchar("relatedEntityType", { length: 50 }),
  relatedEntityId: int("relatedEntityId"),
  isRead: boolean("isRead").default(false).notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ==================== BRAZILIAN HOLIDAYS (Feriados Brasileiros) ====================
export const brazilianHolidays = mysqlTable("brazilian_holidays", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  scope: mysqlEnum("scope", ["national", "state", "municipal", "judicial"]).notNull(),
  state: varchar("state", { length: 2 }),
  city: varchar("city", { length: 100 }),
  court: varchar("court", { length: 100 }),
  year: int("year").notNull(),
});

export type BrazilianHoliday = typeof brazilianHolidays.$inferSelect;
export type InsertBrazilianHoliday = typeof brazilianHolidays.$inferInsert;

// ==================== SUBSCRIPTION PLANS (Planos de Assinatura) ====================
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  description: text("description"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }),
  maxCases: int("maxCases"),
  maxAnalysesPerMonth: int("maxAnalysesPerMonth"),
  maxSimulationsPerMonth: int("maxSimulationsPerMonth"),
  maxTranscriptionMinutes: int("maxTranscriptionMinutes"),
  hasRealTimeAssistant: boolean("hasRealTimeAssistant").default(false).notNull(),
  hasDatajudIntegration: boolean("hasDatajudIntegration").default(false).notNull(),
  hasEmailAlerts: boolean("hasEmailAlerts").default(false).notNull(),
  hasPrioritySupport: boolean("hasPrioritySupport").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ==================== USAGE TRACKING (Rastreamento de Uso) ====================
export const usageTracking = mysqlTable("usage_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  featureType: mysqlEnum("featureType", [
    "predictive_analysis", "hearing_simulation", "transcription", 
    "minute_generation", "datajud_query"
  ]).notNull(),
  usageCount: int("usageCount").default(1).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;
