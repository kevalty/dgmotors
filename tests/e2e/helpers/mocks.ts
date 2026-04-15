import { Page } from '@playwright/test';

/**
 * Intercepta /api/ant/placa y devuelve datos ficticios.
 * Evita depender del servicio externo placaapi.ec durante los tests.
 */
export async function mockANT(page: Page, placa = 'ABC1234') {
  await page.route('**/api/ant/placa**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        datos: {
          placa,
          marca:       'Ford',
          modelo:      'F-150',
          anio:        2020,
          color:       'Blanco',
          propietario: 'Juan Test',
          cedula:      '1234567890',
          tipo:        'pickup',
        },
      }),
    });
  });
}

/**
 * Intercepta llamadas a Resend para evitar enviar emails reales.
 */
export async function mockResend(page: Page) {
  await page.route('**/api.resend.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-email-id' }),
    });
  });
}
