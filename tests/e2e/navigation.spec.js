import { test, expect } from '@playwright/test';

test.describe('🧭 PsiquiApp E2E Tests - Navegación', () => {
  // Hacer login antes de cada test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('input[type="email"]', 'admin@psiquiapp.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html');
  });

  test('Navegación del menú lateral funciona correctamente', async ({ page }) => {
    // Verificar que estamos en el dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Navegar a Pacientes
    await page.click('a[href="pacientes.html"]');
    await page.waitForURL('**/pacientes.html');
    await expect(page.locator('h1')).toContainText('Pacientes');
    
    // Navegar a Consultas
    await page.click('a[href="consultas.html"]');
    await page.waitForURL('**/consultas.html');
    await expect(page.locator('h1')).toContainText('Consultas');
    
    // Navegar a Recetas
    await page.click('a[href="recetas.html"]');
    await page.waitForURL('**/recetas.html');
    await expect(page.locator('h1')).toContainText('Recetas');
    
    // Navegar a DSM-5
    await page.click('a[href="dsm5.html"]');
    await page.waitForURL('**/dsm5.html');
    await expect(page.locator('h1')).toContainText('DSM-5');
    
    // Navegar a CIE-10
    await page.click('a[href="cie10.html"]');
    await page.waitForURL('**/cie10.html');
    await expect(page.locator('h1')).toContainText('CIE-10');
    
    // Navegar a Tests
    await page.click('a[href="tests.html"]');
    await page.waitForURL('**/tests.html');
    await expect(page.locator('h1')).toContainText('Test');
    
    // Regresar al Dashboard
    await page.click('a[href="dashboard.html"]');
    await page.waitForURL('**/dashboard.html');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Menú superior (navbar) es visible y funcional', async ({ page }) => {
    // Verificar que el navbar está presente
    await expect(page.locator('nav.navbar')).toBeVisible();
    await expect(page.locator('.navbar-brand')).toContainText('PsiquiApp');
    
    // Verificar menú de usuario
    await expect(page.locator('.dropdown-toggle')).toBeVisible();
    
    // Hacer click en el menú de usuario
    await page.click('.dropdown-toggle');
    await expect(page.locator('.dropdown-menu')).toBeVisible();
    
    // Verificar opciones del menú
    await expect(page.locator('.dropdown-menu')).toContainText('Perfil');
    await expect(page.locator('.dropdown-menu')).toContainText('Configuración');
    await expect(page.locator('.dropdown-menu')).toContainText('Cerrar Sesión');
  });

  test('Diseño responsivo - menú lateral se adapta', async ({ page }) => {
    // Cambiar a vista móvil
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // En dispositivos pequeños, el sidebar debería estar oculto inicialmente
    // y debería haber un botón toggle
    await expect(page.locator('#sidebarToggle, .navbar-toggler')).toBeVisible();
    
    // Cambiar de vuelta a desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // El sidebar debería ser visible en desktop
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('Logo y branding son consistentes en todas las páginas', async ({ page }) => {
    const pages = ['dashboard.html', 'pacientes.html', 'consultas.html', 'recetas.html'];
    
    for (const pageName of pages) {
      await page.goto(`/${pageName}`);
      
      // Verificar que el logo/brand está presente
      await expect(page.locator('.navbar-brand')).toContainText('PsiquiApp');
      await expect(page.locator('.navbar-brand i.fa-brain')).toBeVisible();
      
      // Verificar que el sidebar header está presente
      await expect(page.locator('.sidebar-header')).toContainText('MENÚ PRINCIPAL');
    }
  });
});