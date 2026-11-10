import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


const templates = {
  PHONE_VERIFY: (code) => ({
    subject: "PaySafe — Your Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verify your phone</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your PaySafe account.</p>
        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center;">
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0070f3; margin: 0;">${code}</p>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">
          Valid for <strong>10 minutes</strong>. Never share this code with anyone — PaySafe will never ask for it.
        </p>
      </div>
    `,
  }),

  EMAIL_VERIFY: (code) => ({
    subject: "PaySafe — Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #555; margin-bottom: 24px;">Use the code below to verify your email address.</p>
        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; text-align: center;">
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0070f3; margin: 0;">${code}</p>
        </div>
        <p style="color: #888; font-size: 13px; margin-top: 24px;">
          Valid for <strong>10 minutes</strong>. Never share this code with anyone — PaySafe will never ask for it.
        </p>
      </div>
    `,
  }),
};


export const sendEmail = async (to, purpose, code) => {
  if (process.env.NODE_ENV === "development") {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email → ${to}`);
    console.log(` OTP Code: ${code}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true, dev: true };
  }

  const template = templates[purpose]?.(code);
  if (!template) throw new Error(`Unknown email purpose: ${purpose}`);

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
    });

    return { success: true, id: result.id };
  } catch (error) {
    console.error("Email delivery failed:", error.message);
    return { success: false, error: error.message };
  }
};