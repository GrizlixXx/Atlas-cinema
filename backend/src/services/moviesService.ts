import pool from '../config/db';
import { Movie, AddMovieBody } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const SAMPLE_MOVIES: Omit<Movie, 'id'>[] = [
  { title: 'The Shawshank Redemption', title_uk: 'Втеча з Шоушенка', description: 'Prison drama about hope and friendship.', description_uk: 'Тюремна драма про надію та дружбу.', duration_min: 142, age_rating: 'R', poster_url: 'assets/images/film1.jpg', genre: 'Drama' },
  { title: 'The Godfather', title_uk: 'Хрещений батько', description: 'Crime family saga and power struggles.', description_uk: 'Сага про мафіозну родину та боротьбу за владу.', duration_min: 175, age_rating: 'R', poster_url: 'assets/images/film2.jpg', genre: 'Crime' },
  { title: 'The Dark Knight', title_uk: 'Темний лицар', description: 'Superhero crime thriller.', description_uk: 'Супергеройський кримінальний трилер.', duration_min: 152, age_rating: 'PG-13', poster_url: 'assets/images/film3.jpg', genre: 'Action' },
  { title: 'Pulp Fiction', title_uk: 'Кримінальне чтиво', description: 'Interwoven crime stories.', description_uk: 'Переплетені кримінальні історії.', duration_min: 154, age_rating: 'R', poster_url: 'assets/images/film4.jpg', genre: 'Crime' },
  { title: 'The Lord of the Rings: The Fellowship of the Ring', title_uk: 'Володар перснів: Братство персня', description: 'Epic fantasy quest begins.', description_uk: 'Початок епічної фантастичної подорожі.', duration_min: 178, age_rating: 'PG-13', poster_url: 'assets/images/film5.jpg', genre: 'Fantasy' },
  { title: 'Inception', title_uk: 'Початок', description: 'Mind-bending heist within dreams.', description_uk: 'Пограбування у світі снів та підсвідомості.', duration_min: 148, age_rating: 'PG-13', poster_url: 'assets/images/film6.jpg', genre: 'Sci-Fi' },
  { title: 'Forrest Gump', title_uk: 'Форрест Ґамп', description: 'Life story spanning decades.', description_uk: 'Історія життя, що охоплює десятиліття.', duration_min: 142, age_rating: 'PG-13', poster_url: 'assets/images/film7.jpg', genre: 'Drama' },
  { title: 'The Matrix', title_uk: 'Матриця', description: 'Reality-bending cyber-action.', description_uk: 'Кібербойовик про реальність, яку можна зламати.', duration_min: 136, age_rating: 'R', poster_url: 'assets/images/film8.jpg', genre: 'Sci-Fi' },
  { title: 'Interstellar', title_uk: 'Інтерстеллар', description: 'Space exploration and family bonds.', description_uk: "Космічна експедиція та сімейні зв'язки.", duration_min: 169, age_rating: 'PG-13', poster_url: 'assets/images/film9.jpg', genre: 'Sci-Fi' },
  { title: 'Parasite', title_uk: 'Паразити', description: 'Social satire with suspense.', description_uk: 'Соціальна сатира з напругою та несподіванками.', duration_min: 132, age_rating: 'R', poster_url: 'assets/images/film10.jpg', genre: 'Thriller' },
  { title: 'Joker', title_uk: 'Джокер', description: 'Origin story of a troubled comedian.', description_uk: 'Історія походження трагічного коміка.', duration_min: 122, age_rating: 'R', poster_url: 'assets/images/film11.jpg', genre: 'Drama' },
  { title: 'Spirited Away', title_uk: 'Віднесені привидами', description: 'Magical coming-of-age animated tale.', description_uk: 'Магічна історія дорослішання у світі духів.', duration_min: 125, age_rating: 'PG', poster_url: 'assets/images/film12.jpg', genre: 'Animation' },
  { title: 'The Lion King', title_uk: 'Король Лев', description: 'Animated family musical adventure.', description_uk: 'Сімейна музична пригода в савані.', duration_min: 88, age_rating: 'G', poster_url: 'assets/images/film13.jpg', genre: 'Animation' },
  { title: 'Titanic', title_uk: 'Титанік', description: 'Epic romance aboard a doomed ship.', description_uk: 'Епічна романтична історія на борту приреченого корабля.', duration_min: 195, age_rating: 'PG-13', poster_url: 'assets/images/film14.jpg', genre: 'Romance' },
  { title: 'Gladiator', title_uk: 'Гладіатор', description: 'Historical revenge and spectacle.', description_uk: 'Історія помсти, честі та видовища у Стародавньому Римі.', duration_min: 155, age_rating: 'R', poster_url: 'assets/images/film15.jpg', genre: 'Action' },
  { title: 'Back to the Future', title_uk: 'Назад у майбутнє', description: 'Time-traveling adventure.', description_uk: 'Пригода з подорожами у часі.', duration_min: 116, age_rating: 'PG', poster_url: 'assets/images/film16.jpg', genre: 'Comedy' },
  { title: 'It', title_uk: 'Воно', description: 'Seven children are terrorized by Pennywise the Dancing Clown.', description_uk: 'Містичний жах про древнє зло, що повертається кожні 27 років.', duration_min: 135, age_rating: 'R', poster_url: 'assets/images/film17.jpg', genre: 'Thriller' },
  { title: 'Robin Hood', title_uk: 'Робін Гуд', description: 'A crusader returns to fight corruption as a masked vigilante.', description_uk: 'Пригодницька історія про шляхетного розбійника та боротьбу за справедливість.', duration_min: 116, age_rating: 'PG-13', poster_url: 'assets/images/film18.jpg', genre: 'Action' },
];

export async function getAllMovies(): Promise<Movie[]> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM movies ORDER BY id');
  return rows as Movie[];
}

export async function getMovieById(id: number): Promise<Movie | null> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM movies WHERE id = ?', [id]);
  return (rows[0] as Movie) || null;
}

export async function addMovie(data: AddMovieBody, posterUrl: string): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO movies (title, title_uk, description, description_uk, duration_min, age_rating, genre, poster_url) VALUES (?,?,?,?,?,?,?,?)',
    [data.title, data.title_uk || '', data.description || '', data.description_uk || '', data.duration_min, data.age_rating, data.genre, posterUrl]
  );
  return result.insertId;
}

export async function seedDefaultMovies(): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM movies');
  const count = (rows[0] as { cnt: number }).cnt;
  if (count >= SAMPLE_MOVIES.length) return;

  for (const m of SAMPLE_MOVIES) {
    await pool.query(
      'INSERT IGNORE INTO movies (title, title_uk, description, description_uk, duration_min, age_rating, genre, poster_url) VALUES (?,?,?,?,?,?,?,?)',
      [m.title, m.title_uk, m.description, m.description_uk, m.duration_min, m.age_rating, m.genre, m.poster_url]
    );
  }
}
