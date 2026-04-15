import { Page } from '@playwright/test';

export async function loginAs(page: Page, role: 'admin' | 'cliente' | 'mecanico') {
  const creds = {
    admin:    { email: 'admin1@dgmotors.com',        password: 'Demo1234!' },
    cliente:  { email: 'jvargas@gmail.com',           password: 'Demo1234!' },
    mecanico: { email: 'carlos@dgmotors.com',          password: 'Demo1234!' },
  };

  const { email, password } = creds[role];

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /ingresar|iniciar sesión|entrar|login/i }).click();

  // Esperar redirección exitosa
  await page.waitForURL(/(dashboard|admin|cliente|mecanico)/, { timeout: 12_000 });
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /cerrar sesión|salir|logout/i }).click();
  await page.waitForURL(/\/(login)?$/, { timeout: 12_000 });
}
