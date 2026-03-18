import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createUser, verifyUser, createResetCode, verifyResetCode, updateUserPassword, findUserByEmail } from './database/auth.js';

dotenv.config();

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test@localhost',
    pass: process.env.SMTP_PASS || 'testpass'
  }
});

// Test Ethereal credentials (gerar novas em ethereal.email)
let etherealAccount;
async function getEtherealAccount() {
  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    console.log('Ethereal credentials:', etherealAccount);
  }
  return etherealAccount;
}

export async function sendResetCode(email) {
  try {
    const { ok, code, error } = await createResetCode(email);
    if (!ok) return { ok: false, error };

    const account = await getEtherealAccount();
    const transporter = nodemailer.createTransporter({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });

    await transporter.sendMail({
      from: '"SwiftDrop" <no-reply@swiftdrop.com>',
      to: email,
      subject: 'Seu código de recuperação - SwiftDrop',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">🔔 Código de Recuperação</h2>
          <p>Seu código de verificação é:</p>
          <div style="background: #f8f9fa; border: 2px solid #c9a84c; border-radius: 12px; font-size: 2rem; font-weight: bold; text-align: center; padding: 1rem; letter-spacing: 0.5rem; color: #c9a84c; margin: 1.5rem 0;">
            ${code}
          </div>
          <p><strong>Este código expira em 10 minutos.</strong></p>
          <hr style="border: none; height: 1px; background: #eee; margin: 2rem 0;">
          <p style="color: #666; font-size: 0.9rem;">Se você não solicitou este código, ignore este email.</p>
          <p style="color: #c9a84c; font-weight: 500;">SwiftDrop Team</p>
        </div>
      `
    });

    console.log(`✅ Código ${code} enviado para ${email} (Ethereal test: ${nodemailer.getTestMessageUrl(info)})`);
    return { ok: true, code }; // code for debug
  } catch (error) {
    console.error('Email error:', error);
    return { ok: false, error: 'Erro ao enviar email' };
  }
}

export { createUser, verifyUser, updateUserPassword, findUserByEmail, sendResetCode, verifyResetCode };
