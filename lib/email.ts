import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type PasswordResetEmailInput = {
  to: string;
  token: string;
  expiresAt: Date;
};

const defaultAppUrl = "http://127.0.0.1:3000";
const defaultSmtpHost = "127.0.0.1";
const defaultSmtpPort = 1025;
const defaultFrom = "Mboko Reels <noreply@mbokoreels.local>";

declare global {
  // eslint-disable-next-line no-var
  var __mailTransport__: nodemailer.Transporter | undefined;
}

function getAppUrl() {
  return (process.env.APP_URL ?? defaultAppUrl).replace(/\/+$/, "");
}

function getTransport() {
  if (global.__mailTransport__) {
    return global.__mailTransport__;
  }

  const port = Number(process.env.SMTP_PORT ?? defaultSmtpPort);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? defaultSmtpHost,
    port: Number.isFinite(port) ? port : defaultSmtpPort,
    secure: false,
  });

  if (process.env.NODE_ENV !== "production") {
    global.__mailTransport__ = transport;
  }

  return transport;
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  await getTransport().sendMail({
    from: process.env.SMTP_FROM ?? defaultFrom,
    to,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail({ to, token, expiresAt }: PasswordResetEmailInput) {
  const resetUrl = `${getAppUrl()}/reset-password/${token}`;
  const expiresAtLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expiresAt);
  const subject = "Reset your Mboko Reels password";
  const text = [
    "You asked to reset your Mboko Reels password.",
    "",
    `Open this link to choose a new password: ${resetUrl}`,
    "",
    "This reset link expires in 30 minutes.",
    `Token expiry time: ${expiresAtLabel}.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = [
    "<p>You asked to reset your Mboko Reels password.</p>",
    `<p><a href="${resetUrl}">Open this link to choose a new password</a>.</p>`,
    "<p>This reset link expires in 30 minutes.</p>",
    `<p>Token expiry time: ${expiresAtLabel}.</p>`,
    "<p>If you did not request this, you can ignore this email.</p>",
  ].join("");

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}
