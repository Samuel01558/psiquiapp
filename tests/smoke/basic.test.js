const request = require('supertest');
const path = require('path');
const createTestServer = require('../../test-server');

// Usar servidor de test en lugar del servidor principal
const app = createTestServer();

describe('🚀 Smoke Tests - Verificaciones Básicas', () => {
  test('Servidor responde correctamente en ruta raíz', async () => {
    const res = await request(app).get('/');
    expect([200, 302, 301]).toContain(res.statusCode);
  });

  test('Página de login carga correctamente', async () => {
    const res = await request(app).get('/login.html');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('PsiquiApp');
    expect(res.text).toContain('Iniciar Sesión');
  });

  test('Página de dashboard existe', async () => {
    const res = await request(app).get('/dashboard.html');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Dashboard');
  });

  test('CSS principal carga sin errores', async () => {
    const res = await request(app).get('/css/bootstrap-custom-psiqui.css');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/css');
  });

  test('JavaScript principal existe', async () => {
    const res = await request(app).get('/js/dashboard.js');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('javascript');
  });

  test('API responde a rutas protegidas con 401', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.statusCode).toBe(401);
  });

  test('Ruta API de auth existe', async () => {
    const res = await request(app).post('/api/login');
    // La ruta existe (no es 404), puede devolver 400 (bad request) sin credenciales
    expect(res.statusCode).not.toBe(404);
  });
});