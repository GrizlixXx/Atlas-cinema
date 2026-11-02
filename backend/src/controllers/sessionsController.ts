import { Request, Response, NextFunction } from 'express';
import * as sessionsService from '../services/sessionsService';
import { AddSessionBody } from '../types';

export async function getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await sessionsService.seedDefaultSessions();
    const movieId = req.query.movie_id ? Number(req.query.movie_id) : null;
    const sessions = movieId
      ? await sessionsService.getSessionsByMovieId(movieId)
      : await sessionsService.getAllSessions();
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function addSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body: AddSessionBody = {
      movie_id: Number(req.body.movie_id),
      hall_name: String(req.body.hall_name || '').trim(),
      start_time: String(req.body.start_time || '').trim(),
      base_price: parseFloat(req.body.base_price),
    };

    if (!body.movie_id || !body.hall_name || !body.start_time || isNaN(body.base_price) || body.base_price <= 0) {
      res.status(400).json({ error: 'Missing or invalid fields' });
      return;
    }

    const id = await sessionsService.addSession(body);
    res.json({ success: true, id });
  } catch (err) {
    next(err);
  }
}

export async function seedSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await sessionsService.seedDefaultSessions();
    const sessions = await sessionsService.getAllSessions();
    res.json({ success: true, count: sessions.length });
  } catch (err) {
    next(err);
  }
}
