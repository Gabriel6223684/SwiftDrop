const pool = require("./db")

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("✅ Tabela users OK")
  } catch (err) {
    console.log("Users table:", err.code === '42P07' ? "já existe" : err.message)
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("✅ Tabela messages OK")
  } catch (err) {
    console.log("Messages table:", err.code === '42P07' ? "já existe" : err.message)
  }

  console.log("✅ Migration completa!")
  process.exit()
}

migrate().catch(console.error)