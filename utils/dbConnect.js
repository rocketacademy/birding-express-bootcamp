import pg from 'pg';

// Initialise DB connection
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'hirawan',
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port
};
const pool = new Pool(pgConnectionConfigs);

export default pool;
