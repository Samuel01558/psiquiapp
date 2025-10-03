const request = require('supertest');
const createTestServer = require('../../test-server');

const app = createTestServer();

describe('🔐 Auth API Tests', () => {
  test('POST /api/login sin datos => 400', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/login con credenciales incorrectas => 401', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'test@test.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/login con credenciales correctas => 200', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'admin@psiquiapp.local',
        password: 'admin123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('GET /api/auth/check sin autenticación => 401', async () => {
    const res = await request(app).get('/api/auth/check');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  describe('Con autenticación válida', () => {
    let authCookie;

    beforeEach(async () => {
      // Hacer login para obtener cookie de sesión
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@psiquiapp.local',
          password: 'admin123'
        });
      
      authCookie = loginRes.headers['set-cookie'];
    });

    test('GET /api/auth/check con sesión válida => 200', async () => {
      const res = await request(app)
        .get('/api/auth/check')
        .set('Cookie', authCookie);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
    });

    test('POST /api/logout con sesión válida => 200', async () => {
      const res = await request(app)
        .post('/api/logout')
        .set('Cookie', authCookie);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});