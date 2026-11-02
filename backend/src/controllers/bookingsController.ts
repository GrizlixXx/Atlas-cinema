import { Request, Response, NextFunction } from 'express';
import * as bookingsService from '../services/bookingsService';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.query.session_id ? Number(req.query.session_id) : null;
    const userId = req.query.user_id ? Number(req.query.user_id) : null;

    let bookings;
    if (sessionId) {
      bookings = await bookingsService.getBookingsBySession(sessionId);
    } else if (userId) {
      bookings = await bookingsService.getBookingsByUser(userId);
    } else {
      bookings = await bookingsService.getAllBookings();
    }

    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

export async function getOccupied(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = Number(req.params.sessionId);
    if (!sessionId) {
      res.status(400).json({ error: 'session_id is required' });
      return;
    }
    const seats = await bookingsService.getOccupiedSeats(sessionId);
    res.json(seats);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user_id, session_id, seats, price_total } = req.body;

    if (!user_id || !session_id || !seats) {
      res.status(400).json({ error: 'Missing required fields: user_id, session_id, seats' });
      return;
    }

    const id = await bookingsService.createBooking({
      user_id: Number(user_id),
      session_id: Number(session_id),
      seats: String(seats).trim(),
      price_total: parseFloat(price_total) || 0,
    });

    res.json({ success: true, id });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith('Seats already taken')) {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function pay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const ok = await bookingsService.payBooking(id);
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
}

export async function payAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = Number(req.body.user_id);
    if (!userId) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }
    const count = await bookingsService.payAllByUser(userId);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const ok = await bookingsService.cancelBooking(id);
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const ok = await bookingsService.deleteBooking(id);
    res.json({ success: ok });
  } catch (err) {
    next(err);
  }
}
