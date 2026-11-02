import type { Session, Booking, Movie } from './types';
import { getMovies, getSessions, syncMovies, syncSessions, localizeMovie, syncBookings } from './state';
import { getCurrentUser } from './state';
import { getLang, t } from './i18n';
import { escapeHtml, showToast } from './ui';
import { apiGetOccupiedSeats, apiCreateBooking, apiGetBookings } from './api';

interface SeatState {
  sessionId: number | null;
  selectedSeats: string[];
  pricePerSeat: number;
}

const seatState: SeatState = {
  sessionId: null,
  selectedSeats: [],
  pricePerSeat: 12.5,
};

export async function initBookingPage(): Promise<void> {
  try {
    await Promise.all([syncMovies(), syncSessions()]);
  } catch { /* use cached */ }

  const params = new URLSearchParams(location.search);
  const sessionId = parseInt(params.get('session_id') || '0', 10);

  if (!sessionId) {
    const titleEl = document.getElementById('booking-movie-title');
    if (titleEl) titleEl.textContent = t('booking.no_session');
    return;
  }

  const sessions = getSessions();
  const movies = getMovies();
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    showToast(t('booking.session_not_found'), 'error');
    return;
  }

  const movieRaw = movies.find((m) => Number(m.id) === Number(session.movie_id));
  const movie = movieRaw ? localizeMovie(movieRaw) : null;

  renderBookingHero(movie, session);
  await renderSeatMap(sessionId, session);
}

function renderBookingHero(movie: Movie | null, session: Session): void {
  if (!movie) return;

  const genre = movie.genre || movie.category || '';
  const duration = movie.duration_min || movie.duration_minutes || 0;
  const rating = movie.age_rating || movie.rating || '';
  const d = new Date(session.start_time);

  const titleEl = document.getElementById('booking-movie-title');
  const descEl = document.getElementById('booking-movie-desc');
  const metaEl = document.getElementById('booking-movie-meta');
  const posterEl = document.getElementById('booking-movie-poster') as HTMLImageElement | null;

  if (titleEl) titleEl.textContent = movie.title;
  if (descEl) descEl.textContent = movie.description || '';
  if (metaEl) metaEl.textContent = `${genre} • ${duration} ${t('common.duration_min')} • ${rating}`;
  if (posterEl) {
    posterEl.src = movie.poster_url || 'assets/images/poster.jpg';
    posterEl.alt = movie.title;
  }

  const sessionInfoEl = document.getElementById('booking-session-info');
  if (sessionInfoEl) {
    const hall = session.hall_name || session.hall || '';
    sessionInfoEl.innerHTML = `
      <div class="session-badge">
        <span>🏛 ${escapeHtml(hall)}</span>
        <span>📅 ${d.toLocaleDateString(getLang(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>⏰ ${d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' })}</span>
        <span>💲 ${Number(session.base_price).toFixed(2)} / ${t('common.seats').toLowerCase()}</span>
      </div>
    `;
  }
}

async function renderSeatMap(sessionId: number, session: Session): Promise<void> {
  const seatMap = document.getElementById('seat-map');
  if (!seatMap) return;

  seatState.sessionId = sessionId;
  seatState.selectedSeats = [];
  seatState.pricePerSeat = Number(session.base_price) || 12.5;

  const totalSeats = session.total_seats || 90;
  const seatsPerRow = session.seats_per_row || 10;
  const rows = Math.ceil(totalSeats / seatsPerRow);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let occupiedList: string[] = [];
  let myBookings: Booking[] = [];
  const user = getCurrentUser();

  try {
    occupiedList = await apiGetOccupiedSeats(sessionId);
  } catch {
    occupiedList = [];
  }

  if (user) {
    try {
      const sessionBookings = await apiGetBookings({ session_id: sessionId });
      myBookings = sessionBookings.filter((b: Booking) => b.user_id === user.id && !b.canceled);
    } catch {
      myBookings = [];
    }
  }

  const occupied = new Set<string>(occupiedList);
  const mine = new Set<string>();

  myBookings.forEach((b: Booking) => {
    b.seats.split(',').map((s) => s.trim()).filter(Boolean).forEach((seat) => {
      mine.add(seat);
    });
  });

  seatMap.style.gridTemplateColumns = `auto repeat(${seatsPerRow}, 1fr)`;
  seatMap.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'seat-row-label';
    rowLabel.textContent = letters[r] || `R${r + 1}`;
    seatMap.appendChild(rowLabel);

    for (let c = 0; c < seatsPerRow; c++) {
      const idx = r * seatsPerRow + c;
      if (idx >= totalSeats) continue;

      const label = `${letters[r] || 'R'}${c + 1}`;
      const seat = document.createElement('button');
      seat.className = 'seat';
      seat.setAttribute('data-seat', label);
      seat.setAttribute('title', label);
      seat.setAttribute('type', 'button');
      seat.textContent = label;

      if (mine.has(label)) {
        seat.classList.add('occupied', 'mine');
        seat.disabled = true;
        seat.title = `${label} — ${t('common.my_seats')}`;
      } else if (occupied.has(label)) {
        seat.classList.add('occupied');
        seat.disabled = true;
        seat.title = `${label} — ${t('common.occupied')}`;
      } else {
        seat.addEventListener('click', () => toggleSeat(seat, label));
      }

      seatMap.appendChild(seat);
    }
  }

  updateSummary();

  document.getElementById('confirm-booking')?.addEventListener('click', confirmBooking);
}

function toggleSeat(el: HTMLElement, label: string): void {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    seatState.selectedSeats = seatState.selectedSeats.filter((s) => s !== label);
  } else {
    el.classList.add('selected');
    seatState.selectedSeats.push(label);
  }
  updateSummary();
}

function updateSummary(): void {
  const seatsEl = document.getElementById('selected-seats');
  const totalEl = document.getElementById('selected-total');
  if (seatsEl) seatsEl.textContent = seatState.selectedSeats.length ? seatState.selectedSeats.join(', ') : t('common.none');
  if (totalEl) totalEl.textContent = (seatState.selectedSeats.length * seatState.pricePerSeat).toFixed(2);
}

async function confirmBooking(): Promise<void> {
  const user = getCurrentUser();
  if (!user) { showToast(t('common.please_login'), 'error'); return; }
  if (!seatState.sessionId || seatState.selectedSeats.length === 0) {
    showToast(t('common.select_seat'), 'error');
    return;
  }

  const priceTotal = parseFloat((seatState.selectedSeats.length * seatState.pricePerSeat).toFixed(2));

  try {
    await apiCreateBooking({
      user_id: user.id,
      session_id: seatState.sessionId,
      seats: seatState.selectedSeats.join(','),
      price_total: priceTotal,
    });

    await syncBookings();

    showToast(`${t('booking.confirmed')}${seatState.selectedSeats.join(',')}`, 'success');
    seatState.sessionId = null;
    setTimeout(() => { location.href = 'profile.html'; }, 1500);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Booking failed';
    showToast(msg, 'error');
  }
}
