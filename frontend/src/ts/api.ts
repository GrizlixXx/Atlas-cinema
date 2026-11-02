import type { Movie, Session, User, Booking } from './types';

const BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGetMovies(): Promise<Movie[]> {
  return fetchJson<Movie[]>(`${BASE}/movies`);
}

export async function apiAddMovie(formData: FormData): Promise<{ id: number; poster_url: string }> {
  return fetchJson(`${BASE}/movies`, { method: 'POST', body: formData });
}

export async function apiSeedMovies(): Promise<void> {
  await fetchJson(`${BASE}/movies/seed`);
}

export async function apiGetSessions(movieId?: number): Promise<Session[]> {
  const url = movieId ? `${BASE}/sessions?movie_id=${movieId}` : `${BASE}/sessions`;
  return fetchJson<Session[]>(url);
}

export async function apiAddSession(data: {
  movie_id: number;
  hall_name: string;
  start_time: string;
  base_price: number;
}): Promise<{ id: number }> {
  return fetchJson(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function apiGetUsers(): Promise<User[]> {
  return fetchJson<User[]>(`${BASE}/users`);
}

export async function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ id: number; message: string }> {
  return fetchJson(`${BASE}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function apiEnsureAdmin(): Promise<void> {
  await fetchJson(`${BASE}/users/ensure-admin`).catch(() => {});
}

export async function apiGetBookings(params?: { session_id?: number; user_id?: number }): Promise<Booking[]> {
  let url = `${BASE}/bookings`;
  const qs: string[] = [];
  if (params?.session_id) qs.push(`session_id=${params.session_id}`);
  if (params?.user_id) qs.push(`user_id=${params.user_id}`);
  if (qs.length) url += `?${qs.join('&')}`;
  return fetchJson<Booking[]>(url);
}

export async function apiGetOccupiedSeats(sessionId: number): Promise<string[]> {
  return fetchJson<string[]>(`${BASE}/bookings/occupied/${sessionId}`);
}

export async function apiCreateBooking(data: {
  user_id: number;
  session_id: number;
  seats: string;
  price_total: number;
}): Promise<{ success: boolean; id: number }> {
  return fetchJson(`${BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function apiPayBooking(id: number): Promise<{ success: boolean }> {
  return fetchJson(`${BASE}/bookings/${id}/pay`, { method: 'PATCH' });
}

export async function apiPayAll(userId: number): Promise<{ success: boolean; count: number }> {
  return fetchJson(`${BASE}/bookings/pay-all`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function apiCancelBooking(id: number): Promise<{ success: boolean }> {
  return fetchJson(`${BASE}/bookings/${id}/cancel`, { method: 'PATCH' });
}

export async function apiDeleteBooking(id: number): Promise<{ success: boolean }> {
  return fetchJson(`${BASE}/bookings/${id}`, { method: 'DELETE' });
}
