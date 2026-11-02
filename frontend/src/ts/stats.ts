import { getBookings, getMovies, getSessions, getUsers, ensureDataReady } from './state';
import { escapeHtml } from './ui';
import { getLang, t } from './i18n';

declare const Chart: any;

export async function initStatsPage(): Promise<void> {
  await ensureDataReady();

  const bookings = getBookings();
  const movies = getMovies();
  const sessions = getSessions();
  const users = getUsers();

  renderSummaryCards(bookings, sessions, movies, users);

  const waitChart = (cb: () => void) => {
    if (typeof Chart !== 'undefined') cb();
    else setTimeout(() => waitChart(cb), 200);
  };
  waitChart(() => renderCharts(bookings, sessions, movies, users));
}

function renderSummaryCards(bookings: ReturnType<typeof getBookings>, sessions: ReturnType<typeof getSessions>, movies: ReturnType<typeof getMovies>, users: ReturnType<typeof getUsers>): void {
  const valid = bookings.filter((b) => !b.canceled);
  const totalRevenue = valid.filter((b) => b.paid).reduce((s, b) => s + (b.price_total || 0), 0);
  const pending = valid.filter((b) => !b.paid).reduce((s, b) => s + (b.price_total || 0), 0);
  const seatsSold = valid.reduce((s, b) => s + (b.seats ? b.seats.split(',').filter(Boolean).length : 0), 0);

  const hallCounts: Record<string, number> = {};
  valid.forEach((b) => {
    const s = sessions.find((ss) => ss.id === b.session_id);
    if (s) {
      const hall = s.hall_name || s.hall || '';
      hallCounts[hall] = (hallCounts[hall] || 0) + (b.seats ? b.seats.split(',').length : 0);
    }
  });
  const topHall = Object.entries(hallCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const summary = document.getElementById('summary');
  if (!summary) return;
  summary.innerHTML = `
    <div class="summary-card"><div class="summary-icon">🎫</div><h4>${t('stats.bookings')}</h4><div class="summary-value">${bookings.length}</div></div>
    <div class="summary-card"><div class="summary-icon">👥</div><h4>${t('stats.users')}</h4><div class="summary-value">${users.length}</div></div>
    <div class="summary-card"><div class="summary-icon">💰</div><h4>${t('stats.revenue')} ($)</h4><div class="summary-value">$${totalRevenue.toFixed(2)}</div></div>
    <div class="summary-card"><div class="summary-icon">⏳</div><h4>${t('common.pending_amount')}</h4><div class="summary-value">$${pending.toFixed(2)}</div></div>
    <div class="summary-card"><div class="summary-icon">🪑</div><h4>${t('stats.tickets_sold')}</h4><div class="summary-value">${seatsSold}</div></div>
    <div class="summary-card"><div class="summary-icon">🏆</div><h4>${t('stats.top_hall')}</h4><div class="summary-value">${escapeHtml(topHall)}</div></div>
    <div class="summary-card"><div class="summary-icon">🎬</div><h4>${t('stats.movies')}</h4><div class="summary-value">${movies.length}</div></div>
    <div class="summary-card"><div class="summary-icon">🕐</div><h4>${t('stats.sessions')}</h4><div class="summary-value">${sessions.length}</div></div>
  `;
}

function renderCharts(bookings: ReturnType<typeof getBookings>, sessions: ReturnType<typeof getSessions>, movies: ReturnType<typeof getMovies>, users: ReturnType<typeof getUsers>): void {
  const valid = bookings.filter((b) => !b.canceled);

  const byDate: Record<string, number> = {};
  valid.forEach((b) => { const d = new Date(b.created_at).toLocaleDateString(getLang()); byDate[d] = (byDate[d] || 0) + 1; });
  const dateLabels = Object.keys(byDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  newChart('bookings-count-chart', {
    type: 'line',
    data: { labels: dateLabels, datasets: [{ label: t('stats.bookings'), data: dateLabels.map((d) => byDate[d]), fill: true, tension: 0.35, backgroundColor: 'rgba(245,197,24,0.15)', borderColor: '#f5c518', borderWidth: 2 }] },
    options: chartOptions(),
  });

  const filmCounts: Record<string, number> = {};
  valid.forEach((b) => {
    const s = sessions.find((ss) => ss.id === b.session_id);
    const m = movies.find((mm) => Number(mm.id) === Number(s?.movie_id));
    const title = m ? (m.title.length > 20 ? m.title.substring(0, 20) + '…' : m.title) : 'Unknown';
    filmCounts[title] = (filmCounts[title] || 0) + (b.seats ? b.seats.split(',').length : 1);
  });
  const filmEntries = Object.entries(filmCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  newChart('popular-films-chart', {
    type: 'bar',
    data: { labels: filmEntries.map((e) => e[0]), datasets: [{ label: t('stats.tickets_sold'), data: filmEntries.map((e) => e[1]), backgroundColor: 'rgba(229,9,20,0.8)', borderColor: '#e50914', borderWidth: 1, borderRadius: 6 }] },
    options: chartOptions(),
  });

  const hallTotals: Record<string, number> = {};
  const hallBooked: Record<string, number> = {};
  sessions.forEach((s) => { const h = s.hall_name || s.hall || ''; hallTotals[h] = (hallTotals[h] || 0) + (s.total_seats || 90); });
  valid.forEach((b) => {
    const s = sessions.find((ss) => ss.id === b.session_id);
    if (s) {
      const h = s.hall_name || s.hall || '';
      hallBooked[h] = (hallBooked[h] || 0) + (b.seats ? b.seats.split(',').length : 0);
    }
  });
  const hallLabels = Object.keys(hallTotals);

  newChart('hall-utilization-chart', {
    type: 'bar',
    data: { labels: hallLabels, datasets: [{ label: t('stats.occupancy_percent'), data: hallLabels.map((h) => hallTotals[h] ? Math.round((hallBooked[h] || 0) / hallTotals[h] * 100) : 0), backgroundColor: hallLabels.map((_, i) => i % 2 === 0 ? 'rgba(245,197,24,0.8)' : 'rgba(107,140,255,0.8)'), borderRadius: 6 }] },
    options: { ...chartOptions(), scales: { ...chartOptions().scales, y: { ...chartOptions().scales?.y, max: 100 } } },
  });

  const paidByDate: Record<string, number> = {};
  const unpaidByDate: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.canceled) return;
    const d = new Date(b.created_at).toLocaleDateString(getLang());
    if (b.paid) paidByDate[d] = (paidByDate[d] || 0) + (b.price_total || 0);
    else unpaidByDate[d] = (unpaidByDate[d] || 0) + (b.price_total || 0);
  });
  const revLabels = Array.from(new Set([...Object.keys(paidByDate), ...Object.keys(unpaidByDate)])).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  newChart('revenue-chart', {
    type: 'line',
    data: {
      labels: revLabels,
      datasets: [
        { label: t('common.paid'), data: revLabels.map((d) => parseFloat((paidByDate[d] || 0).toFixed(2))), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.35, borderWidth: 2 },
        { label: t('common.unpaid'), data: revLabels.map((d) => parseFloat((unpaidByDate[d] || 0).toFixed(2))), borderColor: '#e50914', backgroundColor: 'rgba(229,9,20,0.12)', fill: true, tension: 0.35, borderWidth: 2 },
      ],
    },
    options: chartOptions(),
  });

  const roleMap: Record<string, number> = {};
  users.forEach((u) => { const r = (u as any).role || 'user'; roleMap[r] = (roleMap[r] || 0) + 1; });
  const unique = new Set(valid.map((b) => b.user_id)).size;

  newChart('users-chart', {
    type: 'bar',
    data: { labels: [t('stats.all_users'), t('stats.with_bookings'), t('stats.admins')], datasets: [{ label: t('stats.users'), data: [users.length, unique, roleMap['admin'] || 0], backgroundColor: ['rgba(107,140,255,0.8)', 'rgba(245,197,24,0.8)', 'rgba(229,9,20,0.8)'], borderRadius: 6 }] },
    options: chartOptions(),
  });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e6eef6' } } },
    scales: {
      x: { ticks: { color: '#9aa6b2' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { beginAtZero: true, ticks: { color: '#9aa6b2' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };
}

const chartInstances: Record<string, any> = {};
function newChart(id: string, config: any): void {
  const el = document.getElementById(id) as HTMLCanvasElement | null;
  if (!el) return;
  chartInstances[id]?.destroy();
  chartInstances[id] = new Chart(el.getContext('2d'), config);
}
