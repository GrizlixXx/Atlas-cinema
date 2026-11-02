import type { Movie, Session } from './types';
import { getMovies, getSessions, syncMovies, syncSessions, localizeMovie } from './state';
import { t, translateCategory } from './i18n';
import { escapeHtml, showToast } from './ui';
import { getCurrentUser } from './state';

export async function renderMoviesList(): Promise<void> {
  const container = document.getElementById('movies-list');
  if (!container) return;

  container.innerHTML = '<div class="movies-loading"><div class="spinner"></div></div>';

  try {
    await syncMovies();
    await syncSessions();
  } catch { /* use cached */ }

  const movies = getMovies();
  const sessions = getSessions();

  populateFilterOptions(movies);

  const selCategory = document.getElementById('filter-category') as HTMLSelectElement | null;
  const selRating = document.getElementById('filter-rating') as HTMLSelectElement | null;
  const searchInput = document.getElementById('search-movies') as HTMLInputElement | null;

  const filterAndRender = () => {
    const catFilter = selCategory?.value || 'all';
    const ratingFilter = selRating?.value || 'all';
    const search = searchInput?.value.trim().toLocaleLowerCase() || '';

    const filtered = movies
      .filter((m) => {
        const genre = m.genre || m.category || '';
        const rating = m.age_rating || m.rating || '';
        if (catFilter !== 'all' && genre !== catFilter) return false;
        if (ratingFilter !== 'all' && rating !== ratingFilter) return false;
        const searchableText = [
          m.title,
          m.description,
          m.title_uk,
          m.description_uk,
        ].filter(Boolean).join(' ').toLocaleLowerCase();
        if (search && !searchableText.includes(search)) return false;
        return true;
      })
      .map(localizeMovie);

    renderMovieCards(container, filtered, sessions);
  };

  selCategory?.addEventListener('change', filterAndRender);
  selRating?.addEventListener('change', filterAndRender);
  searchInput?.addEventListener('input', filterAndRender);

  filterAndRender();
}

function populateFilterOptions(movies: Movie[]): void {
  const selCategory = document.getElementById('filter-category') as HTMLSelectElement | null;
  const selRating = document.getElementById('filter-rating') as HTMLSelectElement | null;

  if (selCategory) {
    const prev = selCategory.value;
    const genres = Array.from(new Set(movies.map((m) => m.genre || m.category || '').filter(Boolean)));
    selCategory.innerHTML = `<option value="all">${t('movies.all')}</option>` +
      genres.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(translateCategory(g))}</option>`).join('');
    selCategory.value = prev;
  }

  if (selRating) {
    const prev = selRating.value;
    const ratings = Array.from(new Set(movies.map((m) => m.age_rating || m.rating || '').filter(Boolean)));
    selRating.innerHTML = `<option value="all">${t('movies.all')}</option>` +
      ratings.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
    selRating.value = prev;
  }
}

function renderMovieCards(container: HTMLElement, movies: Movie[], sessions: Session[]): void {
  if (movies.length === 0) {
    container.innerHTML = `<div class="no-results"><p>${t('common.no_movies')}</p></div>`;
    return;
  }

  container.innerHTML = '';
  movies.forEach((m) => {
    const card = createMovieCard(m, sessions);
    container.appendChild(card);
  });
}

function createMovieCard(m: Movie, sessions: Session[]): HTMLElement {
  const genre = m.genre || m.category || '';
  const duration = m.duration_min || m.duration_minutes || 0;
  const rating = m.age_rating || m.rating || '';
  const posterUrl = m.poster_url || 'assets/images/poster.jpg';
  const movieSessions = sessions.filter((s) => Number(s.movie_id) === Number(m.id));
  const hasSessions = movieSessions.length > 0;

  const card = document.createElement('article');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(m.title)} poster" class="movie-poster-img" loading="lazy"
           onerror="this.src='assets/images/poster.jpg'">
      <div class="movie-card__overlay">
        <span class="movie-badge">${escapeHtml(rating)}</span>
      </div>
    </div>
    <div class="movie-card__body">
      <div class="movie-card__meta">
        <span class="movie-genre">${escapeHtml(translateCategory(genre))}</span>
        <span class="movie-duration">⏱ ${duration} ${t('common.duration_min')}</span>
      </div>
      <h3 class="movie-card__title">${escapeHtml(m.title)}</h3>
      <p class="movie-card__desc">${escapeHtml(m.description || '')}</p>
    </div>
    <div class="movie-card__footer">
      <a class="btn btn-outline" href="sessions.html?movie_id=${m.id}">${t('movies.sessions')}</a>
      <button class="btn btn-primary quick-book-btn" type="button" data-movie-id="${m.id}" ${!hasSessions ? 'disabled' : ''}>
        ${t('movies.quick_book')}
      </button>
    </div>
  `;

  card.querySelector('.quick-book-btn')?.addEventListener('click', async () => {
    await handleQuickBook(Number(m.id), sessions);
  });

  return card;
}

async function handleQuickBook(movieId: number, sessions: Session[]): Promise<void> {
  const user = getCurrentUser();
  if (!user) { showToast(t('common.please_login_book'), 'error'); return; }

  const bookings = JSON.parse(localStorage.getItem('cinema_bookings') || '[]') as Array<{ session_id: number; seats: string; canceled?: boolean }>;
  const now = Date.now();

  const candidates = sessions
    .filter((s) => Number(s.movie_id) === movieId)
    .sort((a, b) => {
      const tA = new Date(a.start_time.replace(' ', 'T')).getTime() || 0;
      const tB = new Date(b.start_time.replace(' ', 'T')).getTime() || 0;
      return tA - tB;
    });

  for (const s of candidates) {
    const occupied = bookings
      .filter((b) => Number(b.session_id) === s.id && !b.canceled)
      .reduce((acc, b) => acc + (b.seats ? b.seats.split(',').filter(Boolean).length : 0), 0);
    if (occupied < (s.total_seats || 90)) {
      window.location.href = `booking.html?session_id=${s.id}`;
      return;
    }
  }

  showToast(t('movies.quick_book_sold_out'), 'error');
}
