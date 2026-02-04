"use server";
import twilio from "twilio";

export const sendWhatsAppMessage = async (params: any) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

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

// Nueva función para enviar plantilla
export const sendWhatsAppTemplate = async (
  phoneNumber: string,
  templateName: string = "reporte",
) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

  try {
    const message = await client.messages.create({
      to: `whatsapp:${phoneNumber}`,
      from: fromNumber,
      contentSid: "HX6a21a471cea853361bb0a9d4e2c0ec36", // ID de tu plantilla preaprobada
      contentVariables: JSON.stringify({
        order_number: "Notificación de Reporte",
        date: new Date().toLocaleDateString(),
      }),
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("Twilio Template Error:", error);
    return { success: false, error: error.message };
  }
};
