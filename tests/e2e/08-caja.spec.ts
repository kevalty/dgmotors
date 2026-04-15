import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Caja', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('página de caja carga correctamente', async ({ page }) => {
    await page.goto('/admin/caja');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('muestra estado de caja (abierta o cerrada)', async ({ page }) => {
    await page.goto('/admin/caja');
    // Debe mostrar si la caja está abierta o cerrada
    await expect(page.getByText(/abierta|cerrada|abrir caja|caja del día/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('página abrir caja tiene campo de monto de apertura', async ({ page }) => {
    await page.goto('/admin/caja/abrir');
    // El label dice "Monto de apertura (efectivo en caja)"
    await expect(page.getByText(/monto de apertura|efectivo en caja/i).first()).toBeVisible();
  });

  test('página caja muestra botón abrir o sesión activa', async ({ page }) => {
    await page.goto('/admin/caja');
    // Puede mostrar "Sesión abierta" o "No hay sesión activa" + botón "Abrir caja"
    await expect(
      page.getByText(/sesión abierta|no hay sesión activa/i).first()
        .or(page.getByRole('link', { name: /abrir caja/i }))
    ).toBeVisible({ timeout: 8_000 });
  });

});
