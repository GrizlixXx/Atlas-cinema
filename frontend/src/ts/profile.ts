import type { Booking, Movie, Session, User } from './types';
import { getCurrentUser, getBookings, getMovies, getSessions, syncMovies, syncSessions, syncBookings } from './state';
import { getLang, t } from './i18n';
import { escapeHtml, showToast } from './ui';
import { apiPayBooking, apiPayAll, apiCancelBooking, apiDeleteBooking } from './api';

export async function initProfilePage(): Promise<void> {
  try {
    await Promise.all([syncMovies(), syncSessions(), syncBookings()]);
  } catch {
  }

  const user = getCurrentUser();
  renderProfileInfo(user);
  renderBookingsList(user);
  if (user?.role === 'admin') renderAdminSection();
}

function renderProfileInfo(user: User | null): void {
  const el = document.getElementById('profile-info');
  if (!el) return;

  if (!user) {
    el.innerHTML = `<div class="profile-empty"><p>${t('common.please_login')}.</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="profile-card">
      <div class="profile-avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div>
      <div class="profile-details">
        <h2>${escapeHtml(user.name)}</h2>
        <p class="profile-email">${escapeHtml(user.email)}</p>
        <span class="profile-role role-${user.role}">${user.role === 'admin' ? 'Admin' : 'Member'}</span>
      </div>
    </div>
  `;
}

function renderBookingsList(user: User | null): void {
  const el = document.getElementById('bookings-list');
  const adminBtn = document.getElementById('go-admin-btn');
  if (!el) return;

  if (!user) {
    el.innerHTML = '';
    return;
  }

  const allBookings = getBookings();
  const sessions = getSessions();
  const movies = getMovies();
  const myBookings = allBookings.filter(b => b.user_id === user.id);

  if (myBookings.length === 0) {
    el.innerHTML = `<div class="no-bookings"><p>${t('common.no_bookings')} <a href="movies.html">${t('common.browse_movies')}</a>!</p></div>`;
  } else {
    el.innerHTML = '';
    myBookings.forEach(b => {
      const session = sessions.find(s => s.id === b.session_id);
      const movieRaw = movies.find(m => Number(m.id) === Number(session?.movie_id));
      const movie = movieRaw || null;
      el.appendChild(createBookingCard(b, session, movie, user));
    });

    const valid = myBookings.filter(b => !b.canceled);
    const total = valid.reduce((s, b) => s + (b.price_total || 0), 0);
    const paid = valid.reduce((s, b) => s + (b.paid ? b.price_total || 0 : 0), 0);
    const pending = valid.reduce((s, b) => s + (!b.paid ? b.price_total || 0 : 0), 0);

    const summary = document.createElement('div');
    summary.className = 'bookings-summary';
    summary.innerHTML = `
      <div class="summary-row"><span>${t('common.total_amount')}:</span><strong>$${total.toFixed(2)}</strong></div>
      <div class="summary-row"><span>${t('common.paid_amount')}:</span><strong class="paid-amount">$${paid.toFixed(2)}</strong></div>
      <div class="summary-row">
        <span>${t('common.pending_amount')}:</span>
        <strong class="pending-amount">$${pending.toFixed(2)}</strong>
        ${pending > 0 ? `<button class="btn btn-primary" id="pay-all">💳 ${t('common.pay_all')}</button>` : ''}
      </div>
    `;
    el.appendChild(summary);

    document.getElementById('pay-all')?.addEventListener('click', () => payAllBookings(user.id));
  }

  if (user.role === 'admin' && adminBtn) {
    adminBtn.classList.remove('hidden');
    adminBtn.addEventListener('click', () => {
      document.getElementById('admin-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function createBookingCard(b: Booking, session: Session | undefined, movie: Movie | null, user: User): HTMLElement {
  const d = session ? new Date(session.start_time) : null;
  const hall = session ? session.hall_name || session.hall || 'Hall' : 'Session removed';

  let statusClass = 'unpaid';
  let statusText = `⏳ ${t('common.unpaid')}`;
  if (b.canceled) {
    statusClass = 'canceled';
    statusText = t('common.canceled');
  } else if (b.paid) {
    statusClass = 'paid';
    statusText = t('common.paid');
  }

  const el = document.createElement('div');
  el.className = 'booking-card';
  el.innerHTML = `
    <div class="booking-card__header">
      <h4>${escapeHtml(movie?.title || t('common.unknown_movie'))}</h4>
      <span class="booking-status status-${statusClass}">${statusText}</span>
    </div>
    <div class="booking-card__meta">
      <span>🏛 ${escapeHtml(hall)}</span>
      ${d ? `<span>📅 ${d.toLocaleDateString(getLang())}</span><span>⏰ ${d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
    </div>
    <div class="booking-card__seats">
      <span>🪑 ${t('common.seats')}: <strong>${escapeHtml(b.seats)}</strong></span>
      <span>💲 ${t('common.amount')}: <strong>$${b.price_total.toFixed(2)}</strong></span>
    </div>
    <div class="booking-card__actions">
      ${!b.paid && !b.canceled ? `<button class="btn btn-primary pay-one" data-id="${b.id}">💳 ${t('common.pay')}</button>` : ''}
      ${!b.canceled ? `<button class="btn btn-outline cancel-one" data-id="${b.id}">${t('common.cancel')}</button>` : ''}
      ${b.canceled ? `<button class="btn btn-danger delete-one" data-id="${b.id}">🗑 ${t('common.delete')}</button>` : ''}
    </div>
  `;

  el.querySelector('.pay-one')?.addEventListener('click', () => payBooking(b.id));
  el.querySelector('.cancel-one')?.addEventListener('click', () => cancelBooking(b.id));
  el.querySelector('.delete-one')?.addEventListener('click', () => deleteBooking(b.id, user));

  return el;
}

async function payBooking(id: number): Promise<void> {
  try {
    await apiPayBooking(id);
    await syncBookings();
    showToast('Оплачено!', 'success');
    initProfilePage();
  } catch (err) {
    showToast((err as Error).message || 'Payment failed', 'error');
  }
}

async function payAllBookings(userId: number): Promise<void> {
  try {
    const result = await apiPayAll(userId);
    if (result.count === 0) {
      showToast('Немає неоплачених бронювань', 'info');
      return;
    }
    await syncBookings();
    showToast('Усі бронювання оплачено!', 'success');
    initProfilePage();
  } catch (err) {
    showToast((err as Error).message || 'Payment failed', 'error');
  }
}

async function cancelBooking(id: number): Promise<void> {
  try {
    await apiCancelBooking(id);
    await syncBookings();
    showToast('Бронювання скасовано', 'info');
    initProfilePage();
  } catch (err) {
    showToast((err as Error).message || 'Cancel failed', 'error');
  }
}

async function deleteBooking(id: number, user: User): Promise<void> {
  try {
    await apiDeleteBooking(id);
    await syncBookings();
    showToast('Бронювання видалено', 'info');
    initProfilePage();
  } catch (err) {
    showToast((err as Error).message || 'Delete failed', 'error');
  }
}

async function renderAdminSection(): Promise<void> {
  const section = document.getElementById('admin-section');
  if (!section) return;
  section.classList.remove('hidden');
  setupAdminForms();
  await syncMovies();
  populateAdminMovieList();
  populateAdminHallList();
}

function populateAdminMovieList(): void {
  const sel = document.getElementById('admin-session-movie') as HTMLSelectElement | null;
  if (!sel) return;
  const movies = getMovies();
  const prev = sel.value;
  sel.innerHTML = movies.map(m => `<option value="${m.id}">${escapeHtml(m.title)}</option>`).join('');
  if (prev) sel.value = prev;
}

function populateAdminHallList(): void {
  const sel = document.getElementById('admin-session-hall') as HTMLSelectElement | null;
  if (!sel) return;
  const halls = ['Hall A', 'Hall B', 'Hall C', 'VIP Hall', 'Family Hall'];
  const sessions = getSessions();
  const fromSessions = Array.from(new Set(sessions.map(s => s.hall_name || s.hall || '').filter(Boolean)));
  const all = Array.from(new Set([...halls, ...fromSessions])).sort();
  sel.innerHTML = all.map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`).join('');
}

function setupAdminForms(): void {
  const movieForm = document.getElementById('admin-add-movie') as HTMLFormElement | null;
  const sessionForm = document.getElementById('admin-add-session') as HTMLFormElement | null;

  if (movieForm && !movieForm.dataset.bound) {
    movieForm.dataset.bound = '1';
    movieForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(movieForm);
      try {
        const res = await fetch('/api/movies', { method: 'POST', body: fd });
        const result = (await res.json().catch(() => ({}))) as { error?: string; poster_url?: string };
        if (!res.ok) throw new Error(result.error || 'Failed');
        showToast(`Фільм додано! ${result.poster_url || ''}`, 'success');
        movieForm.reset();
        await syncMovies();
        populateAdminMovieList();
      } catch (err) {
        showToast((err as Error).message, 'error');
      }
    });
  }

  if (sessionForm && !sessionForm.dataset.bound) {
    sessionForm.dataset.bound = '1';
    sessionForm.addEventListener('submit', async e => {
      e.preventDefault();
      const movieId = parseInt((document.getElementById('admin-session-movie') as HTMLSelectElement)?.value || '0', 10);
      const hallName = (document.getElementById('admin-session-hall') as HTMLSelectElement)?.value || '';
      const startTime = (document.getElementById('admin-session-start') as HTMLInputElement)?.value || '';
      const basePrice = parseFloat((document.getElementById('admin-session-price') as HTMLInputElement)?.value || '0');

      if (!movieId || !hallName || !startTime || basePrice <= 0) {
        showToast('Fill all fields', 'error');
        return;
      }

      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            movie_id: movieId,
            hall_name: hallName,
            start_time: startTime,
            base_price: basePrice,
          }),
        });
        const result = (await res.json().catch(() => ({}))) as { error?: string; id?: number };
        if (!res.ok) throw new Error(result.error || 'Failed');
        showToast(`Сеанс додано (ID: ${result.id})`, 'success');
        sessionForm.reset();
        await syncSessions();
      } catch (err) {
        showToast((err as Error).message, 'error');
      }
    });
  }
}
