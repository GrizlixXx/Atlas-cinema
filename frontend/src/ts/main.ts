import { initUI } from './ui';
import { renderMoviesList } from './movies';
import { initSessionsPage } from './sessions';
import { initBookingPage } from './booking';
import { initProfilePage } from './profile';
import { initStatsPage } from './stats';

(window as any).cinema = {
  initUI,
  renderMoviesList,
  initSessionsPage,
  initBookingPage,
  initProfilePage,
  initStatsPage,
};
