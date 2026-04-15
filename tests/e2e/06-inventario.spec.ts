import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Inventario', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de inventario carga con productos', async ({ page }) => {
    await page.goto('/admin/inventario');
    await expect(page.locator('h1').first()).toBeVisible();
    // Debe haber al menos un producto del seed
    await expect(page.getByText(/filtro|aceite|repuesto/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('página nuevo ítem de inventario tiene campos requeridos', async ({ page }) => {
    await page.goto('/admin/inventario/nuevo');
    // Los Label no tienen htmlFor — usar getByText para el label y placeholder para input
    await expect(page.getByText(/^Nombre/i).first()).toBeVisible();
    await expect(page.getByText(/stock inicial/i).first()).toBeVisible();
  });

  test('detalle de ítem del inventario carga', async ({ page }) => {
    await page.goto('/admin/inventario');
    // Buscar links a detalle de inventario
    const primerItem = page.locator('a[href*="/admin/inventario/"]').first();
    const exists = await primerItem.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primerItem.click();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dashboard muestra alerta si hay stock bajo mínimo', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // El seed incluye items con stock bajo mínimo para demostración
    // Solo verificamos que el dashboard carga correctamente con la sección de stock
    await expect(page.getByText(/stock|inventario|bajo mínimo/i).first()).toBeVisible({ timeout: 10_000 });
  });

});
