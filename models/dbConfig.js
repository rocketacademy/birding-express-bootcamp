import pg from 'pg';
// DB Configuration
const { Pool } = pg;
const pgConnectionConfig = {
  user: 'zaffere',
  host: 'localhost',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

const pool = new Pool(pgConnectionConfig);

export default pool;
