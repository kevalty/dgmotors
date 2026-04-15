import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Contabilidad', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('plan de cuentas carga (requiere migration 017)', async ({ page }) => {
    await page.goto('/admin/contabilidad/plan-cuentas');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('plan de cuentas muestra grupos del seed (si migration 017 ejecutada)', async ({ page }) => {
    await page.goto('/admin/contabilidad/plan-cuentas');
    // Si la migration se ejecutó, debe ver estos grupos
    const tieneActivos = await page.getByText(/activos/i).first().isVisible().catch(() => false);

    if (tieneActivos) {
      await expect(page.getByText(/pasivos/i).first()).toBeVisible();
      await expect(page.getByText(/ingresos/i).first()).toBeVisible();
    } else {
      // Si no se ejecutó la migration, debe mostrar el estado vacío
      await expect(page.getByText(/migration 017|no hay cuentas/i).first()).toBeVisible();
    }
  });

  test('lista de asientos contables carga', async ({ page }) => {
    await page.goto('/admin/contabilidad/asientos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('nuevo asiento tiene tabla de partida doble', async ({ page }) => {
    await page.goto('/admin/contabilidad/asientos/nuevo');
    // Debe tener columnas de Débito y Crédito
    await expect(page.getByText(/débito|debe/i).first()).toBeVisible();
    await expect(page.getByText(/crédito|haber/i).first()).toBeVisible();
    // Botón agregar línea
    await expect(page.getByRole('button', { name: /agregar línea/i })).toBeVisible();
  });

  test('nuevo asiento valida que debe = haber antes de guardar', async ({ page }) => {
    await page.goto('/admin/contabilidad/asientos/nuevo');
    // Llenar descripción pero no cuadrar el asiento
    await page.getByLabel(/descripción/i).fill('Test asiento descuadrado');

    // El botón "Guardar Asiento" debe estar deshabilitado mientras no cuadra
    const btnGuardar = page.getByRole('button', { name: /guardar asiento/i });
    await expect(btnGuardar).toBeDisabled();
  });

  test('períodos contables carga', async ({ page }) => {
    await page.goto('/admin/contabilidad/periodos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('sidebar muestra sección Contabilidad', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByText(/contabilidad/i).first()).toBeVisible();
    // Los tres links deben estar en el sidebar
    await expect(page.getByRole('link', { name: /plan de cuentas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /asientos/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /períodos/i })).toBeVisible();
  });

});
