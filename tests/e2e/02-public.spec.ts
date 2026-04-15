import { test, expect } from '@playwright/test';

test.describe('Sitio Público (sin login)', () => {

  test('home carga con hero y CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DG Motors/i);
    // Hero con CTA principal
    await expect(page.getByRole('link', { name: /agendar|servicios/i }).first()).toBeVisible();
  });

  test('página /servicios lista servicios', async ({ page }) => {
    await page.goto('/servicios');
    await expect(page.getByText(/mantenimiento|diagnóstico|cambio/i).first()).toBeVisible();
  });

  test('página /sucursales muestra Quito y Guayaquil', async ({ page }) => {
    await page.goto('/sucursales');
    await expect(page.getByText(/quito/i).first()).toBeVisible();
    await expect(page.getByText(/guayaquil/i).first()).toBeVisible();
  });

  test('formulario de contacto es visible', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.getByLabel(/nombre/i).first()).toBeVisible();
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar/i })).toBeVisible();
  });

  test('toggle dark/light mode funciona', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    // Obtener clase inicial
    const initialClass = await html.getAttribute('class');
    // Hacer clic en el toggle de tema (aria-label="Toggle theme")
    await page.getByRole('button', { name: /toggle theme/i }).first().click();
    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('navbar tiene link al portal', async ({ page }) => {
    await page.goto('/');
    // Navbar muestra "Mi Portal" que redirige al login si no hay sesión
    await expect(page.getByRole('link', { name: /mi portal|ingresar|login|entrar/i })).toBeVisible();
  });

});
