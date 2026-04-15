import { test, expect } from '@playwright/test';
import { loginAs, logout } from './helpers/auth';

test.describe('Autenticación', () => {

  test('login admin redirige a /admin/dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/admin\/dashboard/);
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('login cliente redirige a /cliente/dashboard', async ({ page }) => {
    await loginAs(page, 'cliente');
    await expect(page).toHaveURL(/cliente\/dashboard/);
  });

  test('login mecánico redirige a /mecanico/dashboard', async ({ page }) => {
    await loginAs(page, 'mecanico');
    await expect(page).toHaveURL(/mecanico\/dashboard/);
  });

  test('credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('noexiste@test.com');
    await page.getByLabel(/contraseña/i).fill('WrongPassword1!');
    await page.getByRole('button', { name: /ingresar|iniciar sesión|entrar|login/i }).click();

    // Debe permanecer en /login y mostrar error
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText(/credenciales|inválid|incorrecto|error/i).first()).toBeVisible();
  });

  test('ruta protegida /admin/* sin login redirige a /login', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('ruta protegida /cliente/* sin login redirige a /login', async ({ page }) => {
    await page.goto('/cliente/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('cliente no puede acceder a /admin/*', async ({ page }) => {
    await loginAs(page, 'cliente');
    await page.goto('/admin/dashboard');
    // Debe redirigir a /cliente/dashboard (middleware)
    await expect(page).toHaveURL(/cliente\/dashboard/);
  });

  test('logout funciona y redirige a /login', async ({ page }) => {
    await loginAs(page, 'admin');
    await logout(page);
    // signOut redirects to / or /login — verify user is no longer authenticated
    await expect(page).toHaveURL(/\/(login)?$/);
  });

});
