const pool = require("./db");
const bcrypt = require("bcryptjs")

async function findUserByEmail(email) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        return result.rows[0];
    } catch (err) {
        throw err;
    }
}

async function findUserByUsername(username) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        return result.rows[0];
    } catch (err) {
        throw err;
    }
}

async function checkUserExists(username, email) {
    try {
        const [userByName, userByEmail] = await Promise.all([
            findUserByUsername(username),
            findUserByEmail(email)
        ]);
        if (userByName) return { exists: true, field: 'username' };
        if (userByEmail) return { exists: true, field: 'email' };
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
        const result = await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hash]
        );
        return result.rows[0];
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
        const result = await pool.query(
            `SELECT id, username, email FROM users 
             WHERE username ILIKE $1 OR email ILIKE $1
             LIMIT 20`,
            [`%${query}%`]
        );
        return result.rows;
    } catch (err) {
        throw err;
    }
}

async function deleteUser(id, password) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = result.rows[0];
        if (!user) throw new Error("Usuário não encontrado");
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Senha incorreta");
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        return { success: true };
    } catch (err) {
        throw err;
    }
}

async function changePassword(id, currentPassword, newPassword) {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = result.rows[0];
        if (!user) throw new Error("Usuário não encontrado");

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new Error("Senha atual incorreta");

        if (newPassword.length < 6)
            throw new Error("A nova senha precisa ter pelo menos 6 caracteres");

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, id]);
        return { success: true };
    } catch (err) {
        throw err;
    }
}

// ─── MENSAGENS ────────────────────────────────────────────────

async function sendMessage(userId, receiverId, content) {
    try {
        const result = await pool.query(
            `INSERT INTO messages (user_id, receiver_id, content, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, user_id, receiver_id, content, created_at`,
            [userId, receiverId, content]
        );
        return result.rows[0];
    } catch (err) {
        throw err;
    }
}

async function getMessages(userId, receiverId) {
    try {
        const result = await pool.query(
            `SELECT * FROM messages
             WHERE (user_id = $1 AND receiver_id = $2)
                OR (user_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, receiverId]
        );
        return result.rows;
    } catch (err) {
        throw err;
    }
}

async function getConversations(userId) {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (other_id)
                other_id,
                u.username,
                u.email,
                m.content AS last_msg,
                m.created_at AS time
             FROM (
               SELECT 
                 CASE WHEN user_id = $1 THEN receiver_id ELSE user_id END AS other_id,
                 content,
                 created_at
               FROM messages
               WHERE user_id = $1 OR receiver_id = $1
             ) m
             JOIN users u ON u.id = m.other_id
             ORDER BY other_id, m.created_at DESC`,
            [userId]
        );
        return result.rows;
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
    getConversations
};