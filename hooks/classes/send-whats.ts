"use server";
import twilio from "twilio";
import { parsePhoneNumberFromString } from "libphonenumber-js";

interface MessageTemplate {
  contentSid: string;
  contentVariables: Record<string, string>;
}

interface MessageResult {
  success: boolean;
  sid?: string;
  method?: "template" | "freeform";
  error?: string;
  code?: number;
}

// Resultado por destinatario, para saber exactamente a quién sí y a quién
// no le llegó el reporte (necesario cuando se manda a una lista).
export interface BulkMessageResult extends MessageResult {
  phoneNumber: string;
}

export interface BulkSendSummary {
  total: number;
  sent: number;
  failed: number;
  results: BulkMessageResult[];
}

class WhatsAppService {
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.client = twilio(accountSid, authToken);
    this.fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
  }

  private formatPhoneNumber(phoneNumber: string): string | null {
    const parsed = parsePhoneNumberFromString(phoneNumber, "MX");
    if (!parsed || !parsed.isValid()) return null;
    return `whatsapp:${parsed.format("E.164")}`;
  }

  private async sendTemplate(
    toNumber: string,
    template: MessageTemplate,
  ): Promise<MessageResult> {
    try {
      const message = await this.client.messages.create({
        to: toNumber,
        from: this.fromNumber,
        contentSid: template.contentSid,
        contentVariables: JSON.stringify(template.contentVariables),
      });
      console.log("Plantilla enviada con éxito");
      return { success: true, sid: message.sid, method: "template" };
    } catch (error: any) {
      console.error("Error enviando plantilla:", error);
      throw error;
    }
  }

  private async sendFreeform(
    toNumber: string,
    messageBody: string,
  ): Promise<MessageResult> {
    try {
      const message = await this.client.messages.create({
        to: toNumber,
        from: this.fromNumber,
        body: messageBody,
      });
      return { success: true, sid: message.sid, method: "freeform" };
    } catch (error: any) {
      console.error("Error enviando mensaje libre:", error);
      return { success: false, error: error.message, code: error.code };
    }
  }

  async sendMessage(
    phoneNumber: string,
    messageBody?: string,
    template?: MessageTemplate,
  ): Promise<MessageResult> {
    const toNumber = this.formatPhoneNumber(phoneNumber);
    if (!toNumber) {
      return { success: false, error: "Número de teléfono inválido" };
    }

    if (template) {
      try {
        return await this.sendTemplate(toNumber, template);
      } catch (templateError: any) {
        console.error("Intentando mensaje libre como fallback...");
        if (messageBody) {
          return await this.sendFreeform(toNumber, messageBody);
        }
        return {
          success: false,
          error: templateError.message,
          code: templateError.code,
        };
      }
    }

    if (!messageBody) {
      return {
        success: false,
        error: "No se proporcionó mensaje ni plantilla",
      };
    }

    return await this.sendFreeform(toNumber, messageBody);
  }
}

export const sendWhatsAppMessage = async (
  phoneNumber: string,
  messageBody?: string,
  template?: MessageTemplate,
): Promise<MessageResult> => {
  const service = new WhatsAppService();
  return service.sendMessage(phoneNumber, messageBody, template);
};

export const sendWhatsAppReportToMany = async (
  phoneNumbers: string[],
  messageBody?: string,
  template?: MessageTemplate,
  concurrency = 5,
): Promise<BulkSendSummary> => {
  const uniqueNumbers = Array.from(
    new Set(
      phoneNumbers.map((n) => n?.trim()).filter((n): n is string => Boolean(n)),
    ),
  );

  const service = new WhatsAppService();
  const results: BulkMessageResult[] = new Array(uniqueNumbers.length);

  for (let i = 0; i < uniqueNumbers.length; i += concurrency) {
    const batch = uniqueNumbers.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (phoneNumber) => {
        try {
          const result = await service.sendMessage(
            phoneNumber,
            messageBody,
            template,
          );
          return { ...result, phoneNumber } as BulkMessageResult;
        } catch (error: any) {
          return {
            success: false,
            phoneNumber,
            error: error?.message || "Error desconocido al enviar",
          } as BulkMessageResult;
        }
      }),
    );
    batchResults.forEach((r, idx) => {
      results[i + idx] = r;
    });
  }

  const sent = results.filter((r) => r.success).length;

  return {
    total: results.length,
    sent,
    failed: results.length - sent,
    results,
  };
};
