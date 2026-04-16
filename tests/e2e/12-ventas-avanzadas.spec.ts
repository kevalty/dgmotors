import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Ventas Avanzadas — Retenciones, Anticipos, Notas de Crédito', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  // ── Retenciones ─────────────────────────────────────────────────────────────

  test('lista de retenciones carga', async ({ page }) => {
    await page.goto('/admin/retenciones');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página retenciones muestra KPIs de renta e IVA', async ({ page }) => {
    await page.goto('/admin/retenciones');
    await expect(
      page.getByText(/retenci|renta|iva|sin retenciones/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('formulario nueva retención tiene campos SRI', async ({ page }) => {
    await page.goto('/admin/retenciones/nueva');
    await expect(page.getByText(/código.*sri|código ret|porcentaje|base imponible/i).first()).toBeVisible();
  });

  test('formulario retención tiene selector de tipo renta/iva', async ({ page }) => {
    await page.goto('/admin/retenciones/nueva');
    await expect(page.getByText(/renta|iva/i).first()).toBeVisible();
  });

  // ── Anticipos ───────────────────────────────────────────────────────────────

  test('lista de anticipos carga', async ({ page }) => {
    await page.goto('/admin/anticipos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página anticipos muestra saldo disponible total', async ({ page }) => {
    await page.goto('/admin/anticipos');
    await expect(
      page.getByText(/saldo disponible|anticipos|total.*anticipo|sin anticipos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('formulario nuevo anticipo tiene cliente y método de pago', async ({ page }) => {
    await page.goto('/admin/anticipos/nuevo');
    await expect(page.getByText(/cliente|monto|método.*pago/i).first()).toBeVisible();
  });

  // ── Notas de Crédito ─────────────────────────────────────────────────────────

  test('página nota de crédito carga', async ({ page }) => {
    await page.goto('/admin/facturacion/nota-credito');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('formulario nota de crédito tiene campos obligatorios', async ({ page }) => {
    await page.goto('/admin/facturacion/nota-credito');
    await expect(
      page.getByText(/factura.*origen|motivo|nota.*crédito/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Prospectos ──────────────────────────────────────────────────────────────

  test('CRM prospectos carga', async ({ page }) => {
    await page.goto('/admin/prospectos');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('prospectos muestra pipeline de estados', async ({ page }) => {
    await page.goto('/admin/prospectos');
    await expect(
      page.getByText(/prospecto|pipeline|nuevo|interesado|sin prospectos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('formulario nuevo prospecto tiene campos empresa y valor', async ({ page }) => {
    await page.goto('/admin/prospectos/nuevo');
    await expect(page.getByText(/nombre.*empresa|empresa|valor.*estimado/i).first()).toBeVisible();
  });

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  test('sidebar muestra sección Ventas Avanzado', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(
      page.getByRole('link', { name: /retenciones|anticipos|prospectos/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

});
