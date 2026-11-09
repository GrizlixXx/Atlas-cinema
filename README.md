# Atlas Cinema

Atlas Cinema is a full-stack cinema booking application for browsing movies, checking showtimes, selecting seats, and managing bookings. The project includes a responsive web interface, user authentication, an admin panel, bilingual content, and cinema statistics.

## Features

- Browse movies by title, genre, age rating, and description
- View available cinema sessions and ticket prices
- Interactive seat map with occupied and selected seats
- User registration, login, profile, and booking history
- Booking payment status management
- Admin panel for adding movies, posters, and sessions
- Cinema statistics: bookings, revenue, attendance, popular movies, and hall occupancy
- English and Ukrainian interface localization
- Responsive layout for desktop and mobile devices
- REST API for movies, sessions, users, and bookings

## Technologies

- **HTML5** — semantic page structure and accessible form elements
- **CSS3** — responsive layouts, custom components, animations, Flexbox, and CSS Grid
- **TypeScript** — type-safe frontend and backend development
- **JavaScript DOM API** — client-side interactions and dynamic page updates
- **Node.js** — backend runtime environment
- **Express.js** — REST API, routing, middleware, and static frontend serving
- **MySQL** — relational database for movies, sessions, users, and bookings
- **mysql2** — promise-based MySQL connection pool
- **bcryptjs** — password hashing
- **CORS** — cross-origin request handling
- **dotenv** — environment variable configuration
- **Multer** — poster image upload handling
- **esbuild** — fast frontend bundling and minification
- **i18n** — custom English/Ukrainian localization system
- **BEM-inspired CSS architecture** — reusable and predictable class naming
- **Git** — version control

## Project Structure

```
backend/      Express API and MySQL services
database/     MySQL schema and seed data
frontend/     HTML pages, styles, assets, and TypeScript client code
Procfile      Deployment command
```

### Requirements

- Node.js 22+
- MySQL 8+
- npm

### Installation

Install dependencies for both application parts:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Create a MySQL database and import [`database/cinema_db.sql`](database/cinema_db.sql). Then create `backend/.env` with the database configuration:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cinema_db
PORT=3000
```

### Development

Build the frontend and backend:

```bash
npm run build --prefix frontend
npm run build --prefix backend
```

Start the application:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For frontend development with automatic rebuilding:

```bash
npm run watch --prefix frontend
```

## Links

- [GitHub Repository](https://github.com/GrizlixXx/Atlant-cinema)
