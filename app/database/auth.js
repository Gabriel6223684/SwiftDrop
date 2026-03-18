import db from './connection.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function createUser(username, email, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, email, hashedPassword]
    );
    return { ok: true, user: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return { ok: false, error: 'E-mail já cadastrado' };
    }
    console.error('Create user error:', error);
    return { ok: false, error: 'Erro interno do servidor' };
  }
}

export async function findUserByEmail(email) {
  try {
    const result = await db.query('SELECT id, username, email, password FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Find user error:', error);
    return null;
  }
}

export async function verifyUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, error: 'E-mail ou senha incorretos' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { ok: false, error: 'E-mail ou senha incorretos' };

  const session = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  return { ok: true, user: session };
}

export async function updateUserPassword(email, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id',
      [hashedPassword, email]
    );
    if (result.rowCount === 0) return { ok: false, error: 'Usuário não encontrado' };
    return { ok: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { ok: false, error: 'Erro interno do servidor' };
  }
}

export async function createResetCode(email) {
  try {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10min

    // Delete ALL old codes for email (prevent duplicates)
    await db.query('DELETE FROM reset_codes WHERE email = $1', [email]);

    // Insert new with conflict handling
    const result = await db.query(
      `INSERT INTO reset_codes (email, code, expires_at, used) 
       VALUES ($1, $2, $3, false) 
       ON CONFLICT (email, code) DO NOTHING 
       RETURNING id`,
      [email, code, expiresAt]
    );

    return { ok: true, code }; // Debug - remove em prod
  } catch (error) {
    console.error('Create reset code error:', error);
    return { ok: false, error: 'Erro ao gerar código: ' + error.message };
  }
}

export async function verifyResetCode(email, code) {
  try {
    const result = await db.query(
      'SELECT id FROM reset_codes WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = false',
      [email, code]
    );

    if (result.rowCount === 0) {
      return { ok: false, error: 'Código inválido ou expirado' };
    }

    await db.query('UPDATE reset_codes SET used = true WHERE id = $1', [result.rows[0].id]);
    return { ok: true };
  } catch (error) {
    console.error('Verify reset code error:', error);
    return { ok: false, error: 'Erro ao verificar código' };
  }
}
