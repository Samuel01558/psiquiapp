const request = require('supertest');
const createTestServer = require('../../test-server');

const app = createTestServer();

describe('📊 Dashboard API Tests', () => {
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

  test('GET /api/stats con autenticación => 200', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pacientes_activos');
    expect(res.body).toHaveProperty('citas_hoy');
    expect(res.body).toHaveProperty('consultas_mes');
    expect(res.body).toHaveProperty('pacientes_nuevos');
  });

  test('GET /api/recent-patients con autenticación => 200', async () => {
    const res = await request(app)
      .get('/api/recent-patients')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/upcoming-appointments con autenticación => 200', async () => {
    const res = await request(app)
      .get('/api/upcoming-appointments')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/health endpoint disponible => 200', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
  });
});