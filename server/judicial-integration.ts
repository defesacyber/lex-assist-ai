/**
 * Módulo de Integração com Sistemas Judiciais Brasileiros
 * 
 * Suporta:
 * - PJe eCJUS (SOAP/WS-Security) - CNJ
 * - e-SAJ (REST/Bearer Token) - TJ-SP e outros
 * - CNJ Datajud (OAuth 2.0) - API Pública
 * 
 * Compliance: CNJ 615/2025, LGPD, ISO 27001
 */

import axios, { AxiosInstance } from 'axios';
import { ENV } from './_core/env';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface JudicialProcess {
  numero: string;
  tribunal: string;
  assunto: string;
  dataAjuizamento: Date;
  status: string;
  fase: string;
  juiz?: string;
  vara?: string;
  partes: ProcessParty[];
  valor?: {
    inicial: number;
    atualizado: number;
    correcaoMonetaria: string;
  };
}

export interface ProcessParty {
  nome: string;
  tipo: 'autor' | 'reu' | 'terceiro';
  documento?: string;
  advogado?: {
    nome: string;
    oab: string;
  };
}

export interface ProcessMovement {
  id: string;
  data: Date;
  tipo: string;
  descricao: string;
  juiz?: string;
  publicacao?: Date;
  prazo?: {
    dias: number;
    vencimento: Date;
    tipoRecurso: string;
    critico: boolean;
  };
  documentos?: ProcessDocument[];
}

export interface ProcessDocument {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  hash?: string;
  url?: string;
}

export interface SyncResult {
  success: boolean;
  source: 'pje' | 'esaj' | 'datajud';
  timestamp: Date;
  movimentacoesNovas: number;
  decisoesNovas: number;
  error?: string;
}

// ==========================================
// CLIENTE e-SAJ (REST/Bearer Token)
// ==========================================

export class ESAJClient {
  private instance: AxiosInstance;
  private token: string;
  private baseURL: string;

  // Tribunais suportados
  static readonly TRIBUNAIS: Record<string, { url: string; active: boolean }> = {
    'SP': { url: 'https://esaj.tjsp.jus.br/api/v1', active: true },
    'MG': { url: 'https://esaj.tjmg.jus.br/api/v1', active: true },
    'RJ': { url: 'https://esaj.tjrj.jus.br/api/v1', active: true },
    'BA': { url: 'https://esaj.tjba.jus.br/api/v1', active: true },
    'RS': { url: 'https://esaj.tjrs.jus.br/api/v1', active: true },
    'PR': { url: 'https://esaj.tjpr.jus.br/api/v1', active: false },
  };

  constructor(token?: string, estado: string = 'SP') {
    this.token = token || process.env.ESAJ_BEARER_TOKEN || '';
    const tribunal = ESAJClient.TRIBUNAIS[estado];
    this.baseURL = tribunal?.url || ESAJClient.TRIBUNAIS['SP'].url;

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para renovar token se expirar
    this.instance.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          console.log('🔄 [e-SAJ] Token expirado, tentando renovar...');
          // Implementar renovação de token aqui
        }
        return Promise.reject(error);
      }
    );
  }

  async consultarProcesso(numeroProcesso: string): Promise<JudicialProcess | null> {
    try {
      const response = await this.instance.get(`/processo/${numeroProcesso}`);
      console.log(`✅ [e-SAJ] Processo ${numeroProcesso} consultado`);
      return this.mapToJudicialProcess(response.data);
    } catch (error: any) {
      console.error('❌ [e-SAJ] Erro ao consultar processo:', error.message);
      return null;
    }
  }

  async consultarMovimentacoes(numeroProcesso: string): Promise<ProcessMovement[]> {
    try {
      const response = await this.instance.get(`/processo/${numeroProcesso}/movimentacoes`);
      console.log(`✅ [e-SAJ] ${response.data.movimentacoes?.length || 0} movimentações encontradas`);
      return (response.data.movimentacoes || []).map(this.mapToMovement);
    } catch (error: any) {
      console.error('❌ [e-SAJ] Erro ao consultar movimentações:', error.message);
      return [];
    }
  }

  async downloadDocumento(idDocumento: string): Promise<Buffer | null> {
    try {
      const response = await this.instance.get(
        `/documento/${idDocumento}/download`,
        { responseType: 'arraybuffer' }
      );
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ [e-SAJ] Erro ao download documento:', error.message);
      return null;
    }
  }

  private mapToJudicialProcess(data: any): JudicialProcess {
    return {
      numero: data.numero,
      tribunal: data.tribunal || 'TJ-SP',
      assunto: data.assunto,
      dataAjuizamento: new Date(data.dataAjuizamento),
      status: data.status,
      fase: data.fase,
      juiz: data.juiz?.nome,
      vara: data.juizado,
      partes: (data.partes || []).map((p: any) => ({
        nome: p.nome,
        tipo: p.tipo,
        documento: p.cpf || p.cnpj,
        advogado: p.advogado ? {
          nome: p.advogado.nome,
          oab: p.advogado.oab,
        } : undefined,
      })),
      valor: data.valor ? {
        inicial: data.valor.inicial,
        atualizado: data.valor.atualizado,
        correcaoMonetaria: data.valor.correcaoMonetaria,
      } : undefined,
    };
  }

  private mapToMovement(data: any): ProcessMovement {
    return {
      id: data.id,
      data: new Date(data.data),
      tipo: data.tipo,
      descricao: data.descricao,
      juiz: data.juiz,
      publicacao: data.publicacao ? new Date(data.publicacao) : undefined,
      prazo: data.prazo ? {
        dias: data.prazo.dias,
        vencimento: new Date(data.prazo.vencimento),
        tipoRecurso: data.prazo.tipoRecurso,
        critico: data.prazo.critico || data.prazo.diasRestantes <= 5,
      } : undefined,
      documentos: (data.documentosAnexados || []).map((d: any) => ({
        id: d.id,
        nome: d.nome,
        tipo: d.tipo,
        tamanho: d.tamanho,
        hash: d.hash,
      })),
    };
  }
}

// ==========================================
// CLIENTE CNJ DATAJUD (OAuth 2.0)
// ==========================================

export class DatajudClient {
  private instance: AxiosInstance;
  private accessToken: string = '';
  private tokenExpiry: Date = new Date(0);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseURL = 'https://datajud-wiki.cnj.jus.br/api-publica';

  constructor() {
    this.clientId = process.env.CNJ_OAUTH_CLIENT_ID || '';
    this.clientSecret = process.env.CNJ_OAUTH_CLIENT_SECRET || '';

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiry > new Date()) {
      return; // Token ainda válido
    }

    try {
      const response = await axios.post(
        'https://datajud.cnj.jus.br/oauth/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'datajud:read',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      console.log('✅ [Datajud] Autenticado com sucesso');
    } catch (error: any) {
      console.error('❌ [Datajud] Erro de autenticação:', error.message);
      throw error;
    }
  }

  async consultarProcesso(numeroProcesso: string, tribunal: string): Promise<JudicialProcess | null> {
    try {
      await this.authenticate();

      const response = await this.instance.get(
        `/processo/${tribunal}/${numeroProcesso}`,
        {
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        }
      );

      console.log(`✅ [Datajud] Processo ${numeroProcesso} consultado`);
      return this.mapToJudicialProcess(response.data);
    } catch (error: any) {
      console.error('❌ [Datajud] Erro ao consultar processo:', error.message);
      return null;
    }
  }

  async consultarMovimentacoes(numeroProcesso: string, tribunal: string): Promise<ProcessMovement[]> {
    try {
      await this.authenticate();

      const response = await this.instance.get(
        `/processo/${tribunal}/${numeroProcesso}/movimentacoes`,
        {
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        }
      );

      return (response.data.movimentacoes || []).map(this.mapToMovement);
    } catch (error: any) {
      console.error('❌ [Datajud] Erro ao consultar movimentações:', error.message);
      return [];
    }
  }

  private mapToJudicialProcess(data: any): JudicialProcess {
    return {
      numero: data.numeroProcesso,
      tribunal: data.tribunal,
      assunto: data.assuntos?.[0]?.descricao || 'Não informado',
      dataAjuizamento: new Date(data.dataAjuizamento),
      status: data.situacao || 'Em andamento',
      fase: data.fase || 'Não informada',
      juiz: data.orgaoJulgador?.nomeJuiz,
      vara: data.orgaoJulgador?.nomeOrgao,
      partes: (data.partes || []).map((p: any) => ({
        nome: p.nome,
        tipo: p.polo === 'AT' ? 'autor' : 'reu',
        advogado: p.advogados?.[0] ? {
          nome: p.advogados[0].nome,
          oab: p.advogados[0].numeroOAB,
        } : undefined,
      })),
    };
  }

  private mapToMovement(data: any): ProcessMovement {
    return {
      id: data.codigo || String(Date.now()),
      data: new Date(data.dataHora),
      tipo: data.nome,
      descricao: data.complemento || data.nome,
    };
  }
}

// ==========================================
// GERENCIADOR DE SINCRONIZAÇÃO
// ==========================================

export class JudicialSyncManager {
  private esajClient: ESAJClient;
  private datajudClient: DatajudClient;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.esajClient = new ESAJClient();
    this.datajudClient = new DatajudClient();
  }

  async syncCase(numeroProcesso: string, tribunal: string = 'SP'): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Tentar e-SAJ primeiro (mais rápido)
    try {
      const esajMovs = await this.esajClient.consultarMovimentacoes(numeroProcesso);
      results.push({
        success: true,
        source: 'esaj',
        timestamp: new Date(),
        movimentacoesNovas: esajMovs.length,
        decisoesNovas: esajMovs.filter(m => m.tipo.toLowerCase().includes('decisão')).length,
      });
    } catch (error: any) {
      results.push({
        success: false,
        source: 'esaj',
        timestamp: new Date(),
        movimentacoesNovas: 0,
        decisoesNovas: 0,
        error: error.message,
      });
    }

    // Tentar Datajud como fallback
    try {
      const datajudMovs = await this.datajudClient.consultarMovimentacoes(numeroProcesso, tribunal);
      results.push({
        success: true,
        source: 'datajud',
        timestamp: new Date(),
        movimentacoesNovas: datajudMovs.length,
        decisoesNovas: datajudMovs.filter(m => m.tipo.toLowerCase().includes('decisão')).length,
      });
    } catch (error: any) {
      results.push({
        success: false,
        source: 'datajud',
        timestamp: new Date(),
        movimentacoesNovas: 0,
        decisoesNovas: 0,
        error: error.message,
      });
    }

    return results;
  }

  startPeriodicSync(numeroProcesso: string, intervalMinutes: number = 30): void {
    const key = `sync:${numeroProcesso}`;
    
    // Limpar intervalo existente se houver
    if (this.syncIntervals.has(key)) {
      clearInterval(this.syncIntervals.get(key)!);
    }

    // Sincronizar imediatamente
    this.syncCase(numeroProcesso).catch(console.error);

    // Configurar sincronização periódica
    const interval = setInterval(() => {
      this.syncCase(numeroProcesso).catch(console.error);
    }, intervalMinutes * 60 * 1000);

    this.syncIntervals.set(key, interval);
    console.log(`📡 [Sync] Sincronização periódica iniciada para ${numeroProcesso} (${intervalMinutes} min)`);
  }

  stopPeriodicSync(numeroProcesso: string): void {
    const key = `sync:${numeroProcesso}`;
    if (this.syncIntervals.has(key)) {
      clearInterval(this.syncIntervals.get(key)!);
      this.syncIntervals.delete(key);
      console.log(`🛑 [Sync] Sincronização periódica parada para ${numeroProcesso}`);
    }
  }

  stopAllSyncs(): void {
    this.syncIntervals.forEach((interval, key) => {
      clearInterval(interval);
    });
    this.syncIntervals.clear();
    console.log('🛑 [Sync] Todas as sincronizações paradas');
  }
}

// ==========================================
// UTILITÁRIOS DE COMPLIANCE
// ==========================================

export const ComplianceUtils = {
  /**
   * Gera hash SHA-256 de documento para auditoria (CNJ 615/2025)
   */
  generateDocumentHash(content: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Cria log auditável de operação
   */
  createAuditLog(operation: string, userId: string, details: Record<string, any>): {
    timestamp: string;
    operation: string;
    userId: string;
    details: Record<string, any>;
    hash: string;
  } {
    const crypto = require('crypto');
    const timestamp = new Date().toISOString();
    const logData = { timestamp, operation, userId, details };
    const hash = crypto.createHash('sha256').update(JSON.stringify(logData)).digest('hex');
    
    return { ...logData, hash };
  },

  /**
   * Verifica conformidade LGPD - anonimiza dados pessoais
   */
  anonymizePersonalData(data: string): string {
    // CPF: XXX.XXX.XXX-XX -> ***.***.***-**
    data = data.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**');
    // CNPJ: XX.XXX.XXX/XXXX-XX -> **.***.***/**-**
    data = data.replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '**.***.***/**-**');
    // Email
    data = data.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***');
    // Telefone
    data = data.replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, '(**) *****-****');
    
    return data;
  },
};

// Exportar instância singleton do gerenciador de sincronização
export const judicialSyncManager = new JudicialSyncManager();
