const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "2009",
    database: process.env.DB_NAME || "swiftdrop",
    port: process.env.DB_PORT || 5432
})

pool.connect()
    .then(() => {
        console.log("✅ Conectado ao PostgreSQL")
    })
    .catch(err => {
        console.error("❌ Erro ao conectar no PostgreSQL:", err)
    })

module.exports = pool