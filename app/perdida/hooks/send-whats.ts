"use server";
import twilio from "twilio";

export const sendWhatsAppMessage = async (params: any) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      ...params,
      from: fromNumber,
    });

    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("Twilio Error:", error);
    return { success: false, error: error.message };
  }
};
