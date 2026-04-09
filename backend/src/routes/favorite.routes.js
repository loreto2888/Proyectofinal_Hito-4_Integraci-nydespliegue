import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, user_id AS "userId", post_id AS "postId" FROM favorites WHERE user_id = $1',
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo favoritos' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { postId } = req.body;

  if (!postId) {
    return res.status(400).json({ message: 'postId es requerido' });
  }

  try {
    const result = await query(
      `INSERT INTO favorites (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id, user_id AS "userId", post_id AS "postId"`,
      [req.user.id, postId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'Ya era favorito' });
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error agregando favorito' });
  }
});

router.delete('/:postId', requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);

  try {
    const result = await query('DELETE FROM favorites WHERE user_id = $1 AND post_id = $2', [
      req.user.id,
      postId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Favorito no encontrado' });
    }

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error eliminando favorito' });
  }
});

export default router;
