import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "advogado@teste.com",
    name: "Dr. João Silva",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Dashboard Stats", () => {
  it("returns dashboard statistics for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("totalCases");
    expect(stats).toHaveProperty("activeCases");
    expect(stats).toHaveProperty("upcomingDeadlines");
    expect(stats).toHaveProperty("upcomingHearings");
    expect(typeof stats.totalCases).toBe("number");
    expect(typeof stats.activeCases).toBe("number");
  });
});

describe("Cases Router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const cases = await caller.cases.list();

    expect(Array.isArray(cases)).toBe(true);
  });
});

describe("Deadlines Router", () => {
  it("returns empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const deadlines = await caller.deadlines.list();

    expect(Array.isArray(deadlines)).toBe(true);
  });

  it("returns upcoming deadlines within specified days", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const upcoming = await caller.deadlines.upcoming({ days: 7 });

    expect(Array.isArray(upcoming)).toBe(true);
  });
});

describe("Notifications Router", () => {
  it("returns notifications list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.list({ limit: 10 });

    expect(Array.isArray(notifications)).toBe(true);
  });

  it("returns unread count", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.notifications.unreadCount();

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("Subscription Router", () => {
  it("returns available plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.subscription.plans();

    expect(Array.isArray(plans)).toBe(true);
  });

  it("returns current subscription status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const current = await caller.subscription.current();

    expect(current).toHaveProperty("plan");
    expect(current).toHaveProperty("expiresAt");
  });
});
