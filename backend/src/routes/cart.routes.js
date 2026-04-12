import { Router } from 'express';
import pool, { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function serializeCart(rows) {
  const items = rows.map((row) => {
    const unitPrice = Number(row.price);
    const quantity = Number(row.quantity);

    return {
      postId: row.postId,
      quantity,
      title: row.title,
      price: unitPrice,
      stock: Number(row.stock),
      mainImage: row.mainImage,
      lineTotal: unitPrice * quantity,
    };
  });

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

async function getCartRows(userId) {
  const result = await query(
    `SELECT ci.post_id AS "postId", ci.quantity, p.title, p.price, p.stock,
            (SELECT url FROM post_images WHERE post_id = p.id ORDER BY "order" ASC LIMIT 1) AS "mainImage"
     FROM cart_items ci
     JOIN posts p ON p.id = ci.post_id
     WHERE ci.user_id = $1
     ORDER BY ci.updated_at DESC`,
    [userId]
  );

  return result.rows;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await getCartRows(req.user.id);
    return res.json(serializeCart(rows));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error obteniendo carrito' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const postId = Number(req.body.postId);
  const quantity = Number(req.body.quantity ?? 1);

  if (!Number.isInteger(postId) || postId < 1) {
    return res.status(400).json({ message: 'postId inválido' });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'La cantidad debe ser un entero mayor o igual a 1' });
  }

  try {
    const postResult = await query('SELECT id, stock FROM posts WHERE id = $1', [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const stock = Number(postResult.rows[0].stock);
    const existingResult = await query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND post_id = $2',
      [req.user.id, postId]
    );
    const currentQuantity = Number(existingResult.rows[0]?.quantity ?? 0);

    if (currentQuantity + quantity > stock) {
      return res.status(400).json({ message: 'La cantidad solicitada supera el stock disponible' });
    }

    await query(
      `INSERT INTO cart_items (user_id, post_id, quantity, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, post_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                     updated_at = NOW()`,
      [req.user.id, postId, quantity]
    );

    const rows = await getCartRows(req.user.id);
    return res.status(201).json(serializeCart(rows));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error agregando producto al carrito' });
  }
});

router.put('/:postId', requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(postId) || postId < 1) {
    return res.status(400).json({ message: 'postId inválido' });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'La cantidad debe ser un entero mayor o igual a 1' });
  }

  try {
    const postResult = await query('SELECT stock FROM posts WHERE id = $1', [postId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    if (quantity > Number(postResult.rows[0].stock)) {
      return res.status(400).json({ message: 'La cantidad solicitada supera el stock disponible' });
    }

    const result = await query(
      `UPDATE cart_items
       SET quantity = $1, updated_at = NOW()
       WHERE user_id = $2 AND post_id = $3`,
      [quantity, req.user.id, postId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    const rows = await getCartRows(req.user.id);
    return res.json(serializeCart(rows));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error actualizando carrito' });
  }
});

router.post('/checkout', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cartResult = await client.query(
      `SELECT ci.post_id AS "postId", ci.quantity, p.title, p.price, p.stock,
              (SELECT url FROM post_images WHERE post_id = p.id ORDER BY "order" ASC LIMIT 1) AS "mainImage"
       FROM cart_items ci
       JOIN posts p ON p.id = ci.post_id
       WHERE ci.user_id = $1
       ORDER BY ci.updated_at DESC
       FOR UPDATE`,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const insufficientItem = cartResult.rows.find((item) => Number(item.quantity) > Number(item.stock));

    if (insufficientItem) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Uno o más productos ya no tienen stock suficiente' });
    }

    for (const item of cartResult.rows) {
      await client.query('UPDATE posts SET stock = stock - $1, updated_at = NOW() WHERE id = $2', [
        item.quantity,
        item.postId,
      ]);
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);
    await client.query('COMMIT');

    return res.json({
      message: 'Compra simulada correctamente',
      ...serializeCart(cartResult.rows),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ message: 'Error simulando la compra' });
  } finally {
    client.release();
  }
});

router.delete('/:postId', requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);

  if (!Number.isInteger(postId) || postId < 1) {
    return res.status(400).json({ message: 'postId inválido' });
  }

  try {
    const result = await query('DELETE FROM cart_items WHERE user_id = $1 AND post_id = $2', [
      req.user.id,
      postId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
    }

    const rows = await getCartRows(req.user.id);
    return res.json(serializeCart(rows));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error eliminando producto del carrito' });
  }
});

export default router;
