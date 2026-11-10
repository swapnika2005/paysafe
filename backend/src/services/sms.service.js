import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSms = async (phone, message) => {
  if (process.env.NODE_ENV === "development") {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(` SMS → ${phone}`);
    console.log(` ${message}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true, dev: true };
  }

  try {
    const recipient = phone.startsWith("+") ? phone : `+91${phone}`;
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient,
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    // Don't crash the app — log and continue
    console.error("SMS delivery failed:", error.message);
    return { success: false, error: error.message };
  }
};