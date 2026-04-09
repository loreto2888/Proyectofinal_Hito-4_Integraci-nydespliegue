import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, password, avatarUrl } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y password son requeridos' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, email, avatar_url`,
      [name, email, hash, avatarUrl ?? null]
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
