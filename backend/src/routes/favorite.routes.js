import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT f.id, f.user_id AS "userId", f.post_id AS "postId",
              p.title, p.description, p.price, p.status, p.stock, p.category, p.location,
              p.image_url AS "mainImage",
              u.id AS "postUserId", u.name AS "postUserName", u.avatar_url AS "postUserAvatar"
       FROM favorites f
       JOIN posts p ON p.id = f.post_id
       JOIN users u ON u.id = p.user_id
       WHERE f.user_id = $1
       ORDER BY f.id DESC`,
      [req.user.id]
    );

    return res.json(
      result.rows.map((favorite) => ({
        id: favorite.id,
        userId: favorite.userId,
        postId: favorite.postId,
        title: favorite.title,
        description: favorite.description,
        price: favorite.price,
        status: favorite.status,
        stock: favorite.stock,
        category: favorite.category,
        location: favorite.location,
        mainImage: favorite.mainImage,
        user: {
          id: favorite.postUserId,
          name: favorite.postUserName,
          avatarUrl: favorite.postUserAvatar,
        },
      }))
    );
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
