import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  selfService = false,
}: {
  to: string
  name: string
  resetUrl: string
  selfService?: boolean
}) {
  const intro = selfService
    ? `Hi ${name}, we received a request to reset the password for your Ascend account.`
    : `Hi ${name}, an admin requested a password reset for your Ascend account.`
  return resend.emails.send({
    from: `Ascend BJJ <${FROM}>`,
    to,
    subject: 'Reset your Ascend password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#0A0A0A;">Reset your password</h2>
        <p style="margin:0 0 24px;color:#404040;font-size:14px;">${intro}</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#CC0000;color:#fff;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.05em;">
          Set New Password
        </a>
        <p style="margin:24px 0 0;color:#A3A3A3;font-size:12px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendEmailChangeConfirmation({
  to,
  name,
  newEmail,
  confirmUrl,
}: {
  to: string
  name: string
  newEmail: string
  confirmUrl: string
}) {
  return resend.emails.send({
    from: `Ascend BJJ <${FROM}>`,
    to,
    subject: 'Confirm your new email address',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 8px;font-size:20px;color:#0A0A0A;">Confirm email change</h2>
        <p style="margin:0 0 8px;color:#404040;font-size:14px;">Hi ${name}, your Ascend account email is being changed to:</p>
        <p style="margin:0 0 24px;font-weight:700;color:#0A0A0A;font-size:14px;">${newEmail}</p>
        <a href="${confirmUrl}" style="display:inline-block;padding:12px 24px;background:#CC0000;color:#fff;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.05em;">
          Confirm New Email
        </a>
        <p style="margin:24px 0 0;color:#A3A3A3;font-size:12px;">This link expires in 24 hours. If you didn't request this change, contact your gym admin.</p>
      </div>
    `,
  })
}
