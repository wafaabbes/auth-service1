const request = require('supertest');
const { app, getPool, closePool, initDB } = require('../server'); // Ajuster le chemin si nécessaire

describe('🔐 Auth API', () => {
  let testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test@1234',
    firstName: 'Jane',
    lastName: 'Doe'
  };

  let token;

  beforeAll(async () => {
    await initDB();
  });

  afterAll(async () => {
    const pool = getPool();
    if (pool) {
      await pool.query('DELETE FROM users WHERE email = ?', [testUser.email]);
    }
    await closePool();
  });

  it('✅ Should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    token = res.body.token;
  });

  it('🚫 Should not register the same user twice', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error', 'Email already exists');
  });

  it('✅ Should login successfully', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('🚫 Should not login with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testUser.email, password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error', 'Invalid credentials');
  });

  it('✅ Should access protected /me route with token', async () => {
    const res = await request(app)
      .get('/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('🚫 Should not access /me route without token', async () => {
    const res = await request(app).get('/me');
    expect(res.statusCode).toBe(401);
  });

  it('🚫 Should not access /me with invalid token', async () => {
    const res = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer fake_token');

    expect(res.statusCode).toBe(403);
  });
});
