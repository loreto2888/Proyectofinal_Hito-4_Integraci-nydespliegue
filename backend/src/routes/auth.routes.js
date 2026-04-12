import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email) {
    return res.status(400).json({ message: 'El email es obligatorio' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Ingresa un email válido' });
  }

  if (!password) {
    return res.status(400).json({ message: 'La contraseña es obligatoria' });
  }

  try {
    const result = await query(
      'SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error interno en login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo usuario actual' });
  }
});

export default router;
