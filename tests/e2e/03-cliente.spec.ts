import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Portal Cliente', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'cliente');
  });

  test('dashboard muestra vehículos del cliente', async ({ page }) => {
    await page.goto('/cliente/dashboard');
    // Juan Vargas tiene vehículos en el seed
    await expect(page.getByText(/ford|vehículo/i).first()).toBeVisible();
  });

  test('lista de vehículos carga', async ({ page }) => {
    await page.goto('/cliente/vehiculos');
    await expect(page).not.toHaveURL(/error/);
    // La página carga: muestra h1 o cards de vehículos
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('historial de mantenimiento carga', async ({ page }) => {
    await page.goto('/cliente/mantenimiento');
    // La página debe cargar sin error 500
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('lista de citas carga', async ({ page }) => {
    await page.goto('/cliente/citas');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('página de perfil carga y muestra datos', async ({ page }) => {
    await page.goto('/cliente/perfil');
    // Debe mostrar el nombre del cliente
    await expect(page.getByText(/juan|vargas/i).first()).toBeVisible();
  });

  test('mis facturas carga', async ({ page }) => {
    await page.goto('/cliente/mis-facturas');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

});
