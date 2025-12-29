import { describe, expect, it } from "vitest";
import { ComplianceUtils, ESAJClient } from "./judicial-integration";

describe("Judicial Integration Module", () => {
  describe("ESAJClient", () => {
    it("should have correct tribunais configuration", () => {
      const tribunais = ESAJClient.TRIBUNAIS;
      
      expect(tribunais).toBeDefined();
      expect(tribunais['SP']).toBeDefined();
      expect(tribunais['SP'].active).toBe(true);
      expect(tribunais['SP'].url).toContain('tjsp');
    });

    it("should list active tribunais", () => {
      const activeTribunais = Object.entries(ESAJClient.TRIBUNAIS)
        .filter(([_, config]) => config.active)
        .map(([estado]) => estado);
      
      expect(activeTribunais).toContain('SP');
      expect(activeTribunais).toContain('MG');
      expect(activeTribunais).toContain('RJ');
      expect(activeTribunais.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("ComplianceUtils", () => {
    it("should generate document hash", () => {
      const content = Buffer.from("Test document content");
      const hash = ComplianceUtils.generateDocumentHash(content);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it("should generate consistent hash for same content", () => {
      const content = Buffer.from("Same content");
      const hash1 = ComplianceUtils.generateDocumentHash(content);
      const hash2 = ComplianceUtils.generateDocumentHash(content);
      
      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different content", () => {
      const content1 = Buffer.from("Content 1");
      const content2 = Buffer.from("Content 2");
      const hash1 = ComplianceUtils.generateDocumentHash(content1);
      const hash2 = ComplianceUtils.generateDocumentHash(content2);
      
      expect(hash1).not.toBe(hash2);
    });

    it("should create audit log with required fields", () => {
      const auditLog = ComplianceUtils.createAuditLog(
        "test_operation",
        "user-123",
        { key: "value" }
      );
      
      expect(auditLog).toBeDefined();
      expect(auditLog.timestamp).toBeDefined();
      expect(auditLog.operation).toBe("test_operation");
      expect(auditLog.userId).toBe("user-123");
      expect(auditLog.details).toEqual({ key: "value" });
      expect(auditLog.hash).toBeDefined();
      expect(auditLog.hash.length).toBe(64);
    });

    it("should anonymize CPF", () => {
      const data = "CPF: 123.456.789-00";
      const anonymized = ComplianceUtils.anonymizePersonalData(data);
      
      expect(anonymized).toBe("CPF: ***.***.***-**");
      expect(anonymized).not.toContain("123");
    });

    it("should anonymize CNPJ", () => {
      const data = "CNPJ: 12.345.678/0001-90";
      const anonymized = ComplianceUtils.anonymizePersonalData(data);
      
      expect(anonymized).toBe("CNPJ: **.***.***/**-**");
      expect(anonymized).not.toContain("12.345");
    });

    it("should anonymize email", () => {
      const data = "Email: test@example.com";
      const anonymized = ComplianceUtils.anonymizePersonalData(data);
      
      expect(anonymized).toBe("Email: ***@***.***");
      expect(anonymized).not.toContain("test@example");
    });

    it("should anonymize phone number", () => {
      const data = "Telefone: (11) 99999-8888";
      const anonymized = ComplianceUtils.anonymizePersonalData(data);
      
      expect(anonymized).toBe("Telefone: (**) *****-****");
      expect(anonymized).not.toContain("99999");
    });

    it("should anonymize multiple personal data in same string", () => {
      const data = "Nome: João, CPF: 123.456.789-00, Email: joao@email.com";
      const anonymized = ComplianceUtils.anonymizePersonalData(data);
      
      expect(anonymized).toContain("Nome: João");
      expect(anonymized).toContain("***.***.***-**");
      expect(anonymized).toContain("***@***.***");
    });
  });
});
