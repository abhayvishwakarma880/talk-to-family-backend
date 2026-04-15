// import twilio from "twilio";

// ─── Twilio Client (Uncomment when ready to use Twilio) ────────────────────────
// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// ─── Generate Random 6-digit OTP ──────────────────────────────────────────────
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Get OTP Expiry Time ──────────────────────────────────────────────────────
export const getOtpExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  return new Date(Date.now() + minutes * 60 * 1000);
};

// ─── Send OTP ─────────────────────────────────────────────────────────────────
/**
 * @param {string} phone — Phone number with country code (e.g. "+919876543210")
 * @param {string} otp   — 6-digit OTP string
 * @returns {Promise<object>}
 */
export const sendOtp = async (phone, otp) => {
  try {
    // ✅ For development — just print OTP to console
    console.log(`\n========================================`);
    console.log(`📱 OTP for ${phone}: ${otp}`);
    console.log(`⏰ Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes`);
    console.log(`========================================\n`);

    // ──────────────────────────────────────────────────────────────
    // 🔽 TWILIO SMS — Uncomment below when ready to send real SMS
    // ──────────────────────────────────────────────────────────────
    // const message = await client.messages.create({
    //   body: `🔐 Your TalkToFamily verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes. Do NOT share this with anyone.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone,
    // });
    // console.log(`📱 OTP sent to ${phone} | SID: ${message.sid}`);
    // return { success: true, messageSid: message.sid };

    return { success: true, message: "OTP printed to console (dev mode)" };
  } catch (error) {
    console.error(`❌ OTP send failed to ${phone}:`, error.message);
    throw new Error("Failed to send OTP. Please try again.");
  }
};

export default sendOtp;
