import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { jest } from '@jest/globals';

const queryMock = jest.fn();
const clientQueryMock = jest.fn();
const releaseMock = jest.fn();
const connectMock = jest.fn();

await jest.unstable_mockModule('../src/db.js', () => ({
  default: {
    connect: connectMock,
  },
  query: queryMock,
}));

const { default: app } = await import('../src/app.js');

function dbResult(rows = [], overrides = {}) {
  return {
    rows,
    rowCount: rows.length,
    ...overrides,
  };
}

function authHeader(userId = 1) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'dev-secret');
  return { Authorization: `Bearer ${token}` };
}

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  jest.clearAllMocks();
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: releaseMock,
  });
});

afterAll(() => {
  console.error.mockRestore();
});

describe('API REST Hito 4', () => {
  test('GET / debe responder 200 y mensaje base', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/users sin campos requeridos debe responder 400', async () => {
    const res = await request(app).post('/api/users').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El nombre es obligatorio');
  });

  test('POST /api/users debe crear usuario válido', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          id: 7,
          name: 'Ana Perez',
          email: 'ana@test.com',
          avatar_url: 'https://img.test/avatar.jpg',
        },
      ])
    );

    const res = await request(app).post('/api/users').send({
      name: 'Ana Perez',
      email: 'ana@test.com',
      password: '123456',
      avatarUrl: 'https://img.test/avatar.jpg',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      id: 7,
      name: 'Ana Perez',
      email: 'ana@test.com',
      avatarUrl: 'https://img.test/avatar.jpg',
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  test('POST /api/users con email duplicado debe responder 409', async () => {
    queryMock.mockRejectedValueOnce({ code: '23505' });

    const res = await request(app).post('/api/users').send({
      name: 'Ana Perez',
      email: 'ana@test.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Email ya registrado');
  });

  test('POST /api/auth/login sin email o password debe responder 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('La contraseña es obligatoria');
  });

  test('POST /api/auth/login debe responder token y usuario', async () => {
    const passwordHash = await bcrypt.hash('123456', 10);
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          id: 3,
          name: 'Mario',
          email: 'mario@test.com',
          password_hash: passwordHash,
          avatar_url: null,
        },
      ])
    );

    const res = await request(app).post('/api/auth/login').send({
      email: 'mario@test.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({
      id: 3,
      name: 'Mario',
      email: 'mario@test.com',
      avatarUrl: null,
    });
  });

  test('GET /api/auth/me sin token debe responder 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me con token válido debe responder usuario actual', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          id: 1,
          name: 'Usuario Demo',
          email: 'demo@test.com',
          avatar_url: 'https://img.test/demo.jpg',
        },
      ])
    );

    const res = await request(app).get('/api/auth/me').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 1,
      name: 'Usuario Demo',
      email: 'demo@test.com',
      avatarUrl: 'https://img.test/demo.jpg',
    });
  });

  test('GET /api/posts debe listar publicaciones mapeadas', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          id: 11,
          title: 'Notebook',
          description: 'Buen estado',
          price: 450000,
          stock: 2,
          category: 'tecnologia',
          location: 'envio',
          user_id: 9,
          user_name: 'Luisa',
          main_image: 'https://img.test/notebook.jpg',
        },
      ])
    );

    const res = await request(app).get('/api/posts');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        id: 11,
        title: 'Notebook',
        description: 'Buen estado',
        price: 450000,
        stock: 2,
        category: 'tecnologia',
        location: 'envio',
        mainImage: 'https://img.test/notebook.jpg',
        user: {
          id: 9,
          name: 'Luisa',
        },
      },
    ]);
  });

  test('GET /api/posts/:id debe devolver detalle con isFavorite cuando hay token', async () => {
    queryMock
      .mockResolvedValueOnce(
        dbResult([
          {
            id: 5,
            title: 'Bicicleta',
            description: 'Mountain bike casi nueva',
            price: 100000,
            status: 'published',
            category: 'deportes',
            location: 'presencial',
            stock: 1,
            user_id: 2,
            user_name: 'Pablo',
            user_avatar: null,
          },
        ])
      )
      .mockResolvedValueOnce(
        dbResult([
          { id: 1, url: 'https://img.test/bici-1.jpg' },
          { id: 2, url: 'https://img.test/bici-2.jpg' },
        ])
      )
      .mockResolvedValueOnce(dbResult([{ '?column?': 1 }]));

    const res = await request(app).get('/api/posts/5').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      id: 5,
      title: 'Bicicleta',
      description: 'Mountain bike casi nueva',
      price: 100000,
      stock: 1,
      status: 'published',
      category: 'deportes',
      location: 'presencial',
      user: {
        id: 2,
        name: 'Pablo',
        avatarUrl: null,
      },
      images: [
        { id: 1, url: 'https://img.test/bici-1.jpg' },
        { id: 2, url: 'https://img.test/bici-2.jpg' },
      ],
      isFavorite: true,
    });
  });

  test('GET /api/posts/:id sin token debe devolver isFavorite en false', async () => {
    queryMock
      .mockResolvedValueOnce(
        dbResult([
          {
            id: 8,
            title: 'Silla',
            description: 'Silla ergonómica usada',
            price: 30000,
            status: 'draft',
            category: 'hogar',
            location: 'online',
            stock: 3,
            user_id: 4,
            user_name: 'Carla',
            user_avatar: 'https://img.test/carla.jpg',
          },
        ])
      )
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app).get('/api/posts/8');

    expect(res.statusCode).toBe(200);
    expect(res.body.isFavorite).toBe(false);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  test('POST /api/posts sin token debe responder 401 (ruta protegida)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test', description: 'Desc', price: 10, status: 'nuevo', category: 'Test', location: 'Santiago' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/posts debe validar imágenes inválidas', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(authHeader(1))
      .send({
        title: 'Monitor 24',
        description: 'Monitor impecable con base ajustable',
        price: 150000,
        stock: 2,
        status: 'published',
        category: 'tecnologia',
        location: 'envio',
        images: ['url-invalida'],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Cada imagen debe ser una URL válida');
    expect(queryMock).not.toHaveBeenCalled();
  });

  test('POST /api/posts debe crear publicación con imagen principal', async () => {
    queryMock
      .mockResolvedValueOnce(
        dbResult([
          {
            id: 15,
            title: 'Monitor 24',
            description: 'Monitor impecable con base ajustable',
            price: 150000,
            stock: 2,
            status: 'published',
            category: 'tecnologia',
            location: 'envio',
          },
        ])
      )
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader(1))
      .send({
        title: 'Monitor 24',
        description: 'Monitor impecable con base ajustable',
        price: 150000,
        stock: 2,
        status: 'published',
        category: 'tecnologia',
        location: 'envio',
        images: ['https://img.test/monitor.jpg'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      id: 15,
      title: 'Monitor 24',
      description: 'Monitor impecable con base ajustable',
      price: 150000,
      stock: 2,
      status: 'published',
      category: 'tecnologia',
      location: 'envio',
      mainImage: 'https://img.test/monitor.jpg',
      user: {
        id: 1,
      },
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  test('PUT /api/posts/:id sin token debe responder 401', async () => {
    const res = await request(app).put('/api/posts/5').send({ title: 'Nuevo título' });

    expect(res.statusCode).toBe(401);
  });

  test('PUT /api/posts/:id debe actualizar publicación', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          id: 5,
          title: 'Título actualizado',
          description: 'Descripción actualizada y completa',
          price: 9990,
          stock: 4,
          status: 'sold',
          category: 'otros',
          location: 'online',
        },
      ])
    );
    queryMock.mockResolvedValueOnce(dbResult([], { rowCount: 1 }));
    queryMock.mockResolvedValueOnce(dbResult([], { rowCount: 1 }));
    queryMock.mockResolvedValueOnce(dbResult([{ url: 'https://img.test/post-actualizado.jpg' }]));

    const res = await request(app)
      .put('/api/posts/5')
      .set(authHeader(1))
      .send({
        title: 'Título actualizado',
        description: 'Descripción actualizada y completa',
        price: 9990,
        stock: 4,
        status: 'sold',
        category: 'otros',
        location: 'online',
        images: ['https://img.test/post-actualizado.jpg'],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Título actualizado');
    expect(res.body.status).toBe('sold');
    expect(res.body.mainImage).toBe('https://img.test/post-actualizado.jpg');
    expect(queryMock).toHaveBeenCalledTimes(4);
  });

  test('PUT /api/posts/:id debe permitir eliminar la imagen principal', async () => {
    queryMock
      .mockResolvedValueOnce(
        dbResult([
          {
            id: 5,
            title: 'Título actualizado',
            description: 'Descripción actualizada y completa',
            price: 9990,
            stock: 4,
            status: 'sold',
            category: 'otros',
            location: 'online',
          },
        ])
      )
      .mockResolvedValueOnce(dbResult([], { rowCount: 1 }))
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app)
      .put('/api/posts/5')
      .set(authHeader(1))
      .send({
        title: 'Título actualizado',
        images: [],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.mainImage).toBeNull();
  });

  test('DELETE /api/posts/:id sin token debe responder 401', async () => {
    const res = await request(app).delete('/api/posts/5');

    expect(res.statusCode).toBe(401);
  });

  test('DELETE /api/posts/:id debe eliminar publicación', async () => {
    queryMock.mockResolvedValueOnce(dbResult([], { rowCount: 1 }));

    const res = await request(app).delete('/api/posts/5').set(authHeader(1));

    expect(res.statusCode).toBe(204);
  });

  test('GET /api/favorites sin token debe responder 401', async () => {
    const res = await request(app).get('/api/favorites');

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/favorites debe listar favoritos del usuario', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        { id: 1, userId: 1, postId: 5 },
        { id: 2, userId: 1, postId: 9 },
      ])
    );

    const res = await request(app).get('/api/favorites').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { id: 1, userId: 1, postId: 5 },
      { id: 2, userId: 1, postId: 9 },
    ]);
  });

  test('POST /api/favorites sin token debe responder 401', async () => {
    const res = await request(app).post('/api/favorites').send({ postId: 5 });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/favorites debe validar postId requerido', async () => {
    const res = await request(app).post('/api/favorites').set(authHeader(1)).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('postId es requerido');
  });

  test('POST /api/favorites debe responder 200 cuando ya era favorito', async () => {
    queryMock.mockResolvedValueOnce(dbResult([]));

    const res = await request(app).post('/api/favorites').set(authHeader(1)).send({ postId: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Ya era favorito');
  });

  test('DELETE /api/favorites/:postId sin token debe responder 401', async () => {
    const res = await request(app).delete('/api/favorites/5');

    expect(res.statusCode).toBe(401);
  });

  test('DELETE /api/favorites/:postId debe eliminar favorito', async () => {
    queryMock.mockResolvedValueOnce(dbResult([], { rowCount: 1 }));

    const res = await request(app).delete('/api/favorites/5').set(authHeader(1));

    expect(res.statusCode).toBe(204);
  });

  test('GET /api/cart sin token debe responder 401', async () => {
    const res = await request(app).get('/api/cart');

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/cart debe devolver carrito serializado', async () => {
    queryMock.mockResolvedValueOnce(
      dbResult([
        {
          postId: 5,
          quantity: 2,
          title: 'Mouse gamer',
          price: 20000,
          stock: 5,
          mainImage: 'https://img.test/mouse.jpg',
        },
      ])
    );

    const res = await request(app).get('/api/cart').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      items: [
        {
          postId: 5,
          quantity: 2,
          title: 'Mouse gamer',
          price: 20000,
          stock: 5,
          mainImage: 'https://img.test/mouse.jpg',
          lineTotal: 40000,
        },
      ],
      totalItems: 2,
      totalAmount: 40000,
    });
  });

  test('POST /api/cart sin token debe responder 401', async () => {
    const res = await request(app).post('/api/cart').send({ postId: 1, quantity: 1 });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/cart debe validar cantidad inválida', async () => {
    const res = await request(app).post('/api/cart').set(authHeader(1)).send({ postId: 1, quantity: 0 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('La cantidad debe ser un entero mayor o igual a 1');
  });

  test('POST /api/cart debe rechazar cantidad sobre stock disponible', async () => {
    queryMock
      .mockResolvedValueOnce(dbResult([{ id: 1, stock: 3 }]))
      .mockResolvedValueOnce(dbResult([{ quantity: 2 }]));

    const res = await request(app).post('/api/cart').set(authHeader(1)).send({ postId: 1, quantity: 2 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('La cantidad solicitada supera el stock disponible');
  });

  test('POST /api/cart debe agregar producto y devolver carrito actualizado', async () => {
    queryMock
      .mockResolvedValueOnce(dbResult([{ id: 1, stock: 5 }]))
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(
        dbResult([
          {
            postId: 1,
            quantity: 1,
            title: 'Teclado mecánico',
            price: 50000,
            stock: 5,
            mainImage: 'https://img.test/teclado.jpg',
          },
        ])
      );

    const res = await request(app).post('/api/cart').set(authHeader(1)).send({ postId: 1, quantity: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.totalItems).toBe(1);
    expect(res.body.totalAmount).toBe(50000);
  });

  test('PUT /api/cart/:postId sin token debe responder 401', async () => {
    const res = await request(app).put('/api/cart/1').send({ quantity: 2 });

    expect(res.statusCode).toBe(401);
  });

  test('PUT /api/cart/:postId debe responder 404 si el item no existe en el carrito', async () => {
    queryMock
      .mockResolvedValueOnce(dbResult([{ stock: 4 }]))
      .mockResolvedValueOnce(dbResult([], { rowCount: 0 }));

    const res = await request(app).put('/api/cart/1').set(authHeader(1)).send({ quantity: 2 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Producto no encontrado en el carrito');
  });

  test('DELETE /api/cart/:postId sin token debe responder 401', async () => {
    const res = await request(app).delete('/api/cart/1');

    expect(res.statusCode).toBe(401);
  });

  test('DELETE /api/cart/:postId debe eliminar item y devolver carrito actualizado', async () => {
    queryMock
      .mockResolvedValueOnce(dbResult([], { rowCount: 1 }))
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app).delete('/api/cart/1').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });
  });

  test('POST /api/cart/checkout sin token debe responder 401', async () => {
    const res = await request(app).post('/api/cart/checkout');

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/cart/checkout debe responder 400 si el carrito está vacío', async () => {
    clientQueryMock
      .mockResolvedValueOnce(dbResult([], { rowCount: null }))
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app).post('/api/cart/checkout').set(authHeader(1));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El carrito está vacío');
    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(clientQueryMock).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT ci.post_id AS "postId"'), [1]);
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(releaseMock).toHaveBeenCalled();
  });

  test('POST /api/cart/checkout debe responder 400 si falta stock durante la compra', async () => {
    clientQueryMock
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(
        dbResult([
          {
            postId: 3,
            quantity: 2,
            title: 'Cámara',
            price: 250000,
            stock: 1,
            mainImage: 'https://img.test/camara.jpg',
          },
        ])
      )
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app).post('/api/cart/checkout').set(authHeader(1));

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Uno o más productos ya no tienen stock suficiente');
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK');
  });

  test('POST /api/cart/checkout debe simular compra, descontar stock y vaciar carrito', async () => {
    clientQueryMock
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(
        dbResult([
          {
            postId: 10,
            quantity: 2,
            title: 'Audífonos',
            price: 30000,
            stock: 4,
            mainImage: 'https://img.test/audifonos.jpg',
          },
        ])
      )
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(dbResult([]))
      .mockResolvedValueOnce(dbResult([]));

    const res = await request(app).post('/api/cart/checkout').set(authHeader(1));

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      message: 'Compra simulada correctamente',
      items: [
        {
          postId: 10,
          quantity: 2,
          title: 'Audífonos',
          price: 30000,
          stock: 4,
          mainImage: 'https://img.test/audifonos.jpg',
          lineTotal: 60000,
        },
      ],
      totalItems: 2,
      totalAmount: 60000,
    });
    expect(clientQueryMock).toHaveBeenCalledWith(
      'UPDATE posts SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
      [2, 10]
    );
    expect(clientQueryMock).toHaveBeenLastCalledWith('COMMIT');
    expect(releaseMock).toHaveBeenCalled();
  });
});
