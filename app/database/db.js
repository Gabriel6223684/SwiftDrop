const { Pool } = require("pg")

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "chatapp",
    password: "2009",
    port: 5432,
})

module.exports = pool