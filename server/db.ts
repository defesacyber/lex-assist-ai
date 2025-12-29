import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  cases, InsertCase, Case,
  predictiveAnalyses, InsertPredictiveAnalysis,
  hearingSimulations, InsertHearingSimulation,
  hearings, InsertHearing,
  transcriptions, InsertTranscription,
  hearingMinutes, InsertHearingMinute,
  deadlines, InsertDeadline,
  documents, InsertDocument,
  notifications, InsertNotification,
  brazilianHolidays, InsertBrazilianHoliday,
  subscriptionPlans,
  usageTracking, InsertUsageTracking
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSubscription(userId: number, plan: "free" | "professional" | "enterprise", expiresAt?: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ 
    subscriptionPlan: plan, 
    subscriptionExpiresAt: expiresAt 
  }).where(eq(users.id, userId));
}

// ==================== CASE QUERIES ====================
export async function createCase(data: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cases).values(data);
  return result[0].insertId;
}

export async function getCasesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.updatedAt));
}

export async function getCaseById(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(and(eq(cases.id, caseId), eq(cases.userId, userId))).limit(1);
  return result[0];
}

export async function updateCase(caseId: number, userId: number, data: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cases).set(data).where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
}

export async function deleteCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cases).where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
}

// ==================== PREDICTIVE ANALYSIS QUERIES ====================
export async function createPredictiveAnalysis(data: InsertPredictiveAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(predictiveAnalyses).values(data);
  return result[0].insertId;
}

export async function getAnalysesByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(predictiveAnalyses)
    .where(and(eq(predictiveAnalyses.caseId, caseId), eq(predictiveAnalyses.userId, userId)))
    .orderBy(desc(predictiveAnalyses.createdAt));
}

export async function getLatestAnalysisByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(predictiveAnalyses)
    .where(and(eq(predictiveAnalyses.caseId, caseId), eq(predictiveAnalyses.userId, userId)))
    .orderBy(desc(predictiveAnalyses.createdAt))
    .limit(1);
  return result[0];
}

// ==================== HEARING SIMULATION QUERIES ====================
export async function createHearingSimulation(data: InsertHearingSimulation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hearingSimulations).values(data);
  return result[0].insertId;
}

export async function getSimulationsByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearingSimulations)
    .where(and(eq(hearingSimulations.caseId, caseId), eq(hearingSimulations.userId, userId)))
    .orderBy(desc(hearingSimulations.createdAt));
}

// ==================== HEARING QUERIES ====================
export async function createHearing(data: InsertHearing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hearings).values(data);
  return result[0].insertId;
}

export async function getHearingsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings).where(eq(hearings.userId, userId)).orderBy(desc(hearings.scheduledAt));
}

export async function getHearingsByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings)
    .where(and(eq(hearings.caseId, caseId), eq(hearings.userId, userId)))
    .orderBy(desc(hearings.scheduledAt));
}

export async function getHearingById(hearingId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hearings)
    .where(and(eq(hearings.id, hearingId), eq(hearings.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateHearing(hearingId: number, userId: number, data: Partial<InsertHearing>) {
  const db = await getDb();
  if (!db) return;
  await db.update(hearings).set(data).where(and(eq(hearings.id, hearingId), eq(hearings.userId, userId)));
}

// ==================== TRANSCRIPTION QUERIES ====================
export async function createTranscription(data: InsertTranscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(transcriptions).values(data);
  return result[0].insertId;
}

export async function getTranscriptionByHearing(hearingId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(transcriptions)
    .where(and(eq(transcriptions.hearingId, hearingId), eq(transcriptions.userId, userId)))
    .orderBy(desc(transcriptions.createdAt))
    .limit(1);
  return result[0];
}

export async function updateTranscription(transcriptionId: number, data: Partial<InsertTranscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(transcriptions).set(data).where(eq(transcriptions.id, transcriptionId));
}

// ==================== HEARING MINUTES QUERIES ====================
export async function createHearingMinute(data: InsertHearingMinute) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(hearingMinutes).values(data);
  return result[0].insertId;
}

export async function getMinuteByHearing(hearingId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(hearingMinutes)
    .where(and(eq(hearingMinutes.hearingId, hearingId), eq(hearingMinutes.userId, userId)))
    .limit(1);
  return result[0];
}

// ==================== DEADLINE QUERIES ====================
export async function createDeadline(data: InsertDeadline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deadlines).values(data);
  return result[0].insertId;
}

export async function getDeadlinesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deadlines).where(eq(deadlines.userId, userId)).orderBy(deadlines.dueDate);
}

export async function getDeadlinesByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deadlines)
    .where(and(eq(deadlines.caseId, caseId), eq(deadlines.userId, userId)))
    .orderBy(deadlines.dueDate);
}

export async function getUpcomingDeadlines(userId: number, daysAhead: number = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  return db.select().from(deadlines)
    .where(and(
      eq(deadlines.userId, userId),
      eq(deadlines.status, "pending"),
      gte(deadlines.dueDate, now),
      lte(deadlines.dueDate, futureDate)
    ))
    .orderBy(deadlines.dueDate);
}

export async function updateDeadline(deadlineId: number, userId: number, data: Partial<InsertDeadline>) {
  const db = await getDb();
  if (!db) return;
  await db.update(deadlines).set(data).where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId)));
}

export async function deleteDeadline(deadlineId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(deadlines).where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId)));
}

// ==================== DOCUMENT QUERIES ====================
export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return result[0].insertId;
}

export async function getDocumentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentsByCase(caseId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.userId, userId)))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);
  return result[0];
}

export async function deleteDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documents).where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
}

// ==================== NOTIFICATION QUERIES ====================
export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function getNotificationsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationsCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ==================== HOLIDAY QUERIES ====================
export async function getHolidaysByYear(year: number, state?: string) {
  const db = await getDb();
  if (!db) return [];
  if (state) {
    return db.select().from(brazilianHolidays)
      .where(and(
        eq(brazilianHolidays.year, year),
        sql`(${brazilianHolidays.scope} = 'national' OR ${brazilianHolidays.state} = ${state})`
      ));
  }
  return db.select().from(brazilianHolidays)
    .where(and(eq(brazilianHolidays.year, year), eq(brazilianHolidays.scope, "national")));
}

export async function createHoliday(data: InsertBrazilianHoliday) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(brazilianHolidays).values(data);
}

// ==================== SUBSCRIPTION PLAN QUERIES ====================
export async function getAllSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

export async function getSubscriptionPlanByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, name)).limit(1);
  return result[0];
}

// ==================== USAGE TRACKING QUERIES ====================
export async function trackUsage(data: InsertUsageTracking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(usageTracking).values(data);
}

export async function getUserUsageThisMonth(userId: number, featureType: string) {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const result = await db.select({ total: sql<number>`SUM(${usageTracking.usageCount})` })
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.featureType, featureType as any),
      gte(usageTracking.periodStart, startOfMonth),
      lte(usageTracking.periodEnd, endOfMonth)
    ));
  return result[0]?.total ?? 0;
}

// ==================== DASHBOARD STATS ====================
export async function getUserDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalCases: 0, activeCases: 0, upcomingDeadlines: 0, upcomingHearings: 0 };
  
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [casesResult, deadlinesResult, hearingsResult] = await Promise.all([
    db.select({ 
      total: sql<number>`count(*)`,
      active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`
    }).from(cases).where(eq(cases.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(deadlines)
      .where(and(
        eq(deadlines.userId, userId),
        eq(deadlines.status, "pending"),
        gte(deadlines.dueDate, now),
        lte(deadlines.dueDate, nextWeek)
      )),
    db.select({ count: sql<number>`count(*)` }).from(hearings)
      .where(and(
        eq(hearings.userId, userId),
        eq(hearings.status, "scheduled"),
        gte(hearings.scheduledAt, now),
        lte(hearings.scheduledAt, nextWeek)
      ))
  ]);

  return {
    totalCases: casesResult[0]?.total ?? 0,
    activeCases: casesResult[0]?.active ?? 0,
    upcomingDeadlines: deadlinesResult[0]?.count ?? 0,
    upcomingHearings: hearingsResult[0]?.count ?? 0
  };
}
