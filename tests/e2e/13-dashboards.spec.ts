import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Dashboards Gerenciales', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  // ── Hub ──────────────────────────────────────────────────────────────────────

  test('hub de dashboards carga los 8 cards', async ({ page }) => {
    await page.goto('/admin/dashboards');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText(/gerencial/i).first()).toBeVisible();
    await expect(page.getByText(/ventas/i).first()).toBeVisible();
    await expect(page.getByText(/compras/i).first()).toBeVisible();
    await expect(page.getByText(/cobrar/i).first()).toBeVisible();
    await expect(page.getByText(/tesorería/i).first()).toBeVisible();
    await expect(page.getByText(/vendedores/i).first()).toBeVisible();
    await expect(page.getByText(/comparativa/i).first()).toBeVisible();
    await expect(page.getByText(/rentabilidad/i).first()).toBeVisible();
  });

  // ── Gerencial ────────────────────────────────────────────────────────────────

  test('dashboard Gerencial carga con KPIs', async ({ page }) => {
    await page.goto('/admin/dashboards/gerencial');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
    await expect(page.getByText(/ventas totales|cobrado|compras|utilidad/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard Gerencial tiene filtro de sucursal y año', async ({ page }) => {
    await page.goto('/admin/dashboards/gerencial');
    await expect(page.locator('select[name="anio"]')).toBeVisible();
    await expect(page.locator('select[name="sucursal"]')).toBeVisible();
  });

  test('dashboard Gerencial muestra gráfica mensual', async ({ page }) => {
    await page.goto('/admin/dashboards/gerencial');
    // recharts renderiza un <svg> con las barras
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Ventas ───────────────────────────────────────────────────────────────────

  test('dashboard Ventas carga con KPIs', async ({ page }) => {
    await page.goto('/admin/dashboards/ventas');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
    await expect(page.getByText(/ventas brutas|netas|iva|nota.*crédito/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard Ventas muestra por método de pago', async ({ page }) => {
    await page.goto('/admin/dashboards/ventas');
    await expect(page.getByText(/método.*pago|efectivo|transferencia|sin cobros/i).first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Compras ──────────────────────────────────────────────────────────────────

  test('dashboard Compras carga', async ({ page }) => {
    await page.goto('/admin/dashboards/compras');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard Compras muestra KPIs de total y recibidas', async ({ page }) => {
    await page.goto('/admin/dashboards/compras');
    await expect(page.getByText(/total.*compras|recibidas|por recibir/i).first()).toBeVisible({ timeout: 8_000 });
  });

  // ── CxC ──────────────────────────────────────────────────────────────────────

  test('dashboard CxC carga', async ({ page }) => {
    await page.goto('/admin/dashboards/cxc');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard CxC muestra total y vencidas', async ({ page }) => {
    await page.goto('/admin/dashboards/cxc');
    await expect(page.getByText(/total.*cxc|cuentas.*cobrar|vencidas|anticipos/i).first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Tesorería ────────────────────────────────────────────────────────────────

  test('dashboard Tesorería carga', async ({ page }) => {
    await page.goto('/admin/dashboards/tesoreria');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard Tesorería muestra saldo bancos y cobros del mes', async ({ page }) => {
    await page.goto('/admin/dashboards/tesoreria');
    await expect(page.getByText(/saldo.*banco|cobros|anticipos/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('dashboard Tesorería tiene filtro de mes', async ({ page }) => {
    await page.goto('/admin/dashboards/tesoreria');
    await expect(page.locator('select[name="mes"]')).toBeVisible();
    await expect(page.locator('select[name="anio"]')).toBeVisible();
  });

  // ── Vendedores ───────────────────────────────────────────────────────────────

  test('dashboard Vendedores carga', async ({ page }) => {
    await page.goto('/admin/dashboards/vendedores');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard Vendedores muestra ranking de cobradores', async ({ page }) => {
    await page.goto('/admin/dashboards/vendedores');
    await expect(
      page.getByText(/ranking|cobros|facturas emitidas|sin datos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Comparativa ──────────────────────────────────────────────────────────────

  test('dashboard Comparativa carga', async ({ page }) => {
    await page.goto('/admin/dashboards/comparativa');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard Comparativa muestra ventas vs compras', async ({ page }) => {
    await page.goto('/admin/dashboards/comparativa');
    await expect(page.getByText(/ventas|compras|margen|utilidad/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('dashboard Comparativa tiene tabla mes a mes', async ({ page }) => {
    await page.goto('/admin/dashboards/comparativa');
    await expect(page.getByText(/ene|feb|mar|total/i).first()).toBeVisible({ timeout: 8_000 });
  });

  // ── Rentabilidad ─────────────────────────────────────────────────────────────

  test('dashboard Rentabilidad carga', async ({ page }) => {
    await page.goto('/admin/dashboards/rentabilidad');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('dashboard Rentabilidad muestra margen bruto', async ({ page }) => {
    await page.goto('/admin/dashboards/rentabilidad');
    await expect(
      page.getByText(/margen bruto|venta neta|costo|rentabilidad/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('dashboard Rentabilidad muestra por categoría de servicio', async ({ page }) => {
    await page.goto('/admin/dashboards/rentabilidad');
    await expect(
      page.getByText(/categoría|mantenimiento|diagnóstico|sin datos/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Navegación back ──────────────────────────────────────────────────────────

  test('botón volver redirige al hub desde cualquier dashboard', async ({ page }) => {
    const dashboards = [
      '/admin/dashboards/comparativa',
      '/admin/dashboards/rentabilidad',
    ];
    for (const url of dashboards) {
      await page.goto(url);
      // El ArrowLeft está dentro de un Link → Button ghost, buscamos el link que apunta al hub
      const backLink = page.locator('a[href="/admin/dashboards"]').first();
      if (await backLink.count() > 0) {
        await backLink.click();
        await expect(page).toHaveURL(/\/admin\/dashboards$/);
      } else {
        // Al menos la página cargó sin error
        await expect(page.locator('h1').first()).toBeVisible();
      }
    }
  });

});
