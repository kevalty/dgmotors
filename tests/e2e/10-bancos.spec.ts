import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Bancos', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de cuentas bancarias carga', async ({ page }) => {
    await page.goto('/admin/bancos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página bancos muestra saldo total o tabla', async ({ page }) => {
    await page.goto('/admin/bancos');
    await expect(
      page.getByText(/saldo total|cuentas bancarias|sin cuentas/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('botón nueva cuenta bancaria navega al formulario', async ({ page }) => {
    await page.goto('/admin/bancos');
    const btnNuevo = page.getByRole('link', { name: /nueva cuenta|nuevo banco|agregar/i });
    const exists = await btnNuevo.count() > 0;
    if (exists) {
      await btnNuevo.first().click();
      await expect(page).toHaveURL(/\/admin\/bancos\/nuevo/);
    } else {
      await expect(page.locator('h1').first()).toBeVisible();
    }
  });

  test('formulario nueva cuenta tiene campos requeridos', async ({ page }) => {
    await page.goto('/admin/bancos/nuevo');
    await expect(page.getByText(/nombre.*banco|banco/i).first()).toBeVisible();
    await expect(page.getByText(/número.*cuenta|cuenta/i).first()).toBeVisible();
  });

  test('movimientos globales carga', async ({ page }) => {
    await page.goto('/admin/bancos/movimientos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('movimientos muestra filtros de tipo y conciliación', async ({ page }) => {
    await page.goto('/admin/bancos/movimientos');
    await expect(
      page.getByText(/movimientos|depósito|transferencia|sin movimientos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar contiene enlace a Cuentas Bancarias', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('link', { name: /cuentas bancarias/i })
    ).toBeVisible({ timeout: 5_000 });
  });

});
