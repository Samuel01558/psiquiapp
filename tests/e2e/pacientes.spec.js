import { test, expect } from '@playwright/test';

test.describe('👥 PsiquiApp E2E Tests - Gestión de Pacientes', () => {
  // Login antes de cada test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('input[type="email"]', 'admin@psiquiapp.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html');
  });

  test('Página de pacientes carga y muestra lista', async ({ page }) => {
    // Navegar a pacientes
    await page.click('a[href="pacientes.html"]');
    await page.waitForURL('**/pacientes.html');
    
    // Verificar que la página carga correctamente
    await expect(page.locator('h1')).toContainText('Pacientes');
    
    // Verificar que hay botones de acción
    await expect(page.locator('button')).toContainText(['Nuevo Paciente', 'Agregar', 'Añadir']);
    
    // Verificar que la tabla/lista de pacientes existe
    await expect(page.locator('table, .patient-list, .card')).toBeVisible();
  });

  test('Modal de nuevo paciente se abre correctamente', async ({ page }) => {
    await page.goto('/pacientes.html');
    
    // Buscar y hacer click en el botón de nuevo paciente
    const newPatientButton = page.locator('button:has-text("Nuevo"), button:has-text("Agregar"), button:has-text("Añadir")').first();
    await newPatientButton.click();
    
    // Verificar que el modal se abre
    await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
    
    // Verificar campos básicos del formulario
    await expect(page.locator('input[name="nombre"], #nombre, #patientName')).toBeVisible();
    await expect(page.locator('input[name="apellido"], #apellido, #patientLastName')).toBeVisible();
    await expect(page.locator('input[name="email"], #email, #patientEmail')).toBeVisible();
  });

  test('Dashboard muestra estadísticas de pacientes', async ({ page }) => {
    // Ya estamos en el dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verificar que las estadísticas de pacientes están presentes
    const statsCards = page.locator('.card, .stat-card, [data-stat]');
    await expect(statsCards).toContainText(['Pacientes', 'Activos']);
    
    // Verificar que los números son visibles (no están en blanco)
    const patientStat = page.locator('[data-stat="pacientes"], .patient-count, :has-text("Pacientes")').first();
    await expect(patientStat).toBeVisible();
  });

  test('Sección de pacientes recientes en dashboard', async ({ page }) => {
    // Verificar sección de pacientes recientes
    await expect(page.locator(':has-text("Pacientes Recientes"), :has-text("Últimos Pacientes")')).toBeVisible();
    
    // Si hay pacientes, debería mostrar al menos uno
    const patientsSection = page.locator('.recent-patients, [data-section="patients"]');
    if (await patientsSection.count() > 0) {
      await expect(patientsSection).toBeVisible();
    }
  });
});