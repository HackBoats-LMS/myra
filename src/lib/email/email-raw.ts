import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface RawSendOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Plain-HTML email send used for content without a React template (e.g.
 * contact form messages). Mirrors sendEmail's dev mock behavior.
 */
export async function resendSend({ to, subject, html }: RawSendOptions) {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("=========================================");
      console.log("📧 MOCK EMAIL SENT");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("=========================================");
    }
    return;
  }
  await resend.emails.send({
    from: "Myra Shopping Mall <noreply@myra.com>",
    to,
    subject,
    html,
  });
}
