const request = require('supertest');
const createTestServer = require('../../test-server');

const app = createTestServer();

describe('👥 Pacientes API Tests', () => {
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

  test('GET /api/pacientes con autenticación => 200', async () => {
    const res = await request(app)
      .get('/api/pacientes')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('POST /api/pacientes crear paciente válido => 201', async () => {
    const nuevoPaciente = {
      nombre: 'Test',
      apellido: 'Patient',
      cedula: '99999999',
      telefono: '555-9999',
      email: 'test@test.com'
    };

    const res = await request(app)
      .post('/api/pacientes')
      .set('Cookie', authCookie)
      .send(nuevoPaciente);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('paciente');
  });

  test('POST /api/pacientes con datos incompletos => 400', async () => {
    const pacienteIncompleto = {
      nombre: 'Test'
      // Faltan apellido y cedula
    };

    const res = await request(app)
      .post('/api/pacientes')
      .set('Cookie', authCookie)
      .send(pacienteIncompleto);
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/pacientes/:id paciente existente => 200', async () => {
    const res = await request(app)
      .get('/api/pacientes/1')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('nombre');
  });

  test('GET /api/pacientes/:id paciente inexistente => 404', async () => {
    const res = await request(app)
      .get('/api/pacientes/999')
      .set('Cookie', authCookie);
    
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
  });
});