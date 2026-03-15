const db = require("./connection")

async function getUsers() {
    try {
        const result = await db.query("SELECT * FROM users")
        return result.rows
    } catch (error) {
        console.error("Erro ao buscar usuários:", error)
        return []
    }
}

async function createUser(username, email) {
    try {
        const result = await db.query(
            "INSERT INTO users(username,email) VALUES($1,$2) RETURNING *",
            [username, email]
        )

        return result.rows[0]

    } catch (error) {
        console.error("Erro ao criar usuário:", error)
        return null
    }
}

module.exports = {
    getUsers,
    createUser
}