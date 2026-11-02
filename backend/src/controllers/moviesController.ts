import { Request, Response, NextFunction } from 'express';
import * as moviesService from '../services/moviesService';
import { AddMovieBody } from '../types';

export async function getMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moviesService.seedDefaultMovies();
    const movies = await moviesService.getAllMovies();
    res.json(movies);
  } catch (err) {
    next(err);
  }
}

export async function addMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body: AddMovieBody = {
      title: String(req.body.title || '').trim(),
      title_uk: String(req.body.title_uk || '').trim(),
      description: String(req.body.description || '').trim(),
      description_uk: String(req.body.description_uk || '').trim(),
      duration_min: Number(req.body.duration_min),
      age_rating: String(req.body.age_rating || '').trim(),
      genre: String(req.body.genre || '').trim(),
    };

    if (!body.title || !body.duration_min || !body.genre || !body.age_rating) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Poster file is required' });
      return;
    }

    const posterUrl = `assets/images/${file.filename}`;
    const id = await moviesService.addMovie(body, posterUrl);
    res.json({ success: true, id, poster_url: posterUrl });
  } catch (err) {
    next(err);
  }
}

export async function seedMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moviesService.seedDefaultMovies();
    const movies = await moviesService.getAllMovies();
    res.json({ success: true, count: movies.length });
  } catch (err) {
    next(err);
  }
}
