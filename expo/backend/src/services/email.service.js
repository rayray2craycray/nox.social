/**
 * Email Service
 *
 * Provider-agnostic transactional email over SMTP (nodemailer). Works with any
 * SMTP provider — Mailgun, Postmark, Amazon SES, SendGrid, Gmail, etc. — by
 * setting env vars only; no provider SDK lock-in.
 *
 * Required env to actually send:
 *   SMTP_HOST, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_PORT   (default 587; 465 implies TLS)
 *   SMTP_SECURE ("true" to force TLS regardless of port)
 *   SMTP_FROM   (from address; defaults to SMTP_USER)
 *   EMAIL_FROM_NAME (display name; default "Nox")
 *
 * With no SMTP_HOST, every send logs to the console (dev mode) and resolves
 * successfully, so local flows work without a mail provider.
 */

const nodemailer = require('nodemailer');

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Nox';
const SUPPORT_EMAIL = 'support@nox.social';

function fromAddress() {
  const addr = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nox.social';
  return `"${FROM_NAME}" <${addr}>`;
}

// A single transporter, created lazily and reused. Returns null when SMTP is
// not configured so callers fall back to console logging.
let _transporter;
let _transporterResolved = false;
function getTransporter() {
  if (_transporterResolved) return _transporter;
  _transporterResolved = true;

  if (!process.env.SMTP_HOST) {
    console.warn('[email] SMTP not configured — emails will be logged to console only.');
    _transporter = null;
    return _transporter;
  }

  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
}

// ---------------------------------------------------------------------------
// Shared branded template — every email routes through this so they stay
// visually consistent. Email-client-safe inline styles only.
// ---------------------------------------------------------------------------
function renderEmail({ title, intro, ctaText, ctaUrl, showUrl, bullets, outro }) {
  const bulletHtml = bullets && bullets.length
    ? `<ul style="margin:18px 0;padding-left:20px;">${bullets
        .map((b) => `<li style="margin:8px 0;color:#444;font-size:15px;line-height:1.5;">${b}</li>`)
        .join('')}</ul>`
    : '';

  const ctaHtml = ctaText && ctaUrl
    ? `<a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;background:#ff0080;color:#ffffff !important;text-decoration:none;border-radius:8px;margin:18px 0;font-weight:700;font-size:16px;">${ctaText}</a>`
    : '';

  const urlBoxHtml = showUrl && ctaUrl
    ? `<p style="margin:8px 0;color:#888;font-size:13px;">Or paste this into your browser:</p>
       <div style="word-break:break-all;color:#666;background:#ffffff;padding:12px 14px;border-radius:6px;border:1px solid #e6e6e6;font-size:13px;">${ctaUrl}</div>`
    : '';

  const outroHtml = outro
    ? `<p style="margin:18px 0 0;color:#555;font-size:15px;line-height:1.6;">${outro}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:28px 20px;background:linear-gradient(135deg,#ff0080 0%,#a855f7 100%);border-radius:12px 12px 0 0;">
      <div style="font-size:30px;font-weight:800;letter-spacing:2px;color:#ffffff;">NOX</div>
    </div>
    <div style="background:#f9f9fb;padding:30px 26px;border-radius:0 0 12px 12px;">
      <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;">${title}</h2>
      <p style="margin:12px 0;color:#444;font-size:15px;line-height:1.6;">${intro}</p>
      ${bulletHtml}
      ${ctaHtml}
      ${urlBoxHtml}
      ${outroHtml}
    </div>
    <div style="text-align:center;margin-top:22px;padding:16px;color:#9a9a9a;font-size:12px;line-height:1.6;">
      Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:#ff0080;text-decoration:none;">${SUPPORT_EMAIL}</a><br/>
      © ${new Date().getFullYear()} Nox · Your night, optimized.
    </div>
  </div>
</body>
</html>`;

  const textParts = [
    title,
    '',
    intro.replace(/<[^>]+>/g, ''),
    ...(bullets || []).map((b) => `• ${b.replace(/<[^>]+>/g, '')}`),
    ctaUrl ? `\n${ctaText || 'Open'}: ${ctaUrl}` : '',
    outro ? `\n${outro.replace(/<[^>]+>/g, '')}` : '',
    '',
    `Questions? ${SUPPORT_EMAIL}`,
  ];

  return { html, text: textParts.filter((l) => l !== undefined).join('\n') };
}

// Core send: uses SMTP when configured, otherwise logs to console (dev). Never
// throws for the console path; surfaces real SMTP errors to the caller.
async function send({ to, subject, html, text, devSummary }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log('\n=== 📧 EMAIL (DEV MODE — not sent) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (devSummary) console.log(devSummary);
    console.log('======================================\n');
    return { success: true, mode: 'dev' };
  }
  const info = await transporter.sendMail({ from: fromAddress(), to, subject, html, text });
  console.log(`✅ Email sent to ${to} (${subject}): ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

/**
 * Business email verification.
 * @param {string} email
 * @param {string} venueName
 * @param {string} verificationUrl  web URL to GET /business/verify-email/:token
 */
exports.sendVerificationEmail = async (email, venueName, verificationUrl) => {
  const { html, text } = renderEmail({
    title: `Verify your venue on Nox`,
    intro: `You're one step from managing <strong>${venueName}</strong> on Nox. Confirm this email to activate your venue account.`,
    ctaText: 'Verify my venue',
    ctaUrl: verificationUrl,
    showUrl: true,
    bullets: [
      'Real-time analytics on who walks through your door',
      'Loyalty tiers that reward your regulars',
      'Ticket click-throughs Nox drives to your box office',
    ],
    outro: `If you didn't create this account, you can safely ignore this email.`,
  });
  return send({
    to: email,
    subject: `Verify your business email for ${venueName}`,
    html,
    text,
    devSummary: `Venue: ${venueName}\nVerify URL: ${verificationUrl}`,
  });
};

/**
 * Password reset. resetUrl is the app deep link (nox://auth/reset-password?...).
 */
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  const { html, text } = renderEmail({
    title: 'Reset your Nox password',
    intro: `We got a request to reset your password. Tap the button below on your phone to choose a new one. This link expires in 1 hour.`,
    ctaText: 'Reset password',
    ctaUrl: resetUrl,
    showUrl: false,
    outro: `Didn't request this? Your password is unchanged — you can ignore this email.`,
  });
  return send({
    to: email,
    subject: 'Reset your Nox password',
    html,
    text,
    devSummary: `Reset URL: ${resetUrl}`,
  });
};

/**
 * Welcome email after a venue verifies.
 */
exports.sendWelcomeEmail = async (email, venueName) => {
  const { html, text } = renderEmail({
    title: `Welcome to Nox`,
    intro: `<strong>${venueName}</strong> is verified and live. Your dashboard is ready whenever a crowd starts checking in.`,
    bullets: [
      'Watch check-ins, peak hours, and returning guests in real time',
      'See the ticket clicks Nox sends to your sellers',
      'Share a live report link with your team anytime',
    ],
    outro: `Welcome to the night.`,
  });
  return send({
    to: email,
    subject: `${venueName} is live on Nox 🎉`,
    html,
    text,
    devSummary: `Welcome ${venueName}`,
  });
};

/**
 * Optional startup check — verifies SMTP creds are valid so misconfig shows up
 * in logs at boot instead of on the first send. No-op in dev (no SMTP).
 */
exports.verifyTransport = async () => {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, mode: 'dev' };
  try {
    await transporter.verify();
    console.log('[email] SMTP transport verified — ready to send.');
    return { ok: true };
  } catch (err) {
    console.error('[email] SMTP verify FAILED:', err.message);
    return { ok: false, error: err.message };
  }
};

module.exports = exports;
