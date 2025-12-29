import { describe, expect, it } from "vitest";
import { 
  HealthScoreCalculator, 
  RadarDePrazos, 
  CalculadoraHonorarios 
} from "./advanced-intelligence";

describe("HealthScoreCalculator", () => {
  it("calculates health score correctly for a healthy case", () => {
    const result = HealthScoreCalculator.calcularHealthScore(
      90, // prazosCumpridos
      85, // documentacaoCompleta
      75, // jurisprudenciaFavoravel
      3,  // complexidade
      5   // diasSemMovimentacao
    );

    expect(result.score).toBeGreaterThan(70);
    expect(result.tendencia).toBeDefined();
    expect(result.fatores).toBeDefined();
    expect(result.fatores.prazosCumpridos).toBe(90);
    expect(result.fatores.documentacaoCompleta).toBe(85);
    expect(result.fatores.jurisprudenciaFavoravel).toBe(75);
    expect(result.alertas).toBeInstanceOf(Array);
    expect(result.recomendacoes).toBeInstanceOf(Array);
  });

  it("generates alerts for cases with issues", () => {
    const result = HealthScoreCalculator.calcularHealthScore(
      50, // prazosCumpridos - baixo
      40, // documentacaoCompleta - baixo
      30, // jurisprudenciaFavoravel - baixo
      8,  // complexidade - alta
      45  // diasSemMovimentacao - muitos dias
    );

    expect(result.score).toBeLessThan(50);
    expect(result.alertas.length).toBeGreaterThan(0);
    expect(result.recomendacoes.length).toBeGreaterThan(0);
  });

  it("identifies improving trend", () => {
    const result = HealthScoreCalculator.calcularHealthScore(
      95, // prazosCumpridos
      90, // documentacaoCompleta
      85, // jurisprudenciaFavoravel
      2,  // complexidade
      2   // diasSemMovimentacao
    );

    expect(result.tendencia).toBe("melhorando");
  });

  it("identifies worsening trend", () => {
    const result = HealthScoreCalculator.calcularHealthScore(
      30, // prazosCumpridos
      25, // documentacaoCompleta
      20, // jurisprudenciaFavoravel
      9,  // complexidade
      60  // diasSemMovimentacao
    );

    expect(result.tendencia).toBe("piorando");
  });
});

describe("RadarDePrazos", () => {
  it("detects conflicts between events on the same day", () => {
    const eventos = [
      {
        id: "1",
        tipo: "audiencia" as const,
        titulo: "Audiência Caso A",
        casoTitulo: "Caso A",
        data: new Date("2025-01-15T10:00:00"),
        duracao: 120
      },
      {
        id: "2",
        tipo: "audiencia" as const,
        titulo: "Audiência Caso B",
        casoTitulo: "Caso B",
        data: new Date("2025-01-15T11:00:00"),
        duracao: 90
      }
    ];

    const result = RadarDePrazos.detectarConflitos(eventos);

    // RadarDePrazos retorna um array de conflitos
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].tipo).toBe("audiencia");
  });

  it("detects multiple deadlines on the same day", () => {
    const eventos = [
      {
        id: "1",
        tipo: "prazo" as const,
        titulo: "Prazo Contestação",
        casoTitulo: "Caso A",
        data: new Date("2025-01-20T23:59:00")
      },
      {
        id: "2",
        tipo: "prazo" as const,
        titulo: "Prazo Recurso",
        casoTitulo: "Caso B",
        data: new Date("2025-01-20T23:59:00")
      },
      {
        id: "3",
        tipo: "prazo" as const,
        titulo: "Prazo Manifestação",
        casoTitulo: "Caso C",
        data: new Date("2025-01-20T23:59:00")
      }
    ];

    const result = RadarDePrazos.detectarConflitos(eventos);

    // RadarDePrazos retorna um array de conflitos
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns no conflicts for well-spaced events", () => {
    const eventos = [
      {
        id: "1",
        tipo: "audiencia" as const,
        titulo: "Audiência Caso A",
        casoTitulo: "Caso A",
        data: new Date("2025-01-15T10:00:00"),
        duracao: 60
      },
      {
        id: "2",
        tipo: "prazo" as const,
        titulo: "Prazo Caso B",
        casoTitulo: "Caso B",
        data: new Date("2025-01-20T23:59:00")
      }
    ];

    const result = RadarDePrazos.detectarConflitos(eventos);

    expect(result.length).toBe(0);
  });
});

describe("CalculadoraHonorarios", () => {
  // CalculadoraHonorarios usa LLM, então testamos apenas a estrutura
  // Em produção, esses testes seriam integração com mock do LLM
  
  it("is a class with calcularHonorarios method", () => {
    expect(CalculadoraHonorarios).toBeDefined();
    expect(typeof CalculadoraHonorarios.calcularHonorarios).toBe("function");
  });

  it("calcularHonorarios returns a promise", () => {
    const result = CalculadoraHonorarios.calcularHonorarios(
      "indenizatoria",
      100000,
      5,
      "TJSP",
      12
    );

    expect(result).toBeInstanceOf(Promise);
  });
});
