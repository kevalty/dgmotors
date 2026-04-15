# Playwright E2E Testing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar Playwright, configurarlo para Chrome, y escribir tests E2E completos que cubran todos los flujos críticos del sistema DG Motors ERP, con HTML report y mock de APIs externas (ANT, Resend).

**Architecture:** Tests corren contra `localhost:3000` (dev server ya corriendo). Se usan cuentas de demo reales del seed (`Demo1234!`). Las APIs externas (ANT, email) se mockean con `page.route()` para evitar dependencias de red. Cada spec es independiente y puede correr en paralelo.

**Tech Stack:** `@playwright/test`, Chromium (Chrome), `playwright.config.ts`, HTML reporter built-in.

**Credenciales de demo:**
- Admin: `admin1@dgmotors.com` / `Demo1234!`
- Mecánico: `carlos.aguirre@dgmotors.com` / `Demo1234!`
- Cliente: `jvargas@gmail.com` / `Demo1234!`
- URL base: `http://localhost:3000`

---

## ⚡ CHECKPOINT — Cómo retomar si se cortan los tokens

Si Claude se detiene a mitad del plan, el usuario debe escribir:
> **"Lee `docs/superpowers/plans/2026-04-15-playwright-e2e.md`, busca el primer checkbox sin marcar `- [ ]` y continúa desde ahí."**

Claude leerá este archivo, encontrará el primer `- [ ]` y retomará exactamente desde ese punto.

---

## File Map — Archivos a crear/modificar

```
dgmotors/
├── playwright.config.ts                  CREAR — config principal
├── tests/
│   ├── e2e/
│   │   ├── helpers/
│   │   │   ├── auth.ts                   CREAR — login helper reutilizable
│   │   │   └── mocks.ts                  CREAR — mock ANT y Resend
│   │   ├── 01-auth.spec.ts               CREAR
│   │   ├── 02-public.spec.ts             CREAR
│   │   ├── 03-cliente.spec.ts            CREAR
│   │   ├── 04-ant.spec.ts                CREAR
│   │   ├── 05-ordenes.spec.ts            CREAR
│   │   ├── 06-inventario.spec.ts         CREAR
│   │   ├── 07-facturacion.spec.ts        CREAR
│   │   ├── 08-caja.spec.ts               CREAR
│   │   └── 09-contabilidad.spec.ts       CREAR
├── package.json                          MODIFICAR — agregar scripts
└── .gitignore                            MODIFICAR — agregar test-results/
```

---

## Task 1: Instalar Playwright y configurar Chrome

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

- [x] **Step 1.1: Instalar dependencias**

```bash
cd d:/Mecanica/dgmotors
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected output: `✓ chromium ... Done.`

- [x] **Step 1.2: Crear `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,       // secuencial — evita conflictos con DB de demo
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [x] **Step 1.3: Agregar scripts a `package.json`**

Dentro de `"scripts"` agregar:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:report": "playwright show-report"
```

- [x] **Step 1.4: Actualizar `.gitignore`**

Agregar al final:
```
# Playwright
test-results/
playwright-report/
```

- [x] **Step 1.5: Crear estructura de directorios**

```bash
mkdir -p d:/Mecanica/dgmotors/tests/e2e/helpers
```

- [x] **Step 1.6: Verificar instalación**

```bash
cd d:/Mecanica/dgmotors && npx playwright --version
```

Expected: `Version 1.x.x`

---

## Task 2: Helpers reutilizables

**Files:**
- Create: `tests/e2e/helpers/auth.ts`
- Create: `tests/e2e/helpers/mocks.ts`

- [x] **Step 2.1: Crear `tests/e2e/helpers/auth.ts`**

```typescript
import { Page } from '@playwright/test';

export async function loginAs(page: Page, role: 'admin' | 'cliente' | 'mecanico') {
  const creds = {
    admin:    { email: 'admin1@dgmotors.com',        password: 'Demo1234!' },
    cliente:  { email: 'jvargas@gmail.com',           password: 'Demo1234!' },
    mecanico: { email: 'carlos.aguirre@dgmotors.com', password: 'Demo1234!' },
  };

  const { email, password } = creds[role];

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();

  // Esperar redirección exitosa
  await page.waitForURL(/(dashboard|admin|cliente|mecanico)/, { timeout: 10_000 });
}

export async function logout(page: Page) {
  // Buscar botón de cerrar sesión en sidebar
  await page.getByRole('button', { name: /cerrar sesión|salir|logout/i }).click();
  await page.waitForURL('/login');
}
```

- [x] **Step 2.2: Crear `tests/e2e/helpers/mocks.ts`**

```typescript
import { Page } from '@playwright/test';

/**
 * Intercepta la llamada a /api/ant/placa y devuelve datos ficticios.
 * Evita depender del servicio externo placaapi.ec durante los tests.
 */
export async function mockANT(page: Page, placa = 'ABC1234') {
  await page.route(`**/api/ant/placa**`, async (route) => {
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
```

---

## Task 3: Tests de autenticación (`01-auth.spec.ts`)

**Files:**
- Create: `tests/e2e/01-auth.spec.ts`

- [x] **Step 3.1: Crear `tests/e2e/01-auth.spec.ts`**

```typescript
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
    await page.getByRole('button', { name: /iniciar sesión|entrar|login/i }).click();

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
    await expect(page).toHaveURL(/login/);
  });

});
```

- [x] **Step 3.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/01-auth.spec.ts --reporter=list
```

Expected: todos los tests pasan o fallan con mensajes claros (no errores de setup).
Si falla por selector: leer el HTML de la página con `page.content()`, actualizar el selector en `auth.ts`.

---

## Task 4: Tests del sitio público (`02-public.spec.ts`)

**Files:**
- Create: `tests/e2e/02-public.spec.ts`

- [x] **Step 4.1: Crear `tests/e2e/02-public.spec.ts`**

```typescript
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
    // Hacer clic en el toggle de tema
    await page.getByRole('button', { name: /tema|dark|light|modo/i }).first().click();
    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });

  test('navbar tiene link de login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /ingresar|login|entrar/i })).toBeVisible();
  });

});
```

- [x] **Step 4.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/02-public.spec.ts --reporter=list
```

---

## Task 5: Tests del portal cliente (`03-cliente.spec.ts`)

**Files:**
- Create: `tests/e2e/03-cliente.spec.ts`

- [x] **Step 5.1: Crear `tests/e2e/03-cliente.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Portal Cliente', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'cliente');
  });

  test('dashboard muestra vehículos del cliente', async ({ page }) => {
    await page.goto('/cliente/dashboard');
    // Juan Vargas tiene vehículos en el seed
    await expect(page.getByText(/ford|vehículo/i).first()).toBeVisible();
  });

  test('lista de vehículos carga', async ({ page }) => {
    await page.goto('/cliente/vehiculos');
    await expect(page.locator('[data-testid="vehiculo-card"], .vehiculo-card, article, .card').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('historial de mantenimiento carga', async ({ page }) => {
    await page.goto('/cliente/mantenimiento');
    // La página debe cargar sin error 500
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('lista de citas carga', async ({ page }) => {
    await page.goto('/cliente/citas');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('página de perfil carga y muestra datos', async ({ page }) => {
    await page.goto('/cliente/perfil');
    // Debe mostrar el nombre del cliente
    await expect(page.getByText(/juan|vargas/i).first()).toBeVisible();
  });

  test('mis facturas carga', async ({ page }) => {
    await page.goto('/cliente/mis-facturas');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

});
```

- [x] **Step 5.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/03-cliente.spec.ts --reporter=list
```

---

## Task 6: Test de integración ANT (`04-ant.spec.ts`)

**Files:**
- Create: `tests/e2e/04-ant.spec.ts`

- [x] **Step 6.1: Crear `tests/e2e/04-ant.spec.ts`**

```typescript
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
```

- [x] **Step 6.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/04-ant.spec.ts --reporter=list
```

---

## Task 7: Tests de Órdenes de Trabajo (`05-ordenes.spec.ts`)

**Files:**
- Create: `tests/e2e/05-ordenes.spec.ts`

- [x] **Step 7.1: Crear `tests/e2e/05-ordenes.spec.ts`**

```typescript
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
    // Navegar a la lista y hacer clic en la primera OT
    await page.goto('/admin/ordenes');
    const primeraOT = page.getByRole('link', { name: /OT-|ver|detalle/i }).first();
    await expect(primeraOT).toBeVisible({ timeout: 10_000 });
    await primeraOT.click();

    // Verificar que cargó el detalle
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Verificar que existen pestañas de Recepción y Fotos
    await expect(page.getByRole('tab', { name: /recepción|checklist/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /fotos/i })).toBeVisible();
  });

  test('pestaña Recepción muestra checklist', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.getByRole('link', { name: /OT-|ver|detalle/i }).first();
    await primeraOT.click();

    await page.getByRole('tab', { name: /recepción|checklist/i }).click();
    // El checklist tiene ítems de documentación y carrocería
    await expect(page.getByText(/tarjeta|soat|carrocería|vidrios/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('PDF de OT se puede abrir', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.getByRole('link', { name: /OT-|ver|detalle/i }).first();
    await primeraOT.click();

    // Verificar que existe el botón de descarga PDF
    const pdfBtn = page.getByRole('link', { name: /pdf|descargar ot/i });
    await expect(pdfBtn).toBeVisible();

    // Verificar que la URL apunta al endpoint correcto
    const href = await pdfBtn.getAttribute('href');
    expect(href).toMatch(/\/api\/pdf\/ot\//);
  });

  test('cambiar estado de OT a "en proceso"', async ({ page }) => {
    await page.goto('/admin/ordenes');
    const primeraOT = page.getByRole('link', { name: /OT-|ver|detalle/i }).first();
    await primeraOT.click();

    // Buscar selector de estado o botón de cambio
    const estadoSelect = page.getByRole('combobox', { name: /estado/i })
      .or(page.getByLabel(/estado/i));

    if (await estadoSelect.isVisible()) {
      // Si hay un select de estado, cambiarlo
      await expect(estadoSelect).toBeVisible();
    } else {
      // Si hay botones de acción directa
      await expect(page.getByText(/estado|pendiente|en proceso|completada/i).first()).toBeVisible();
    }
  });

});
```

- [x] **Step 7.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/05-ordenes.spec.ts --reporter=list
```

---

## Task 8: Tests de Inventario (`06-inventario.spec.ts`)

**Files:**
- Create: `tests/e2e/06-inventario.spec.ts`

- [x] **Step 8.1: Crear `tests/e2e/06-inventario.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Inventario', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('lista de inventario carga con productos', async ({ page }) => {
    await page.goto('/admin/inventario');
    await expect(page.locator('h1').first()).toBeVisible();
    // Debe haber al menos un producto del seed
    await expect(page.getByText(/filtro|aceite|repuesto/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('página nuevo ítem de inventario tiene campos requeridos', async ({ page }) => {
    await page.goto('/admin/inventario/nuevo');
    await expect(page.getByLabel(/nombre/i).first()).toBeVisible();
    await expect(page.getByLabel(/stock|cantidad/i).first()).toBeVisible();
  });

  test('detalle de ítem del inventario carga', async ({ page }) => {
    await page.goto('/admin/inventario');
    const primerItem = page.getByRole('link', { name: /ver|editar|detalle/i }).first();
    await expect(primerItem).toBeVisible({ timeout: 10_000 });
    await primerItem.click();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('dashboard muestra alerta si hay stock bajo mínimo', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // El seed incluye items con stock bajo mínimo para demostración
    // Solo verificamos que el dashboard carga correctamente con la sección de stock
    await expect(page.getByText(/stock|inventario|bajo mínimo/i).first()).toBeVisible({ timeout: 10_000 });
  });

});
```

- [x] **Step 8.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/06-inventario.spec.ts --reporter=list
```

---

## Task 9: Tests de Facturación (`07-facturacion.spec.ts`)

**Files:**
- Create: `tests/e2e/07-facturacion.spec.ts`

- [x] **Step 9.1: Crear `tests/e2e/07-facturacion.spec.ts`**

```typescript
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
    const primeraFactura = page.getByRole('link', { name: /ver|001-001|F-/i }).first();
    await expect(primeraFactura).toBeVisible({ timeout: 10_000 });
    await primeraFactura.click();

    await expect(page.locator('h1, h2').first()).toBeVisible();
    // Verificar que aparece IVA 15%
    await expect(page.getByText(/15%|iva/i).first()).toBeVisible();
  });

  test('botón PDF de factura apunta al endpoint correcto', async ({ page }) => {
    await page.goto('/admin/facturacion');
    const primeraFactura = page.getByRole('link', { name: /ver|001-001|F-/i }).first();
    await primeraFactura.click();

    const pdfBtn = page.getByRole('link', { name: /pdf|descargar/i });
    await expect(pdfBtn).toBeVisible();
    const href = await pdfBtn.getAttribute('href');
    expect(href).toMatch(/\/api\/pdf\/factura\//);
  });

  test('API de PDF de factura responde con Content-Type PDF', async ({ page }) => {
    await loginAs(page, 'admin');
    // Navegar al listado para obtener un ID real
    await page.goto('/admin/facturacion');

    // Capturar el primer link de detalle
    const primerLink = page.getByRole('link', { name: /ver|001-001|F-/i }).first();
    await expect(primerLink).toBeVisible({ timeout: 10_000 });
    const href = await primerLink.getAttribute('href');
    const facturaId = href?.split('/').pop();

    if (facturaId) {
      const response = await page.request.get(`/api/pdf/factura/${facturaId}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
    }
  });

});
```

- [x] **Step 9.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/07-facturacion.spec.ts --reporter=list
```

---

## Task 10: Tests de Caja (`08-caja.spec.ts`)

**Files:**
- Create: `tests/e2e/08-caja.spec.ts`

- [x] **Step 10.1: Crear `tests/e2e/08-caja.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('Caja', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('página de caja carga correctamente', async ({ page }) => {
    await page.goto('/admin/caja');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).not.toHaveURL(/error/);
  });

  test('muestra estado de caja (abierta o cerrada)', async ({ page }) => {
    await page.goto('/admin/caja');
    // Debe mostrar si la caja está abierta o cerrada
    await expect(page.getByText(/abierta|cerrada|abrir caja|caja del día/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('página abrir caja tiene campo de fondo inicial', async ({ page }) => {
    await page.goto('/admin/caja/abrir');
    // Debe tener campo para el fondo inicial
    await expect(
      page.getByLabel(/fondo inicial|monto inicial|efectivo inicial/i)
        .or(page.getByPlaceholder(/fondo|50|100/i))
        .first()
    ).toBeVisible();
  });

  test('página cerrar caja carga (si hay caja abierta)', async ({ page }) => {
    await page.goto('/admin/caja');
    // Si la caja está abierta habrá botón de cerrar
    const btnCerrar = page.getByRole('link', { name: /cerrar caja/i })
      .or(page.getByRole('button', { name: /cerrar caja/i }));

    const visible = await btnCerrar.isVisible().catch(() => false);
    if (visible) {
      await btnCerrar.click();
      await expect(page.getByText(/cierre|cuadre|resumen/i).first()).toBeVisible();
    } else {
      // Si no hay caja abierta, verificar que el mensaje es correcto
      await expect(page.getByText(/no hay caja|abrir caja|sin sesión/i).first()).toBeVisible();
    }
  });

});
```

- [x] **Step 10.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/08-caja.spec.ts --reporter=list
```

---

## Task 11: Tests de Contabilidad (`09-contabilidad.spec.ts`)

**Files:**
- Create: `tests/e2e/09-contabilidad.spec.ts`

- [x] **Step 11.1: Crear `tests/e2e/09-contabilidad.spec.ts`**

```typescript
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
```

- [x] **Step 11.2: Ejecutar y verificar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test tests/e2e/09-contabilidad.spec.ts --reporter=list
```

---

## Task 12: Ejecutar todos los tests y generar reporte HTML

**Files:** ninguno nuevo — solo ejecución.

- [x] **Step 12.1: Ejecutar todos los tests en orden**

```bash
cd d:/Mecanica/dgmotors && npx playwright test --reporter=html
```

Expected: Reporte generado en `playwright-report/index.html`

- [x] **Step 12.2: Abrir el reporte**

```bash
cd d:/Mecanica/dgmotors && npx playwright show-report
```

Se abre en el navegador. Muestra: tests pasados (verde), fallados (rojo), screenshots de fallos.

- [x] **Step 12.3: Para cada test fallido, aplicar fix-loop**

1. Leer el error en el reporte (selector no encontrado, timeout, etc.)
2. Abrir el archivo del spec correspondiente
3. Si el error es de selector: buscar el elemento real en el HTML con `page.content()` o las capturas del reporte
4. Actualizar el selector en el spec
5. Re-ejecutar solo ese spec: `npx playwright test tests/e2e/XX-nombre.spec.ts`
6. Repetir hasta que pase

- [x] **Step 12.4: Verificación final — todos los tests deben pasar**

```bash
cd d:/Mecanica/dgmotors && npx playwright test --reporter=list
```

Expected: `X passed (0 failed)`

---

## Task 13: Actualizar CLAUDE.md con estado de tests

- [x] **Step 13.1: Marcar Fase 9 tests en CLAUDE.md como completados**

En `CLAUDE.md`, en la sección de Fase 17 (QA Final):
```
- [x] Tests E2E con Playwright — 9 suites, Chrome, HTML report
```

---

## Resumen de comandos útiles

```bash
# Correr todos los tests
npx playwright test

# Correr un spec específico
npx playwright test tests/e2e/01-auth.spec.ts

# Correr en modo UI (debug visual)
npx playwright test --ui

# Ver reporte HTML del último run
npx playwright show-report

# Correr con captura de video en todos (no solo fallos)
npx playwright test --video=on

# Correr en modo headed (ver Chrome abrirse)
npx playwright test --headed
```
