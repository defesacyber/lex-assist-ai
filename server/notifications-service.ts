/**
 * LexAssist AI - Notification Service
 * 
 * Integração com WhatsApp (via Twilio/Meta API) e Telegram Bot API
 * para envio de alertas de prazos e notificações em tempo real.
 */

import axios from 'axios';

// ==================== INTERFACES ====================
export interface NotificationPayload {
  userId: number;
  type: 'deadline_alert' | 'hearing_reminder' | 'case_update' | 'system_alert';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface WhatsAppConfig {
  phoneNumber: string;
  enabled: boolean;
}

export interface TelegramConfig {
  chatId: string;
  enabled: boolean;
}

export interface NotificationResult {
  channel: 'whatsapp' | 'telegram' | 'email' | 'in_app';
  success: boolean;
  messageId?: string;
  error?: string;
}

// ==================== WHATSAPP SERVICE ====================
export class WhatsAppService {
  private apiUrl: string;
  private apiKey: string;
  private fromNumber: string;

  constructor() {
    // In production, these would come from environment variables
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.apiKey = process.env.WHATSAPP_API_KEY || '';
    this.fromNumber = process.env.WHATSAPP_FROM_NUMBER || '';
  }

  /**
   * Formata número de telefone para o padrão internacional
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Adiciona código do país se não existir
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Envia mensagem via WhatsApp Business API
   */
  async sendMessage(toPhone: string, message: string, templateName?: string): Promise<NotificationResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(toPhone);
      
      // Se não houver API key configurada, simula o envio
      if (!this.apiKey) {
        console.log(`[WhatsApp] Simulando envio para ${formattedPhone}: ${message}`);
        return {
          channel: 'whatsapp',
          success: true,
          messageId: `sim_${Date.now()}`,
        };
      }

      const payload = templateName ? {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: message }]
            }
          ]
        }
      } : {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.fromNumber}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        channel: 'whatsapp',
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error: any) {
      console.error('[WhatsApp] Erro ao enviar mensagem:', error.message);
      return {
        channel: 'whatsapp',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Envia alerta de prazo via WhatsApp
   */
  async sendDeadlineAlert(
    toPhone: string, 
    caseTitle: string, 
    deadlineTitle: string, 
    dueDate: Date,
    daysRemaining: number
  ): Promise<NotificationResult> {
    const urgencyEmoji = daysRemaining <= 1 ? '🚨' : daysRemaining <= 3 ? '⚠️' : '📅';
    const formattedDate = dueDate.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    const message = `${urgencyEmoji} *ALERTA DE PRAZO - LexAssist AI*

📋 *Caso:* ${caseTitle}
📝 *Prazo:* ${deadlineTitle}
📆 *Vencimento:* ${formattedDate}
⏰ *Restam:* ${daysRemaining} dia(s)

${daysRemaining <= 1 ? '‼️ ATENÇÃO: Prazo vence AMANHÃ!' : ''}

Acesse o LexAssist AI para mais detalhes.`;

    return this.sendMessage(toPhone, message);
  }

  /**
   * Envia lembrete de audiência via WhatsApp
   */
  async sendHearingReminder(
    toPhone: string,
    caseTitle: string,
    hearingDate: Date,
    location: string
  ): Promise<NotificationResult> {
    const formattedDate = hearingDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `⚖️ *LEMBRETE DE AUDIÊNCIA - LexAssist AI*

📋 *Caso:* ${caseTitle}
📆 *Data/Hora:* ${formattedDate}
📍 *Local:* ${location}

💡 Dica: Use o Simulador de Audiência do LexAssist AI para se preparar!`;

    return this.sendMessage(toPhone, message);
  }
}

// ==================== TELEGRAM SERVICE ====================
export class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Envia mensagem via Telegram Bot API
   */
  async sendMessage(chatId: string, message: string, parseMode: 'HTML' | 'Markdown' = 'Markdown'): Promise<NotificationResult> {
    try {
      // Se não houver bot token configurado, simula o envio
      if (!this.botToken) {
        console.log(`[Telegram] Simulando envio para ${chatId}: ${message}`);
        return {
          channel: 'telegram',
          success: true,
          messageId: `sim_${Date.now()}`,
        };
      }

      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      });

      return {
        channel: 'telegram',
        success: true,
        messageId: response.data.result?.message_id?.toString(),
      };
    } catch (error: any) {
      console.error('[Telegram] Erro ao enviar mensagem:', error.message);
      return {
        channel: 'telegram',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Envia alerta de prazo via Telegram
   */
  async sendDeadlineAlert(
    chatId: string,
    caseTitle: string,
    deadlineTitle: string,
    dueDate: Date,
    daysRemaining: number
  ): Promise<NotificationResult> {
    const urgencyEmoji = daysRemaining <= 1 ? '🚨' : daysRemaining <= 3 ? '⚠️' : '📅';
    const formattedDate = dueDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    const message = `${urgencyEmoji} *ALERTA DE PRAZO - LexAssist AI*

📋 *Caso:* ${caseTitle}
📝 *Prazo:* ${deadlineTitle}
📆 *Vencimento:* ${formattedDate}
⏰ *Restam:* ${daysRemaining} dia(s)

${daysRemaining <= 1 ? '‼️ ATENÇÃO: Prazo vence AMANHÃ!' : ''}`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Envia lembrete de audiência via Telegram
   */
  async sendHearingReminder(
    chatId: string,
    caseTitle: string,
    hearingDate: Date,
    location: string
  ): Promise<NotificationResult> {
    const formattedDate = hearingDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `⚖️ *LEMBRETE DE AUDIÊNCIA - LexAssist AI*

📋 *Caso:* ${caseTitle}
📆 *Data/Hora:* ${formattedDate}
📍 *Local:* ${location}

💡 Use o Simulador de Audiência para se preparar!`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Envia resumo diário via Telegram
   */
  async sendDailySummary(
    chatId: string,
    summary: {
      casesCount: number;
      deadlinesToday: number;
      deadlinesWeek: number;
      hearingsToday: number;
    }
  ): Promise<NotificationResult> {
    const message = `📊 *RESUMO DIÁRIO - LexAssist AI*

📁 Casos ativos: ${summary.casesCount}
⏰ Prazos hoje: ${summary.deadlinesToday}
📅 Prazos esta semana: ${summary.deadlinesWeek}
⚖️ Audiências hoje: ${summary.hearingsToday}

Acesse o dashboard para mais detalhes.`;

    return this.sendMessage(chatId, message);
  }

  /**
   * Processa comando /start do bot (vinculação de conta)
   */
  processStartCommand(linkCode: string): { userId: number; timestamp: number } | null {
    // Formato esperado: LEX_{userId}_{timestamp}
    const match = linkCode.match(/^LEX_(\d+)_([a-z0-9]+)$/);
    if (!match) return null;

    return {
      userId: parseInt(match[1], 10),
      timestamp: parseInt(match[2], 36),
    };
  }
}

// ==================== NOTIFICATION MANAGER ====================
export class NotificationManager {
  private whatsapp: WhatsAppService;
  private telegram: TelegramService;

  constructor() {
    this.whatsapp = new WhatsAppService();
    this.telegram = new TelegramService();
  }

  /**
   * Verifica se está dentro do horário de silêncio
   */
  private isQuietHours(quietStart?: string, quietEnd?: string): boolean {
    if (!quietStart || !quietEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Lida com período que cruza meia-noite
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Envia notificação para todos os canais configurados do usuário
   */
  async sendNotification(
    payload: NotificationPayload,
    userSettings: {
      whatsapp?: WhatsAppConfig;
      telegram?: TelegramConfig;
      quietStart?: string;
      quietEnd?: string;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Verifica horário de silêncio (exceto para urgência crítica)
    if (payload.urgency !== 'critical' && this.isQuietHours(userSettings.quietStart, userSettings.quietEnd)) {
      console.log(`[NotificationManager] Notificação adiada - horário de silêncio`);
      return results;
    }

    // Envia via WhatsApp se configurado
    if (userSettings.whatsapp?.enabled && userSettings.whatsapp.phoneNumber) {
      const result = await this.whatsapp.sendMessage(
        userSettings.whatsapp.phoneNumber,
        `*${payload.title}*\n\n${payload.message}`
      );
      results.push(result);
    }

    // Envia via Telegram se configurado
    if (userSettings.telegram?.enabled && userSettings.telegram.chatId) {
      const result = await this.telegram.sendMessage(
        userSettings.telegram.chatId,
        `*${payload.title}*\n\n${payload.message}`
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Envia alertas de prazo para todos os canais
   */
  async sendDeadlineAlerts(
    caseTitle: string,
    deadlineTitle: string,
    dueDate: Date,
    daysRemaining: number,
    userSettings: {
      whatsapp?: WhatsAppConfig;
      telegram?: TelegramConfig;
      quietStart?: string;
      quietEnd?: string;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Determina urgência baseada nos dias restantes
    const urgency = daysRemaining <= 1 ? 'critical' : daysRemaining <= 3 ? 'high' : 'medium';

    // Verifica horário de silêncio (exceto para urgência crítica)
    if (urgency !== 'critical' && this.isQuietHours(userSettings.quietStart, userSettings.quietEnd)) {
      return results;
    }

    // WhatsApp
    if (userSettings.whatsapp?.enabled && userSettings.whatsapp.phoneNumber) {
      const result = await this.whatsapp.sendDeadlineAlert(
        userSettings.whatsapp.phoneNumber,
        caseTitle,
        deadlineTitle,
        dueDate,
        daysRemaining
      );
      results.push(result);
    }

    // Telegram
    if (userSettings.telegram?.enabled && userSettings.telegram.chatId) {
      const result = await this.telegram.sendDeadlineAlert(
        userSettings.telegram.chatId,
        caseTitle,
        deadlineTitle,
        dueDate,
        daysRemaining
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Envia lembretes de audiência para todos os canais
   */
  async sendHearingReminders(
    caseTitle: string,
    hearingDate: Date,
    location: string,
    userSettings: {
      whatsapp?: WhatsAppConfig;
      telegram?: TelegramConfig;
    }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // WhatsApp
    if (userSettings.whatsapp?.enabled && userSettings.whatsapp.phoneNumber) {
      const result = await this.whatsapp.sendHearingReminder(
        userSettings.whatsapp.phoneNumber,
        caseTitle,
        hearingDate,
        location
      );
      results.push(result);
    }

    // Telegram
    if (userSettings.telegram?.enabled && userSettings.telegram.chatId) {
      const result = await this.telegram.sendHearingReminder(
        userSettings.telegram.chatId,
        caseTitle,
        hearingDate,
        location
      );
      results.push(result);
    }

    return results;
  }
}

// Exporta instâncias singleton
export const whatsappService = new WhatsAppService();
export const telegramService = new TelegramService();
export const notificationManager = new NotificationManager();
