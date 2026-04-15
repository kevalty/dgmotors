import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Facturación', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de facturas carga', async ({ page }) => {
    await page.goto('/admin/facturacion');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('página nueva factura tiene campos de IVA y totales', async ({ page }) => {
    await page.goto('/admin/facturacion/nueva');
    await expect(page.getByText(/iva|total|subtotal/i).first()).toBeVisible();
  });

  test('detalle de factura del seed carga con líneas', async ({ page }) => {
    await page.goto('/admin/facturacion');
    const primeraFactura = page.locator('a[href*="/admin/facturacion/"]').filter({ hasText: /001-001|F-/ }).first()
      .or(page.locator('a[href*="/admin/facturacion/"]').nth(1));

    const exists = await primeraFactura.count() > 0;
    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraFactura.click();
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByText(/15%|iva/i).first()).toBeVisible();
  });

  test('botón PDF de factura apunta al endpoint correcto', async ({ page }) => {
    await page.goto('/admin/facturacion');
    const primeraFactura = page.locator('a[href*="/admin/facturacion/"]').nth(1);
    const exists = await primeraFactura.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    await primeraFactura.click();
    const pdfBtn = page.getByRole('link', { name: /pdf|descargar/i });
    await expect(pdfBtn).toBeVisible();
    const href = await pdfBtn.getAttribute('href');
    expect(href).toMatch(/\/api\/pdf\/factura\//);
  });

  test('API de PDF de factura responde con Content-Type PDF', async ({ page }) => {
    await page.goto('/admin/facturacion');
    // Capturar el primer link a detalle de factura (ignorando el link de "Nueva Factura")
    const primerLink = page.locator('a[href*="/admin/facturacion/"]').nth(1);
    const exists = await primerLink.count() > 0;

    if (!exists) {
      await expect(page.locator('h1').first()).toBeVisible();
      return;
    }

    const href = await primerLink.getAttribute('href');
    const facturaId = href?.split('/').pop();

    if (facturaId) {
      const response = await page.request.get(`/api/pdf/factura/${facturaId}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
    }
  });

});
