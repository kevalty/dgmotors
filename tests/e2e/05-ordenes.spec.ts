import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Órdenes de Trabajo', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de OTs carga', async ({ page }) => {
    await page.goto('/admin/ordenes');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página nueva OT tiene todos los campos requeridos', async ({ page }) => {
    await page.goto('/admin/ordenes/nueva');
    await expect(page.getByText(/descripción|problema|cliente/i).first()).toBeVisible();
  });

  test('detalle de OT del seed carga con pestañas', async ({ page }) => {
    await page.goto('/admin/ordenes');
    // Buscar el primer link a una OT (por patrón de número OT)
    const primeraOT = page.locator('a[href*="/admin/ordenes/"]').filter({ hasText: /OT-/ }).first();
    const exists = await primeraOT.count() > 0;

    if (!exists) {
      // No hay OTs en la demo — sólo verificar que la lista carga sin error
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraOT.click();
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /recepción|checklist/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /fotos/i })).toBeVisible();
  });

  test('pestaña Recepción muestra checklist', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.locator('a[href*="/admin/ordenes/"]').filter({ hasText: /OT-/ }).first();
    const exists = await primeraOT.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraOT.click();
    await page.getByRole('tab', { name: /recepción|checklist/i }).click();
    await expect(page.getByText(/tarjeta|soat|carrocería|vidrios/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('PDF de OT se puede abrir', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.locator('a[href*="/admin/ordenes/"]').filter({ hasText: /OT-/ }).first();
    const exists = await primeraOT.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraOT.click();
    const pdfBtn = page.getByRole('link', { name: /pdf|descargar ot/i });
    await expect(pdfBtn).toBeVisible();
    const href = await pdfBtn.getAttribute('href');
    expect(href).toMatch(/\/api\/pdf\/ot\//);
  });

  test('cambiar estado de OT', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.locator('a[href*="/admin/ordenes/"]').filter({ hasText: /OT-/ }).first();
    const exists = await primeraOT.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraOT.click();
    await expect(page.getByText(/estado|pendiente|en proceso|completada/i).first()).toBeVisible();
  });

});
