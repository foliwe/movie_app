import nodemailer from "nodemailer";
import type { MovieRequestPayload } from "@/lib/movie-request";

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

type MovieRequestEmailInput = {
  to: string;
  request: MovieRequestPayload;
  submittedAt: Date;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMovieRequestTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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

export async function sendMovieRequestAcknowledgementEmail({
  to,
  request,
  submittedAt,
}: MovieRequestEmailInput) {
  const subject = `We received your movie request for ${request.title}`;
  const submittedAtLabel = formatMovieRequestTimestamp(submittedAt);
  const text = [
    "Thank you for contacting Mboko Reels.",
    "",
    `We received your movie request for "${request.title}".`,
    `Role submitted: ${request.role}`,
    `Contact email: ${request.contactEmail}`,
    `Submitted: ${submittedAtLabel}`,
    "",
    "Our team will review the request and follow up by email.",
  ].join("\n");
  const html = [
    "<p>Thank you for contacting Mboko Reels.</p>",
    `<p>We received your movie request for "<strong>${escapeHtml(request.title)}</strong>".</p>`,
    `<p>Role submitted: ${escapeHtml(request.role)}<br />Contact email: ${escapeHtml(request.contactEmail)}<br />Submitted: ${escapeHtml(submittedAtLabel)}</p>`,
    "<p>Our team will review the request and follow up by email.</p>",
  ].join("");

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}

export async function sendMovieRequestAdminNotificationEmail({
  to,
  request,
  submittedAt,
}: MovieRequestEmailInput) {
  const subject = `New movie request: ${request.title}`;
  const submittedAtLabel = formatMovieRequestTimestamp(submittedAt);
  const text = [
    "A new movie request was submitted to Mboko Reels.",
    "",
    `Title: ${request.title}`,
    `Language: ${request.language}`,
    `Producer: ${request.producer}`,
    `Year: ${request.year}`,
    `Contact phone: ${request.contactPhone}`,
    `Contact email: ${request.contactEmail}`,
    `Role: ${request.role}`,
    `Submitted: ${submittedAtLabel}`,
  ].join("\n");
  const html = [
    "<p>A new movie request was submitted to Mboko Reels.</p>",
    "<ul>",
    `<li><strong>Title:</strong> ${escapeHtml(request.title)}</li>`,
    `<li><strong>Language:</strong> ${escapeHtml(request.language)}</li>`,
    `<li><strong>Producer:</strong> ${escapeHtml(request.producer)}</li>`,
    `<li><strong>Year:</strong> ${request.year}</li>`,
    `<li><strong>Contact phone:</strong> ${escapeHtml(request.contactPhone)}</li>`,
    `<li><strong>Contact email:</strong> ${escapeHtml(request.contactEmail)}</li>`,
    `<li><strong>Role:</strong> ${escapeHtml(request.role)}</li>`,
    `<li><strong>Submitted:</strong> ${escapeHtml(submittedAtLabel)}</li>`,
    "</ul>",
  ].join("");

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}
