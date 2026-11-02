import type { Movie, Session } from './types';
import { getMovies, getSessions, syncMovies, syncSessions, localizeMovie } from './state';
import { getLang, t } from './i18n';
import { escapeHtml } from './ui';

export async function initSessionsPage(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const movieId = parseInt(params.get('movie_id') || '0', 10);

  try {
    await Promise.all([syncMovies(), syncSessions()]);
  } catch { /* use cached */ }

  const movies = getMovies();
  const sessions = getSessions();

  const movieRaw = movies.find((m) => Number(m.id) === movieId) || movies[0];
  const movie = movieRaw ? localizeMovie(movieRaw) : null;

  renderMovieInfo(movie);
  renderSessionsList(sessions, movie);

  document.getElementById('back-to-movies')?.addEventListener('click', () => {
    location.href = 'movies.html';
  });
}

function renderMovieInfo(movie: Movie | null): void {
  const el = document.getElementById('movie-info');
  if (!el || !movie) return;

  const genre = movie.genre || movie.category || '';
  const duration = movie.duration_min || movie.duration_minutes || 0;
  const rating = movie.age_rating || movie.rating || '';

  el.innerHTML = `
    <div class="movie-hero">
      <div class="movie-hero__poster">
        <img src="${escapeHtml(movie.poster_url || 'assets/images/poster.jpg')}"
             alt="${escapeHtml(movie.title)}" class="movie-hero-poster"
             onerror="this.src='assets/images/poster.jpg'">
      </div>
      <div class="movie-hero__info">
        <div class="movie-hero__badges">
          <span class="badge badge-genre">${escapeHtml(genre)}</span>
          <span class="badge badge-rating">${escapeHtml(rating)}</span>
        </div>
        <h1>${escapeHtml(movie.title)}</h1>
        <p class="movie-hero__duration">⏱ ${duration} ${t('common.duration_min')}</p>
        <p class="movie-hero__desc">${escapeHtml(movie.description || '')}</p>
      </div>
    </div>
  `;
}

function renderSessionsList(sessions: Session[], movie: Movie | null): void {
  const list = document.getElementById('sessions-list');
  if (!list) return;

  const movieSessions = movie
    ? sessions.filter((s) => Number(s.movie_id) === Number(movie.id))
    : sessions;

  if (movieSessions.length === 0) {
    list.innerHTML = `<div class="no-sessions"><p>${t('common.no_sessions')}</p></div>`;
    return;
  }

  list.innerHTML = '';
  movieSessions.forEach((s) => {
    const d = new Date(s.start_time);
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <div class="session-card__info">
        <div class="session-card__hall">
          <span class="session-icon">🏛</span>
          <strong>${escapeHtml(s.hall_name || s.hall || '')}</strong>
        </div>
        <div class="session-card__time">
          <span class="session-day">${d.toLocaleDateString(getLang(), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span class="session-hour">${d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="session-card__price">
          <span class="price-label">${t('common.price')}</span>
          <span class="price-value">$${Number(s.base_price).toFixed(2)}</span>
        </div>
      </div>
      <button class="btn btn-primary select-session" data-session-id="${s.id}">
        ${t('booking.seat_map')}
      </button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll<HTMLButtonElement>('.select-session').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sid = parseInt(btn.dataset.sessionId || '0', 10);
      if (sid) window.location.href = `booking.html?session_id=${sid}`;
    });
  });
}
