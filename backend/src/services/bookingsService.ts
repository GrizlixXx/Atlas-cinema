import pool from '../config/db';
import { Booking } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Ensure the bookings table exists (auto-create if missing)
export async function ensureTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id int(11) NOT NULL AUTO_INCREMENT,
      user_id int(11) NOT NULL,
      session_id int(11) NOT NULL,
      film_title varchar(255) NOT NULL DEFAULT '',
      hall varchar(50) NOT NULL DEFAULT '',
      start_time datetime NOT NULL DEFAULT current_timestamp(),
      seats longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(seats)),
      price_total decimal(10,2) NOT NULL DEFAULT 0.00,
      paid tinyint(1) DEFAULT 0,
      paid_at datetime DEFAULT NULL,
      canceled tinyint(1) DEFAULT 0,
      canceled_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY user_id (user_id),
      KEY session_id (session_id),
      CONSTRAINT bookings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT bookings_ibfk_2 FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function getAllBookings(): Promise<Booking[]> {
  await ensureTable();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM bookings ORDER BY created_at DESC'
  );
  return rows.map(mapRow);
}

export async function getBookingsBySession(sessionId: number): Promise<Booking[]> {
  await ensureTable();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM bookings WHERE session_id = ? ORDER BY created_at DESC',
    [sessionId]
  );
  return rows.map(mapRow);
}

export async function getBookingsByUser(userId: number): Promise<Booking[]> {
  await ensureTable();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(mapRow);
}

export async function getOccupiedSeats(sessionId: number): Promise<string[]> {
  await ensureTable();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT seats FROM bookings WHERE session_id = ? AND canceled = 0',
    [sessionId]
  );
  const all: string[] = [];
  for (const r of rows) {
    let sArr: string[] = [];
    try {
      sArr = JSON.parse(r.seats);
    } catch {
      sArr = String(r.seats || '').split(',').map((x) => x.trim());
    }
    sArr.filter(Boolean).forEach((seat) => all.push(seat));
  }
  return all;
}

export async function createBooking(data: {
  user_id: number;
  session_id: number;
  seats: string;
  price_total: number;
}): Promise<number> {
  await ensureTable();

  const [sessionRows] = await pool.query<RowDataPacket[]>(
    `SELECT s.hall_name as hall, s.start_time, m.title as film_title 
     FROM sessions s 
     JOIN movies m ON s.movie_id = m.id 
     WHERE s.id = ?`,
    [data.session_id]
  );
  
  if (sessionRows.length === 0) throw new Error('Session not found');
  const { film_title, hall, start_time } = sessionRows[0];

  // Check for seat conflicts
  const occupied = await getOccupiedSeats(data.session_id);
  const requested = data.seats.split(',').map((s) => s.trim()).filter(Boolean);
  const conflicts = requested.filter((s) => occupied.includes(s));
  if (conflicts.length > 0) {
    throw new Error(`Seats already taken: ${conflicts.join(', ')}`);
  }

  const seatsJson = JSON.stringify(requested);

  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO bookings (user_id, session_id, film_title, hall, start_time, seats, price_total) VALUES (?,?,?,?,?,?,?)',
    [data.user_id, data.session_id, film_title, hall, start_time, seatsJson, data.price_total]
  );
  return result.insertId;
}

export async function payBooking(id: number): Promise<boolean> {
  await ensureTable();
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE bookings SET paid = 1, paid_at = NOW() WHERE id = ? AND canceled = 0 AND paid = 0',
    [id]
  );
  return result.affectedRows > 0;
}

export async function payAllByUser(userId: number): Promise<number> {
  await ensureTable();
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE bookings SET paid = 1, paid_at = NOW() WHERE user_id = ? AND canceled = 0 AND paid = 0',
    [userId]
  );
  return result.affectedRows;
}

export async function cancelBooking(id: number): Promise<boolean> {
  await ensureTable();
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE bookings SET canceled = 1, canceled_at = NOW() WHERE id = ? AND canceled = 0',
    [id]
  );
  return result.affectedRows > 0;
}

export async function deleteBooking(id: number): Promise<boolean> {
  await ensureTable();
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM bookings WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

function mapRow(r: RowDataPacket): Booking {
  let parsedSeats = '';
  try {
     const arr = JSON.parse(r.seats);
     parsedSeats = Array.isArray(arr) ? arr.join(',') : String(r.seats || '');
  } catch {
     parsedSeats = String(r.seats || '');
  }

  return {
    id: r.id,
    user_id: r.user_id,
    session_id: r.session_id,
    seats: parsedSeats,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : '',
    price_total: parseFloat(r.price_total) || 0,
    paid: Boolean(r.paid),
    paid_at: r.paid_at ? new Date(r.paid_at).toISOString() : undefined,
    canceled: Boolean(r.canceled),
    canceled_at: r.canceled_at ? new Date(r.canceled_at).toISOString() : undefined,
  };
}
