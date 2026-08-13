import nodemailer, { Transporter } from 'nodemailer';
import config from '../core/config/config';
import logger from '../core/config/logger';
import AppError from '../core/error/appError';


interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}


// ─── Singleton transporter ────────────────────────────────
// Created once at module load — not on every sendEmail() call.
// This avoids opening a new SMTP connection per email.

const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.address,
    pass: config.email.pass,
  },
});


// ─── sendEmail ────────────────────────────────────────────
// Throws an AppError on failure so callers don't need to check a
// return value — a failed email surfaces as a 500 to the client
// rather than a silent 200 that never actually sent anything.

const sendEmail = async ({
  to,
  subject,
  html,
}: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Email send error:', { to, subject, message });

    throw new AppError(500, `Failed to send email: ${message}`);
  }
};


export default sendEmail;