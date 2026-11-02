import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as moviesController from '../controllers/moviesController';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../..', 'frontend', 'assets', 'images'));
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', moviesController.getMovies);

router.post('/', upload.single('poster'), moviesController.addMovie);

router.get('/seed', moviesController.seedMovies);

export default router;
