const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let dbInstance = null;

async function conectarBanco() {
  if (dbInstance) return dbInstance;

  // __dirname aponta para 'app/database'
  // ".." volta para 'app'
  // o segundo ".." volta para a raiz 'swiftdrop'
  const caminhoDoBanco = path.join(__dirname, "..", "..", "database.db");

  dbInstance = await open({
    filename: caminhoDoBanco,
    driver: sqlite3.Database,
  });

  await dbInstance.exec("PRAGMA foreign_keys = ON;");

  return dbInstance;
}

async function getDB() {
  return await conectarBanco();
}

module.exports = getDB;
