import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { User, RegisterBody } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getAllUsers(): Promise<Omit<User, 'pass_hash'>[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, phone, role, created_at FROM users ORDER BY id'
  );
  return rows as Omit<User, 'pass_hash'>[];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return (rows[0] as User) || null;
}

export async function registerUser(data: RegisterBody): Promise<number> {
  const existing = await getUserByEmail(data.email);
  if (existing) throw new Error('Email already registered');

  const passHash = await bcrypt.hash(data.password, 10);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email, pass_hash, phone, role) VALUES (?,?,?,?,?)',
    [data.name, data.email, passHash, data.phone || null, 'user']
  );
  return result.insertId;
}

export async function ensureAdmin(): Promise<void> {
  const admin = await getUserByEmail('admin@gmail.com');
  if (admin) return;

  const passHash = await bcrypt.hash('password', 10);
  await pool.query(
    'INSERT INTO users (name, email, pass_hash, role) VALUES (?,?,?,?)',
    ['Admin', 'admin@gmail.com', passHash, 'admin']
  );
  console.log('Admin user created');
}
