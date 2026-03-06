"use server";
import twilio from "twilio";

export const sendWhatsAppMessage = async (params: any) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const fromNumber = `${process.env.TWILIO_WHATSAPP_NUMBER}`;

  try {
    // Intentar enviar mensaje libre primero
    const message = await client.messages.create({
      ...params,
      from: `whatsapp:${fromNumber}`,
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    // Si hay error 63016 (fuera de ventana), enviar plantilla primero
    if (error.code === 63016) {
      throw new Error("OUTSIDE_WINDOW");
    }

    console.error("Twilio Error:", error);
    return { success: false, error: error.message };
  }
};

export const sendWhatsAppTemplate = async (
  phoneNumber: string,
  contentSid: string,
  contentVariables: Record<string, string>,
) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

  try {
    const message = await client.messages.create({
      to: `whatsapp:${phoneNumber}`,
      from: fromNumber,
      contentSid: contentSid,
      contentVariables: JSON.stringify(contentVariables), // Twilio requiere string
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("Error enviando plantilla WhatsApp:", error);
    return { success: false, error: error.message };
  }
};
