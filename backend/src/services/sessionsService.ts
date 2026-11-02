import pool from '../config/db';
import { Session, AddSessionBody } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getAllSessions(): Promise<Session[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sessions ORDER BY start_time'
  );
  return rows as Session[];
}

export async function getSessionsByMovieId(movieId: number): Promise<Session[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM sessions WHERE movie_id = ? ORDER BY start_time',
    [movieId]
  );
  return rows as Session[];
}

export async function addSession(data: AddSessionBody): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO sessions (movie_id, hall_name, start_time, base_price) VALUES (?,?,?,?)',
    [data.movie_id, data.hall_name, data.start_time, data.base_price]
  );
  return result.insertId;
}

export async function seedDefaultSessions(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM sessions');
  const count = (rows[0] as { cnt: number }).cnt;
  if (count > 0) return;

  const halls = ['Hall A', 'Hall B', 'Hall C', 'VIP Hall', 'Family Hall'];
  const baseDate = new Date('2026-04-01T18:00:00');

  for (let movieId = 1; movieId <= 18; movieId++) {
    const hall = halls[movieId % halls.length];
    const d1 = new Date(baseDate);
    d1.setDate(d1.getDate() + movieId - 1);
    const d2 = new Date(d1);
    d2.setHours(d2.getHours() + 2);

    await pool.query(
      'INSERT INTO sessions (movie_id, hall_name, start_time, base_price) VALUES (?,?,?,?)',
      [movieId, hall, d1.toISOString().slice(0, 19).replace('T', ' '), 12.50]
    );
    await pool.query(
      'INSERT INTO sessions (movie_id, hall_name, start_time, base_price) VALUES (?,?,?,?)',
      [movieId, hall, d2.toISOString().slice(0, 19).replace('T', ' '), 12.50]
    );
  }
}
