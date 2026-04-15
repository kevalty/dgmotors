import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { mockANT } from './helpers/mocks';

test.describe('Integración ANT — Consulta de Placa', () => {

  test('admin: consultar placa auto-rellena campos del vehículo', async ({ page }) => {
    await loginAs(page, 'admin');
    await mockANT(page, 'ABC1234');

    // Ir al form de nuevo cliente walk-in
    await page.goto('/admin/clientes/nuevo');

    // Primero registrar el cliente (Paso 1)
    await page.getByLabel(/nombre/i).first().fill('Test');
    await page.getByLabel(/apellido/i).fill('Playwright');
    await page.getByRole('button', { name: /registrar cliente/i }).click();

    // Esperar a que aparezca Paso 2 (vehículo)
    await expect(page.getByLabel(/placa/i)).toBeVisible({ timeout: 10_000 });

    // Ingresar placa y consultar ANT
    await page.getByLabel(/placa/i).fill('ABC-1234');
    await page.getByRole('button', { name: /consultar ant/i }).click();

    // Verificar auto-fill
    await expect(page.getByLabel(/marca/i)).toHaveValue('Ford', { timeout: 8_000 });
    await expect(page.getByLabel(/modelo/i)).toHaveValue('F-150');
    await expect(page.getByLabel(/año/i)).toHaveValue('2020');

    // Verificar mensaje de éxito
    await expect(page.getByText(/datos completados desde la ant/i)).toBeVisible();
  });

  test('cliente: consultar placa auto-rellena campos', async ({ page }) => {
    await loginAs(page, 'cliente');
    await mockANT(page, 'XYZ9999');

    await page.goto('/cliente/vehiculos/nuevo');

    await page.getByLabel(/placa/i).fill('XYZ-9999');
    await page.getByRole('button', { name: /consultar ant/i }).click();

    await expect(page.getByLabel(/marca/i)).toHaveValue('Ford', { timeout: 8_000 });
    await expect(page.getByText(/datos completados desde la ant/i)).toBeVisible();
  });

  test('placa no encontrada muestra mensaje de error', async ({ page }) => {
    await loginAs(page, 'admin');

    // Mockear respuesta 404 de ANT
    await page.route('**/api/ant/placa**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'No se encontraron datos para esta placa' }),
      });
    });

    await page.goto('/admin/clientes/nuevo');

    // Registrar cliente primero
    await page.getByLabel(/nombre/i).first().fill('Test');
    await page.getByLabel(/apellido/i).fill('Playwright');
    await page.getByRole('button', { name: /registrar cliente/i }).click();
    await expect(page.getByLabel(/placa/i)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/placa/i).fill('ZZZ0000');
    await page.getByRole('button', { name: /consultar ant/i }).click();

    await expect(page.getByText(/no se encontraron datos|error/i).first()).toBeVisible();
  });

});
