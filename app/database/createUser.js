const conectarBanco = require("./db"); // Importa a função que criamos para o SQLite
const bcrypt = require("bcryptjs");

async function findUserByEmail(email) {
  try {
    const db = await conectarBanco();
    // .get() retorna apenas o primeiro objeto ou undefined
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    return user;
  } catch (err) {
    throw err;
  }
}

async function findUserByUsername(username) {
  try {
    const db = await conectarBanco();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return user;
  } catch (err) {
    throw err;
  }
}

async function checkUserExists(username, email) {
  try {
    const [userByName, userByEmail] = await Promise.all([
      findUserByUsername(username),
      findUserByEmail(email),
    ]);
    if (userByName) return { exists: true, field: "username" };
    if (userByEmail) return { exists: true, field: "email" };
    return { exists: false };
  } catch (err) {
    throw err;
  }
}

async function registerUser(username, email, password) {
  try {
    const existsCheck = await checkUserExists(username, email);
    if (existsCheck.exists) {
      throw new Error(`DUPLICATE_${existsCheck.field.toUpperCase()}`);
    }
    const hash = await bcrypt.hash(password, 10);

    const db = await conectarBanco();
    // .run() executa comandos de escrita e retorna informações sobre as linhas afetadas
    const result = await db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hash],
    );

    // Simula o 'RETURNING' buscando o usuário recém-criado usando o lastID
    return { id: result.lastID, username, email };
  } catch (err) {
    throw err;
  }
}

async function login(email, password) {
  try {
    const user = await findUserByEmail(email);
    if (!user) return { success: false, message: "Usuário não encontrado" };
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const { password: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword };
    } else {
      return { success: false, message: "Senha incorreta" };
    }
  } catch (err) {
    throw err;
  }
}

async function searchUsers(query) {
  try {
    const db = await conectarBanco();
    // LIKE no SQLite já é case-insensitive por padrão para o alfabeto padrão
    const users = await db.all(
      `SELECT id, username, email FROM users 
             WHERE username LIKE ? OR email LIKE ?
             LIMIT 20`,
      [`%${query}%`, `%${query}%`],
    );
    return users;
  } catch (err) {
    throw err;
  }
}

async function deleteUser(id, password) {
  try {
    const db = await conectarBanco();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) throw new Error("Usuário não encontrado");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Senha incorreta");

    await db.run("DELETE FROM users WHERE id = ?", [id]);
    return { success: true };
  } catch (err) {
    throw err;
  }
}

async function changePassword(id, currentPassword, newPassword) {
  try {
    const db = await conectarBanco();
    const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) throw new Error("Usuário não encontrado");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Senha atual incorreta");

    if (newPassword.length < 6)
      throw new Error("A nova senha precisa ter pelo menos 6 caracteres");

    const hash = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hash, id]);
    return { success: true };
  } catch (err) {
    throw err;
  }
}

// ─── MENSAGENS ────────────────────────────────────────────────

async function sendMessage(userId, receiverId, content) {
  try {
    const db = await conectarBanco();
    // Trocado NOW() por datetime('now') que é o padrão do SQLite
    const result = await db.run(
      `INSERT INTO messages (user_id, receiver_id, content, created_at)
             VALUES (?, ?, ?, datetime('now'))`,
      [userId, receiverId, content],
    );

    // Buscamos a mensagem inserida para retornar a estrutura esperada pelo app
    const novaMensagem = await db.get("SELECT * FROM messages WHERE id = ?", [
      result.lastID,
    ]);
    return novaMensagem;
  } catch (err) {
    throw err;
  }
}

async function getMessages(userId, receiverId) {
  try {
    const db = await conectarBanco();
    const messages = await db.all(
      `SELECT * FROM messages
             WHERE (user_id = ? AND receiver_id = ?)
                OR (user_id = ? AND receiver_id = ?)
             ORDER BY created_at ASC`,
      [userId, receiverId, userId, receiverId], // Passado duas vezes para suprir os 4 placeholders '?'
    );
    return messages;
  } catch (err) {
    throw err;
  }
}

async function getConversations(userId) {
  try {
    const db = await conectarBanco();

    // Query reescrita para funcionar sem o 'DISTINCT ON' do Postgres
    const conversations = await db.all(
      `SELECT 
                m.other_id,
                u.username,
                u.email,
                m.content AS last_msg,
                m.created_at AS time
             FROM (
                SELECT 
                    CASE WHEN user_id = ? THEN receiver_id ELSE user_id END AS other_id,
                    content,
                    created_at
                FROM messages
                WHERE user_id = ? OR receiver_id = ?
                ORDER BY created_at DESC
             ) m
             JOIN users u ON u.id = m.other_id
             GROUP BY m.other_id
             ORDER BY time DESC`,
      [userId, userId, userId],
    );
    return conversations;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  registerUser,
  findUserByEmail,
  findUserByUsername,
  checkUserExists,
  login,
  searchUsers,
  deleteUser,
  changePassword,
  sendMessage,
  getMessages,
  getConversations,
};
