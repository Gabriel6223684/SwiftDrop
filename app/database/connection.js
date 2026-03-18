import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'seu_user',
    host: 'localhost',
    database: 'seu_banco',
    password: 'sua_senha',
    port: 5432,
});

export default pool;