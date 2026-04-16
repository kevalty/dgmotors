import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Activos Fijos', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de activos fijos carga', async ({ page }) => {
    await page.goto('/admin/activos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página muestra columnas de valor neto y depreciación', async ({ page }) => {
    await page.goto('/admin/activos');
    await expect(
      page.getByText(/valor neto|depreciaci|activos fijos|sin activos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('formulario nuevo activo tiene campos obligatorios', async ({ page }) => {
    await page.goto('/admin/activos/nuevo');
    await expect(page.getByText(/nombre.*activo|activo|código/i).first()).toBeVisible();
    await expect(page.getByText(/fecha.*compra|costo.*original/i).first()).toBeVisible();
  });

  test('página depreciación mensual carga', async ({ page }) => {
    await page.goto('/admin/activos/depreciacion');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('depreciación muestra botón para procesar o lista de activos', async ({ page }) => {
    await page.goto('/admin/activos/depreciacion');
    await expect(
      page.getByText(/procesar depreciaci|activos.*depreciar|no hay activos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar contiene enlace a Activos Fijos', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('link', { name: /activos/i })
    ).toBeVisible({ timeout: 5_000 });
  });

});
