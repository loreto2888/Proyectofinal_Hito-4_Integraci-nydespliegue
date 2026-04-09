import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, price, category, location,
              (SELECT url FROM post_images WHERE post_id = posts.id ORDER BY "order" ASC LIMIT 1) AS main_image
       FROM posts
       ORDER BY created_at DESC`
    );

    const posts = result.rows.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      location: p.location,
      mainImage: p.main_image,
    }));

    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo publicaciones' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const postResult = await query(
      `SELECT p.id, p.title, p.description, p.price, p.status, p.category, p.location,
              u.id AS user_id, u.name AS user_name, u.avatar_url AS user_avatar
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const post = postResult.rows[0];

    const imagesResult = await query(
      'SELECT id, url FROM post_images WHERE post_id = $1 ORDER BY "order" ASC',
      [id]
    );

    let isFavorite = false;
    if (req.user?.id) {
      const favResult = await query(
        'SELECT 1 FROM favorites WHERE user_id = $1 AND post_id = $2',
        [req.user.id, id]
      );
      isFavorite = favResult.rows.length > 0;
    }

    return res.json({
      id: post.id,
      title: post.title,
      description: post.description,
      price: post.price,
      status: post.status,
      category: post.category,
      location: post.location,
      user: {
        id: post.user_id,
        name: post.user_name,
        avatarUrl: post.user_avatar,
      },
      images: imagesResult.rows,
      isFavorite,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo publicación' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, price, status, category, location, images } = req.body;

  if (!title || !description || !price || !status || !category || !location) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const postResult = await query(
      `INSERT INTO posts (user_id, title, description, price, status, category, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, title, description, price, status, category, location`,
      [req.user.id, title, description, price, status, category, location]
    );

    const post = postResult.rows[0];

    if (Array.isArray(images) && images.length > 0) {
      const values = images.map((_, index) => `($1, $${index + 2}, ${index + 1})`).join(',');
      await query(
        `INSERT INTO post_images (post_id, url, "order") VALUES ${values}`,
        [post.id, ...images]
      );
    }

    return res.status(201).json({
      ...post,
      mainImage: Array.isArray(images) && images.length > 0 ? images[0] : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creando publicación' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, price, status, category, location } = req.body;

  try {
    const result = await query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           status = COALESCE($4, status),
           category = COALESCE($5, category),
           location = COALESCE($6, location),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING id, title, description, price, status, category, location`,
      [title, description, price, status, category, location, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada o no autorizada' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error actualizando publicación' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada o no autorizada' });
    }

    return res.status(204).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error eliminando publicación' });
  }
});

export default router;
