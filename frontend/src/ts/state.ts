import type { User, Movie, Session, Booking, Lang } from './types';
import { LS_KEYS, getLang } from './i18n';

export function getCurrentUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.CURRENT_USER) || 'null') as User | null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem(LS_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(LS_KEYS.CURRENT_USER);
  }
}

export function getMovies(): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.MOVIES) || '[]') as Movie[];
  } catch {
    return [];
  }
}

function setMovies(movies: Movie[]): void {
  localStorage.setItem(LS_KEYS.MOVIES, JSON.stringify(movies));
}

export function getSessions(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.SESSIONS) || '[]') as Session[];
  } catch {
    return [];
  }
}

function setSessions(sessions: Session[]): void {
  localStorage.setItem(LS_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getBookings(): Booking[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.BOOKINGS) || '[]') as Booking[];
  } catch {
    return [];
  }
}

function setBookings(bookings: Booking[]): void {
  localStorage.setItem(LS_KEYS.BOOKINGS, JSON.stringify(bookings));
}

export function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.USERS) || '[]') as User[];
  } catch {
    return [];
  }
}

function setUsers(users: User[]): void {
  localStorage.setItem(LS_KEYS.USERS, JSON.stringify(users));
}

export function localizeMovie(movie: Movie): Movie {
  const lang = getLang();
  if (lang === 'en') return movie;
  return {
    ...movie,
    title: movie.title_uk || movie.title,
    description: movie.description_uk || movie.description,
  };
}

export function mapApiMovieToFrontend(m: Record<string, unknown>): Movie {
  return {
    id: Number(m.id),
    title: String(m.title || ''),
    title_uk: String(m.title_uk || ''),
    category: String(m.genre ?? m.category ?? ''),
    genre: String(m.genre ?? m.category ?? ''),
    description: String(m.description || ''),
    description_uk: String(m.description_uk || ''),
    duration_min: Number(m.duration_min ?? m.duration_minutes ?? 0),
    duration_minutes: Number(m.duration_min ?? m.duration_minutes ?? 0),
    age_rating: String(m.age_rating ?? m.rating ?? ''),
    rating: String(m.age_rating ?? m.rating ?? ''),
    poster_url: String(m.poster_url || ''),
  };
}

export function mapApiSessionToFrontend(r: Record<string, unknown>): Session {
  return {
    id: Number(r.id),
    movie_id: Number(r.movie_id),
    hall_name: String(r.hall_name || r.hall || ''),
    hall: String(r.hall_name || r.hall || ''),
    start_time: String(r.start_time || ''),
    base_price: Number(r.base_price ?? 12.5),
    total_seats: 90,
    seats_per_row: 10,
  };
}

let _moviesSync: Promise<boolean> | null = null;
let _sessionsSync: Promise<boolean> | null = null;

export async function syncMovies(): Promise<boolean> {
  if (_moviesSync) return _moviesSync;
  _moviesSync = (async () => {
    try {
      const res = await fetch('/api/movies');
      if (!res.ok) return false;
      const rows = (await res.json()) as Record<string, unknown>[];
      if (!Array.isArray(rows)) return false;
      setMovies(rows.map(mapApiMovieToFrontend));
      return true;
    } catch {
      return false;
    }
  })();
  const result = await _moviesSync;
  _moviesSync = null;
  return result;
}

export async function syncSessions(): Promise<boolean> {
  if (_sessionsSync) return _sessionsSync;
  _sessionsSync = (async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) return false;
      const rows = (await res.json()) as Record<string, unknown>[];
      if (!Array.isArray(rows)) return false;
      setSessions(rows.map(mapApiSessionToFrontend));
      return true;
    } catch {
      return false;
    }
  })();
  const result = await _sessionsSync;
  _sessionsSync = null;
  return result;
}

export async function syncUsers(): Promise<boolean> {
  try {
    await fetch('/api/users/ensure-admin').catch(() => {});
    const res = await fetch('/api/users');
    if (!res.ok) return false;
    const rows = (await res.json()) as User[];
    if (!Array.isArray(rows)) return false;
    setUsers(rows);
    return true;
  } catch {
    return false;
  }
}

let _bookingsSync: Promise<boolean> | null = null;

export async function syncBookings(): Promise<boolean> {
  if (_bookingsSync) return _bookingsSync;
  _bookingsSync = (async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) return false;
      const rows = (await res.json()) as Booking[];
      if (!Array.isArray(rows)) return false;
      setBookings(rows);
      return true;
    } catch {
      return false;
    }
  })();
  const result = await _bookingsSync;
  _bookingsSync = null;
  return result;
}

export async function ensureDataReady(): Promise<void> {
  await Promise.all([syncMovies(), syncSessions(), syncUsers(), syncBookings()]);
}
