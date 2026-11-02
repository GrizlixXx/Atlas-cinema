export interface Movie {
  id: number;
  title: string;
  title_uk: string;
  description: string;
  description_uk: string;
  duration_min: number;
  age_rating: string;
  poster_url: string;
  genre: string;
  duration_minutes?: number;
  category?: string;
  rating?: string;
}

export interface Session {
  id: number;
  movie_id: number;
  hall_name: string;
  hall?: string;
  start_time: string;
  base_price: number;
  total_seats: number;
  seats_per_row: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface Booking {
  id: number;
  user_id: number;
  session_id: number;
  seats: string;
  created_at: string;
  price_total: number;
  paid: boolean;
  paid_at?: string;
  canceled: boolean;
  canceled_at?: string;
}

export interface AppState {
  currentUser: User | null;
  lang: 'en' | 'uk';
}

export type Lang = 'en' | 'uk';
