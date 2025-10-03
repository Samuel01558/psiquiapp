// Jest setup file
require('dotenv').config({ path: '.env' });

// Configurar timeout global para tests de API
jest.setTimeout(10000);

// Configuración global para tests
global.testConfig = {
  adminCredentials: {
    email: 'admin@psiquiapp.local',
    password: 'admin123'
  },
  testDatabase: process.env.DB_NAME || 'psiquiapp_db',
  serverPort: process.env.PORT || 3000
};

// Mock console.log en tests para reducir ruido
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Mantener errores visibles
  };
}