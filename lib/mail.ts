import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.MAIL_FROM ?? 'onboarding@resend.dev';
const toOverride = process.env.MAIL_TO_OVERRIDE;

const resend = apiKey ? new Resend(apiKey) : null;

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailParams) {
  if (!resend) {
    console.warn(
      `[mail] RESEND_API_KEY not set — skipping mail to ${to} ("${subject}")`
    );
    return { skipped: true as const };
  }

  const recipient = toOverride || to;

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: recipient,
      subject: toOverride ? `[원래 수신자: ${to}] ${subject}` : subject,
      html,
    });
    if (result.error) {
      console.error('[mail] send failed', {
        to: recipient,
        subject,
        error: result.error,
      });
      return { error: result.error };
    }
    return { id: result.data?.id };
  } catch (error) {
    console.error('[mail] send threw', { to: recipient, subject, error });
    return { error };
  }
}
