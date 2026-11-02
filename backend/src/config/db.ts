import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.JAWSDB_URL || process.env.DATABASE_URL;
const parsedDatabaseUrl = databaseUrl ? new URL(databaseUrl) : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || parsedDatabaseUrl?.hostname || 'localhost',
  port: Number(process.env.DB_PORT || parsedDatabaseUrl?.port) || 3306,
  user: process.env.DB_USER || decodeURIComponent(parsedDatabaseUrl?.username || 'root'),
  password: process.env.DB_PASSWORD || decodeURIComponent(parsedDatabaseUrl?.password || ''),
  database: process.env.DB_NAME || parsedDatabaseUrl?.pathname.slice(1) || 'cinema_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('MySQL connected successfully');
    return true;
  } catch (err) {
    console.error('MySQL connection failed:', err);
    return false;
  }
}

export default pool;
