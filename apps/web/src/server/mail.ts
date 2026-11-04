import "server-only";

/** Email goes out through Resend when RESEND_API_KEY and REMIND_FROM ("Storyling <hello@your-domain>") are set. */
export const mailEnabled = () => !!process.env.RESEND_API_KEY && !!process.env.REMIND_FROM;

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!mailEnabled()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.REMIND_FROM, to, subject, text }),
  });
  return res.ok;
}
