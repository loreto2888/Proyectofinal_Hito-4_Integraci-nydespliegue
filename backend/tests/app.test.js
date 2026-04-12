import request from 'supertest';
import app from '../src/app.js';

describe('API REST Hito 4', () => {
  test('GET / debe responder 200 y mensaje base', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/users sin campos requeridos debe responder 400', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login sin email o password debe responder 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/auth/me sin token debe responder 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/posts sin token debe responder 401 (ruta protegida)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ title: 'Test', description: 'Desc', price: 10, status: 'nuevo', category: 'Test', location: 'Santiago' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/cart sin token debe responder 401', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/cart sin token debe responder 401', async () => {
    const res = await request(app).post('/api/cart').send({ postId: 1, quantity: 1 });
    expect(res.statusCode).toBe(401);
  });

  test('POST /api/cart/checkout sin token debe responder 401', async () => {
    const res = await request(app).post('/api/cart/checkout');
    expect(res.statusCode).toBe(401);
  });
});
