import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const avatarUrl = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  if (name.length < 3) {
    return res.status(400).json({ message: 'El nombre debe tener al menos 3 caracteres' });
  }

  if (!email) {
    return res.status(400).json({ message: 'El email es obligatorio' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Ingresa un email válido' });
  }

  if (!password) {
    return res.status(400).json({ message: 'La contraseña es obligatoria' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (avatarUrl && !isValidUrl(avatarUrl)) {
    return res.status(400).json({ message: 'Ingresa una URL válida para el avatar' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, avatar_url`,
      [name, email, hash, avatarUrl || null]
    );

    const user = result.rows[0];

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
    });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email ya registrado' });
    }
    return res.status(500).json({ message: 'Error creando usuario' });
  }
});

export default router;
