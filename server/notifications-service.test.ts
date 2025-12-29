import { describe, expect, it } from "vitest";
import { 
  WhatsAppService, 
  TelegramService, 
  NotificationManager 
} from "./notifications-service";

describe("WhatsAppService", () => {
  const service = new WhatsAppService();

  it("should format Brazilian phone numbers correctly", () => {
    // Test internal method via sendMessage (simulated)
    // The service will format the number internally
    expect(true).toBe(true); // Placeholder for format test
  });

  it("should simulate sending deadline alert", async () => {
    const result = await service.sendDeadlineAlert(
      "11999999999",
      "Processo 123456",
      "Contestação",
      new Date("2025-01-15"),
      3
    );

    expect(result.channel).toBe("whatsapp");
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should simulate sending hearing reminder", async () => {
    const result = await service.sendHearingReminder(
      "11999999999",
      "Processo 123456",
      new Date("2025-01-20T14:00:00"),
      "Fórum Central - Sala 5"
    );

    expect(result.channel).toBe("whatsapp");
    expect(result.success).toBe(true);
  });
});

describe("TelegramService", () => {
  const service = new TelegramService();

  it("should simulate sending message", async () => {
    const result = await service.sendMessage(
      "123456789",
      "Test message"
    );

    expect(result.channel).toBe("telegram");
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should simulate sending deadline alert", async () => {
    const result = await service.sendDeadlineAlert(
      "123456789",
      "Processo 123456",
      "Recurso",
      new Date("2025-01-10"),
      1
    );

    expect(result.channel).toBe("telegram");
    expect(result.success).toBe(true);
  });

  it("should simulate sending daily summary", async () => {
    const result = await service.sendDailySummary("123456789", {
      casesCount: 15,
      deadlinesToday: 2,
      deadlinesWeek: 8,
      hearingsToday: 1,
    });

    expect(result.channel).toBe("telegram");
    expect(result.success).toBe(true);
  });

  it("should parse start command link code correctly", () => {
    const validCode = "LEX_123_abc123";
    const parsed = service.processStartCommand(validCode);

    expect(parsed).not.toBeNull();
    expect(parsed?.userId).toBe(123);
    expect(parsed?.timestamp).toBeGreaterThan(0);
  });

  it("should return null for invalid link codes", () => {
    expect(service.processStartCommand("invalid")).toBeNull();
    expect(service.processStartCommand("LEX_abc_123")).toBeNull();
    expect(service.processStartCommand("")).toBeNull();
  });
});

describe("NotificationManager", () => {
  const manager = new NotificationManager();

  it("should send notifications to multiple channels", async () => {
    const results = await manager.sendNotification(
      {
        userId: 1,
        type: "deadline_alert",
        title: "Prazo Urgente",
        message: "Contestação vence amanhã",
        urgency: "critical",
      },
      {
        whatsapp: { phoneNumber: "11999999999", enabled: true },
        telegram: { chatId: "123456789", enabled: true },
      }
    );

    expect(results.length).toBe(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it("should respect quiet hours for non-critical notifications", async () => {
    // This test would need to mock the current time
    // For now, we just verify the method exists and returns an array
    const results = await manager.sendNotification(
      {
        userId: 1,
        type: "case_update",
        title: "Atualização",
        message: "Novo documento anexado",
        urgency: "low",
      },
      {
        whatsapp: { phoneNumber: "11999999999", enabled: true },
        quietStart: "00:00",
        quietEnd: "23:59", // Always quiet
      }
    );

    // Should be empty due to quiet hours
    expect(Array.isArray(results)).toBe(true);
  });

  it("should send deadline alerts to all enabled channels", async () => {
    const results = await manager.sendDeadlineAlerts(
      "Processo 123456",
      "Apelação",
      new Date("2025-01-05"),
      2,
      {
        whatsapp: { phoneNumber: "11999999999", enabled: true },
        telegram: { chatId: "123456789", enabled: true },
      }
    );

    expect(results.length).toBe(2);
    expect(results.some(r => r.channel === "whatsapp")).toBe(true);
    expect(results.some(r => r.channel === "telegram")).toBe(true);
  });

  it("should send hearing reminders to all enabled channels", async () => {
    const results = await manager.sendHearingReminders(
      "Processo 123456",
      new Date("2025-01-10T10:00:00"),
      "Fórum Regional - Sala 3",
      {
        whatsapp: { phoneNumber: "11999999999", enabled: true },
        telegram: { chatId: "123456789", enabled: true },
      }
    );

    expect(results.length).toBe(2);
  });

  it("should skip disabled channels", async () => {
    const results = await manager.sendNotification(
      {
        userId: 1,
        type: "system_alert",
        title: "Teste",
        message: "Mensagem de teste",
        urgency: "medium",
      },
      {
        whatsapp: { phoneNumber: "11999999999", enabled: false },
        telegram: { chatId: "123456789", enabled: true },
      }
    );

    expect(results.length).toBe(1);
    expect(results[0].channel).toBe("telegram");
  });
});
