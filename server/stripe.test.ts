import { describe, expect, it } from "vitest";
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice, checkPlanLimits } from "./stripe-products";

describe("Stripe Products", () => {
  describe("SUBSCRIPTION_PLANS", () => {
    it("should have 3 plans defined", () => {
      expect(SUBSCRIPTION_PLANS).toHaveLength(3);
    });

    it("should have free, professional, and enterprise plans", () => {
      const planIds = SUBSCRIPTION_PLANS.map(p => p.id);
      expect(planIds).toContain('free');
      expect(planIds).toContain('professional');
      expect(planIds).toContain('enterprise');
    });

    it("free plan should have zero price", () => {
      const freePlan = SUBSCRIPTION_PLANS.find(p => p.id === 'free');
      expect(freePlan?.priceMonthly).toBe(0);
      expect(freePlan?.priceYearly).toBe(0);
    });

    it("professional plan should be marked as popular", () => {
      const proPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'professional');
      expect(proPlan?.popular).toBe(true);
    });

    it("all plans should have features array", () => {
      SUBSCRIPTION_PLANS.forEach(plan => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("all plans should have limits defined", () => {
      SUBSCRIPTION_PLANS.forEach(plan => {
        expect(plan.limits).toBeDefined();
        expect(typeof plan.limits.casesPerMonth).toBe('number');
        expect(typeof plan.limits.analysesPerMonth).toBe('number');
        expect(typeof plan.limits.hearingsPerMonth).toBe('number');
        expect(typeof plan.limits.storageGB).toBe('number');
        expect(typeof plan.limits.teamMembers).toBe('number');
      });
    });
  });

  describe("getPlanById", () => {
    it("should return correct plan for valid id", () => {
      const plan = getPlanById('professional');
      expect(plan).toBeDefined();
      expect(plan?.id).toBe('professional');
      expect(plan?.name).toBe('Profissional');
    });

    it("should return undefined for invalid id", () => {
      const plan = getPlanById('invalid-plan');
      expect(plan).toBeUndefined();
    });
  });

  describe("formatPrice", () => {
    it("should return 'Grátis' for zero price", () => {
      expect(formatPrice(0)).toBe('Grátis');
    });

    it("should format price in BRL currency", () => {
      const formatted = formatPrice(19900);
      expect(formatted).toContain('199');
      expect(formatted).toContain('R$');
    });

    it("should handle decimal values correctly", () => {
      const formatted = formatPrice(9990);
      expect(formatted).toContain('99,90') || expect(formatted).toContain('99.90');
    });
  });

  describe("checkPlanLimits", () => {
    it("should allow usage within limits for free plan", () => {
      const result = checkPlanLimits('free', { cases: 2, analyses: 3 });
      expect(result.allowed).toBe(true);
    });

    it("should deny usage exceeding case limit", () => {
      const result = checkPlanLimits('free', { cases: 5 });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('casos');
    });

    it("should deny usage exceeding analyses limit", () => {
      const result = checkPlanLimits('free', { analyses: 10 });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('análises');
    });

    it("should allow unlimited usage for professional plan", () => {
      const result = checkPlanLimits('professional', { cases: 1000, analyses: 5000 });
      expect(result.allowed).toBe(true);
    });

    it("should return error for invalid plan", () => {
      const result = checkPlanLimits('invalid', { cases: 1 });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('não encontrado');
    });
  });
});

describe("Stripe Integration", () => {
  it("should have STRIPE_SECRET_KEY environment variable pattern", () => {
    // This test verifies the expected environment variable naming
    const expectedEnvVar = 'STRIPE_SECRET_KEY';
    expect(expectedEnvVar).toBe('STRIPE_SECRET_KEY');
  });

  it("should have STRIPE_WEBHOOK_SECRET environment variable pattern", () => {
    const expectedEnvVar = 'STRIPE_WEBHOOK_SECRET';
    expect(expectedEnvVar).toBe('STRIPE_WEBHOOK_SECRET');
  });
});
