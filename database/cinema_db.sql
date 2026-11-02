SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `movies` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `title_uk` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `description_uk` text DEFAULT NULL,
  `duration_min` int(11) NOT NULL,
  `age_rating` varchar(10) NOT NULL,
  `poster_url` varchar(500) DEFAULT NULL,
  `genre` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `movies` (`id`, `title`, `title_uk`, `description`, `description_uk`, `duration_min`, `age_rating`, `poster_url`, `genre`) VALUES
(1, 'The Shawshank Redemption', 'Втеча з Шоушенка', 'Prison drama about hope and friendship.', 'Тюремна драма про надію та дружбу.', 142, 'R', 'assets/images/film1.jpg', 'Drama'),
(2, 'The Godfather', 'Хрещений батько', 'Crime family saga and power struggles.', 'Сага про мафіозну родину та боротьбу за владу.', 175, 'R', 'assets/images/film2.jpg', 'Crime'),
(3, 'The Dark Knight', 'Темний лицар', 'Superhero crime thriller.', 'Супергеройський кримінальний трилер.', 152, 'PG-13', 'assets/images/film3.jpg', 'Action'),
(4, 'Pulp Fiction', 'Кримінальне чтиво', 'Interwoven crime stories.', 'Переплетені кримінальні історії.', 154, 'R', 'assets/images/film4.jpg', 'Crime'),
(5, 'The Lord of the Rings: The Fellowship of the Ring', 'Володар перснів: Братство персня', 'Epic fantasy quest begins.', 'Початок епічної фантастичної подорожі.', 178, 'PG-13', 'assets/images/film5.jpg', 'Fantasy'),
(6, 'Inception', 'Початок', 'Mind-bending heist within dreams.', 'Пограбування у світі снів та підсвідомості.', 148, 'PG-13', 'assets/images/film6.jpg', 'Sci-Fi'),
(7, 'Forrest Gump', 'Форрест Ґамп', 'Life story spanning decades.', 'Історія життя, що охоплює десятиліття.', 142, 'PG-13', 'assets/images/film7.jpg', 'Drama'),
(8, 'The Matrix', 'Матриця', 'Reality-bending cyber-action.', 'Кібербойовик про реальність, яку можна зламати.', 136, 'R', 'assets/images/film8.jpg', 'Sci-Fi'),
(9, 'Interstellar', 'Інтерстеллар', 'Space exploration and family bonds.', 'Космічна експедиція та сімейні зв\'язки.', 169, 'PG-13', 'assets/images/film9.jpg', 'Sci-Fi'),
(10, 'Parasite', 'Паразити', 'Social satire with suspense.', 'Соціальна сатира з напругою та несподіванками.', 132, 'R', 'assets/images/film10.jpg', 'Thriller'),
(11, 'Joker', 'Джокер', 'Origin story of a troubled comedian.', 'Історія походження трагічного коміка.', 122, 'R', 'assets/images/film11.jpg', 'Drama'),
(12, 'Spirited Away', 'Віднесені привидами', 'Magical coming-of-age animated tale.', 'Магічна історія дорослішання у світі духів.', 125, 'PG', 'assets/images/film12.jpg', 'Animation'),
(13, 'The Lion King', 'Король Лев', 'Animated family musical adventure.', 'Сімейна музична пригода в савані.', 88, 'G', 'assets/images/film13.jpg', 'Animation'),
(14, 'Titanic', 'Титанік', 'Epic romance aboard a doomed ship.', 'Епічна романтична історія на борту приреченого корабля.', 195, 'PG-13', 'assets/images/film14.jpg', 'Romance'),
(15, 'Gladiator', 'Гладіатор', 'Historical revenge and spectacle.', 'Історія помсти, честі та видовища у Стародавньому Римі.', 155, 'R', 'assets/images/film15.jpg', 'Action'),
(16, 'Back to the Future', 'Назад у майбутнє', 'Time-traveling adventure.', 'Пригода з подорожами у часі.', 116, 'PG', 'assets/images/film16.jpg', 'Comedy'),
(17, 'It', 'Воно', 'The story follows seven outcast children in the town of Derry who are terrorized by an ancient, shape-shifting evil that typically appears as Pennywise the Dancing Clown.', 'Містичний жах про древнє зло, що повертається кожні 27 років.', 135, 'R', 'assets/images/film17.jpg', 'Thriller'),
(18, 'Robin hood', 'Робін Гуд', 'Robin of Loxley, a war-hardened Crusader, returns to Nottingham and discovers a corrupt kingdom ruled by a greedy Sheriff. To fight back, he becomes a masked vigilante who steals from the rich to lead a revolution.', 'Пригодницька історія про шляхетного розбійника та боротьбу за справедливість.', 116, 'PG-13', 'assets/images/film18.jpg', 'Action');

-- --------------------------------------------------------

--
-- Структура таблиці `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `movie_id` int(11) NOT NULL,
  `hall_name` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL COMMENT 'Формат: 25.12.2025 18:00:00',
  `base_price` decimal(10,2) NOT NULL COMMENT 'Ціна за одне місце'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп даних таблиці `sessions`
--

INSERT INTO `sessions` (`id`, `movie_id`, `hall_name`, `start_time`, `base_price`) VALUES
(1, 1, 'Hall A', '2025-12-23 18:00:00', 12.50),
(2, 1, 'Hall A', '2025-12-23 20:00:00', 12.50),
(3, 2, 'Hall B', '2025-12-24 18:00:00', 12.50),
(4, 2, 'Hall B', '2025-12-24 20:00:00', 12.50),
(5, 3, 'Hall C', '2025-12-25 18:00:00', 12.50),
(6, 3, 'Hall C', '2025-12-25 20:00:00', 12.50),
(7, 4, 'VIP Hall', '2025-12-26 18:00:00', 12.50),
(8, 4, 'VIP Hall', '2025-12-26 20:00:00', 12.50),
(9, 5, 'Family Hall', '2025-12-27 18:00:00', 12.50),
(10, 5, 'Family Hall', '2025-12-27 20:00:00', 12.50),
(11, 6, 'Hall A', '2025-12-28 18:00:00', 12.50),
(12, 6, 'Hall A', '2025-12-28 20:00:00', 12.50),
(13, 7, 'Hall B', '2025-12-29 18:00:00', 12.50),
(14, 7, 'Hall B', '2025-12-29 20:00:00', 12.50),
(15, 8, 'Hall C', '2025-12-30 18:00:00', 12.50),
(16, 8, 'Hall C', '2025-12-30 20:00:00', 12.50),
(17, 9, 'VIP Hall', '2025-12-31 18:00:00', 12.50),
(18, 9, 'VIP Hall', '2025-12-31 20:00:00', 12.50),
(19, 10, 'Family Hall', '2026-01-01 18:00:00', 12.50),
(20, 10, 'Family Hall', '2026-01-01 20:00:00', 12.50),
(21, 11, 'Hall A', '2026-01-02 18:00:00', 12.50),
(22, 11, 'Hall A', '2026-01-02 20:00:00', 12.50),
(23, 12, 'Hall B', '2026-01-03 18:00:00', 12.50),
(24, 12, 'Hall B', '2026-01-03 20:00:00', 12.50),
(25, 13, 'Hall C', '2026-01-04 18:00:00', 12.50),
(26, 13, 'Hall C', '2026-01-04 20:00:00', 12.50),
(27, 14, 'VIP Hall', '2026-01-05 18:00:00', 12.50),
(28, 14, 'VIP Hall', '2026-01-05 20:00:00', 12.50),
(29, 15, 'Family Hall', '2026-01-06 18:00:00', 12.50),
(30, 15, 'Family Hall', '2026-01-06 20:00:00', 12.50),
(31, 16, 'Hall A', '2026-01-07 18:00:00', 12.50),
(32, 16, 'Hall A', '2026-01-07 20:00:00', 12.50),
(33, 17, 'Hall A', '2026-01-08 16:00:00', 12.50),
(34, 17, 'Hall B', '2026-01-08 16:00:00', 10.00);

-- --------------------------------------------------------

--
-- Структура таблиці `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `pass_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп даних таблиці `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `pass_hash`, `phone`, `role`, `created_at`) VALUES
(1, 'GrizlixXx', 'illasumar002@gmail.com', '$2y$10$r9tSnClKyTMyId5xZpxWbO1Lc7xL33ycRJ8vbhubhLl5j/M0KmTJK', '+380668050356', 'user', '2025-12-18 17:36:21'),
(2, 'Krol', 'Krol@gmail.com', '$2y$10$f3YEyOPLuHVPxKpBoAi7IOYx.aKdyZvRo81ArgeSwBMuYrxj9sfNq', '+3801338874382', 'user', '2025-12-18 17:40:49'),
(3, 'Richi', 'richi1030@gmail.com', '$2y$10$p72J0qvhTfQz57cQHM6p8eSQRt7JurejGJS8jG8uz2eZquPyfOrbK', '+380123456789', 'user', '2025-12-22 09:33:00'),
(4, 'roki', 'roki1313@gmail.com', '96cae35ce8a9b0244178bf28e4966c2ce1b8385723a96a6b838858cdd6ca0a1e', '+380123123224', 'user', '2025-12-22 16:32:53'),
(5, 'Admin', 'admin@gmail.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', NULL, 'admin', '2025-12-22 16:43:46');

-- --------------------------------------------------------

--
-- Структура таблиці `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `seats` varchar(500) NOT NULL COMMENT 'Місця через кому, напр. A1,A2,A3',
  `price_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paid` tinyint(1) NOT NULL DEFAULT 0,
  `paid_at` datetime DEFAULT NULL,
  `canceled` tinyint(1) NOT NULL DEFAULT 0,
  `canceled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Індекси збережених таблиць
--

--
-- Індекси таблиці `movies`
--
ALTER TABLE `movies`
  ADD PRIMARY KEY (`id`);

--
-- Індекси таблиці `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `movie_id` (`movie_id`);

--
-- Індекси таблиці `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Індекси таблиці `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `session_id` (`session_id`);

--
-- AUTO_INCREMENT для збережених таблиць
--

--
-- AUTO_INCREMENT для таблиці `movies`
--
ALTER TABLE `movies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT для таблиці `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT для таблиці `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT для таблиці `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Обмеження зовнішнього ключа збережених таблиць
--

--
-- Обмеження зовнішнього ключа таблиці `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE;

--
-- Обмеження зовнішнього ключа таблиці `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
