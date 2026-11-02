import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { testConnection } from './config/db';
import moviesRouter from './routes/movies';
import sessionsRouter from './routes/sessions';
import usersRouter from './routes/users';
import bookingsRouter from './routes/bookings';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

app.use('/api/movies', moviesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);

// Legacy PHP-compatible aliases for frontend backward compat
app.get('/api/db_movies.php', (_req, res) => res.redirect('/api/movies'));
app.get('/api/db_sessions.php', (_req, res) => res.redirect('/api/sessions'));
app.get('/api/db_users.php', (_req, res) => res.redirect('/api/users'));
app.get('/api/ensure_admin.php', (_req, res) => res.redirect('/api/users/ensure-admin'));
app.get('/api/seed_movies_uk.php', (_req, res) => res.redirect('/api/movies/seed'));
app.get('/api/seed_sessions.php', (_req, res) => res.redirect('/api/sessions/seed'));
app.post('/api/register.php', (req, res) => res.redirect(307, '/api/users/register'));
app.post('/api/add_movie.php', (req, res) => res.redirect(307, '/api/movies'));
app.post('/api/add_session.php', (req, res) => res.redirect(307, '/api/sessions'));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.warn('MySQL unavailable — some features may not work');
  }

  app.listen(PORT, () => {
    console.log(`Cinema Server running at http://localhost:${PORT}`);
    console.log(`   Frontend: http://localhost:${PORT}/`);
    console.log(`   API:      http://localhost:${PORT}/api/`);
  });
}

bootstrap();

export default app;
