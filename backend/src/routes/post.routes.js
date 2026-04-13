import { Router } from 'express';
import { query } from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();
const ALLOWED_STATUS = new Set(['published', 'draft', 'sold']);
const ALLOWED_CATEGORY = new Set(['general', 'tecnologia', 'hogar', 'ropa', 'deportes', 'otros']);
const ALLOWED_LOCATION = new Set(['online', 'presencial', 'envio']);

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function serializePostSummary(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    stock: p.stock,
    status: p.status,
    category: p.category,
    location: p.location,
    mainImage: p.main_image,
    user: {
      id: p.user_id,
      name: p.user_name,
    },
  };
}

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.description, p.price, p.stock, p.status, p.category, p.location,
              p.image_url AS main_image,
               u.id AS user_id, u.name AS user_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC`
    );

    const posts = result.rows.map(serializePostSummary);

    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo publicaciones' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.title, p.description, p.price, p.stock, p.status, p.category, p.location,
              p.image_url AS main_image,
              u.id AS user_id, u.name AS user_name
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(serializePostSummary));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo mis publicaciones' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const postResult = await query(
      `SELECT p.id, p.title, p.description, p.price, p.status, p.category, p.location,
              p.stock, p.image_url,
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
    const isOwner = String(req.user?.id) === String(post.user_id);

    if (post.status !== 'published' && !isOwner) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

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
      stock: post.stock,
      status: post.status,
      category: post.category,
      location: post.location,
      user: {
        id: post.user_id,
        name: post.user_name,
        avatarUrl: post.user_avatar,
      },
      mainImage: post.image_url,
      isFavorite,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo publicación' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const title = normalizeText(req.body?.title);
  const description = normalizeText(req.body?.description);
  const { price, stock } = req.body;
  const status = normalizeText(req.body?.status);
  const category = normalizeText(req.body?.category);
  const location = normalizeText(req.body?.location);
  const imageUrl = normalizeText(req.body?.imageUrl);

  if (!title) {
    return res.status(400).json({ message: 'El artículo es obligatorio' });
  }

  if (title.length < 3) {
    return res.status(400).json({ message: 'El artículo debe tener al menos 3 caracteres' });
  }

  if (!description) {
    return res.status(400).json({ message: 'La descripción es obligatoria' });
  }

  if (description.length < 10) {
    return res.status(400).json({ message: 'La descripción debe tener al menos 10 caracteres' });
  }

  if (price == null || price === '') {
    return res.status(400).json({ message: 'El precio es obligatorio' });
  }

  if (stock == null || stock === '') {
    return res.status(400).json({ message: 'El stock es obligatorio' });
  }

  if (!status) {
    return res.status(400).json({ message: 'El estado es obligatorio' });
  }

  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ message: 'Selecciona un estado válido' });
  }

  if (!category) {
    return res.status(400).json({ message: 'La categoría es obligatoria' });
  }

  if (!ALLOWED_CATEGORY.has(category)) {
    return res.status(400).json({ message: 'Selecciona una categoría válida' });
  }

  if (!location) {
    return res.status(400).json({ message: 'La modalidad es obligatoria' });
  }

  if (!ALLOWED_LOCATION.has(location)) {
    return res.status(400).json({ message: 'Selecciona una modalidad válida' });
  }

  const numericPrice = Number(price);
  const numericStock = Number(stock);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ message: 'El precio debe ser un número válido mayor o igual a 0' });
  }

  if (!Number.isInteger(numericStock) || numericStock < 1) {
    return res.status(400).json({ message: 'El stock debe ser un entero mayor o igual a 1' });
  }

  if (imageUrl && !isValidUrl(imageUrl)) {
    return res.status(400).json({ message: 'La imagen debe ser una URL válida' });
  }

  try {
    const postResult = await query(
      `INSERT INTO posts (user_id, title, description, price, stock, image_url, status, category, location, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, title, description, price, stock, image_url, status, category, location`,
      [req.user.id, title, description, numericPrice, numericStock, imageUrl || null, status, category, location]
    );

    const post = postResult.rows[0];
    const { image_url: createdImageUrl, ...createdPost } = post;

    return res.status(201).json({
      ...createdPost,
      mainImage: createdImageUrl,
      user: {
        id: req.user.id,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creando publicación' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const hasImageUrl = Object.prototype.hasOwnProperty.call(req.body ?? {}, 'imageUrl');
  const title = req.body?.title != null ? normalizeText(req.body.title) : null;
  const description = req.body?.description != null ? normalizeText(req.body.description) : null;
  const { price, stock } = req.body;
  const status = req.body?.status != null ? normalizeText(req.body.status) : null;
  const category = req.body?.category != null ? normalizeText(req.body.category) : null;
  const location = req.body?.location != null ? normalizeText(req.body.location) : null;
  const imageUrl = hasImageUrl ? normalizeText(req.body?.imageUrl) : null;

  if (title !== null) {
    if (!title) {
      return res.status(400).json({ message: 'El artículo es obligatorio' });
    }

    if (title.length < 3) {
      return res.status(400).json({ message: 'El artículo debe tener al menos 3 caracteres' });
    }
  }

  if (description !== null) {
    if (!description) {
      return res.status(400).json({ message: 'La descripción es obligatoria' });
    }

    if (description.length < 10) {
      return res.status(400).json({ message: 'La descripción debe tener al menos 10 caracteres' });
    }
  }

  if (price != null) {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'El precio debe ser un número válido mayor o igual a 0' });
    }
  }

  if (stock != null) {
    const numericStock = Number(stock);
    if (!Number.isInteger(numericStock) || numericStock < 1) {
      return res.status(400).json({ message: 'El stock debe ser un entero mayor o igual a 1' });
    }
  }

  if (status !== null && !ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ message: 'Selecciona un estado válido' });
  }

  if (category !== null && !ALLOWED_CATEGORY.has(category)) {
    return res.status(400).json({ message: 'Selecciona una categoría válida' });
  }

  if (location !== null && !ALLOWED_LOCATION.has(location)) {
    return res.status(400).json({ message: 'Selecciona una modalidad válida' });
  }

  if (hasImageUrl && imageUrl && !isValidUrl(imageUrl)) {
    return res.status(400).json({ message: 'La imagen debe ser una URL válida' });
  }

  const numericPrice = price != null ? Number(price) : null;
  const numericStock = stock != null ? Number(stock) : null;

  try {
    const result = await query(
      `UPDATE posts
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
            status = COALESCE($5, status),
            category = COALESCE($6, category),
            location = COALESCE($7, location),
            image_url = CASE WHEN $8 THEN $9 ELSE image_url END,
            updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING id, title, description, price, stock, image_url, status, category, location`,
      [title, description, numericPrice, numericStock, status, category, location, hasImageUrl, imageUrl || null, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada o no autorizada' });
    }

    const updatedPost = result.rows[0];
    const { image_url: updatedImageUrl, ...serializedPost } = updatedPost;

    return res.json({
      ...serializedPost,
      mainImage: updatedImageUrl,
    });
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
