import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/usersService';
import { RegisterBody } from '../types';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body: RegisterBody = {
      name: String(req.body.name || '').trim(),
      email: String(req.body.email || '').trim().toLowerCase(),
      password: String(req.body.password || ''),
      phone: req.body.phone ? String(req.body.phone).trim() : undefined,
    };

    if (!body.name || !body.email || !body.password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (body.password.length < 6) {
      res.status(400).json({ error: 'Password too short (min 6 chars)' });
      return;
    }

    const id = await usersService.registerUser(body);
    res.json({ success: true, id, message: 'Registration successful' });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Email already registered') {
      res.status(409).json({ error: err.message });
      return;
    }
    next(err);
  }
}

export async function ensureAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.ensureAdmin();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
