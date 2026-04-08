# DG Motors — Plataforma Web

Plataforma completa para DG Motors: sitio público, portal de clientes, panel admin y portal de mecánicos.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (Auth + PostgreSQL)

---

## Requisitos previos

- Node.js 18 o superior
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Git

---

## Setup inicial (primera vez)

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/dgmotors.git
cd dgmotors
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New Project
2. Elegir nombre, contraseña y región (ej. South America)
3. Esperar a que el proyecto esté listo (~2 min)

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con los datos de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

Las keys se encuentran en: **Supabase → Project Settings → API**
- `NEXT_PUBLIC_SUPABASE_URL` → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon / public
- `SUPABASE_SERVICE_ROLE_KEY` → service_role (**nunca expongas esta key al cliente**)

### 5. Ejecutar las migraciones SQL

En el **SQL Editor** de Supabase (menú lateral), ejecutar los archivos de `supabase/migrations/` **en orden**:

| Archivo | Qué hace |
|---|---|
| `001_schema_inicial.sql` | Crea todas las tablas y triggers |
| `002_rls_policies.sql` | Políticas de seguridad (RLS) |
| `003_seed_servicios.sql` | Datos iniciales de servicios y horarios |
| `004_mecanico_role.sql` | Agrega el rol `mecanico` al sistema |
| `005_...` | (ver archivos en orden) |
| `008_fix_citas_rls_y_tecnico.sql` | **Importante:** corrige RLS de citas y agrega columna `tecnico_id` |
| `009_demo_seed.sql` | Datos de demostración (opcional) |
| `010_contactos_table.sql` | Tabla para mensajes del formulario de contacto |

> Abrir cada archivo, copiar el contenido, pegarlo en el SQL Editor y hacer clic en **Run**.

### 6. Cargar datos de demostración (opcional)

Si quieres ver la plataforma con datos reales para mostrar a clientes, ejecutar también:

```
supabase/migrations/009_demo_seed.sql
```

Esto crea 2 mecánicos, 5 clientes con vehículos Ford, 11 citas en distintos estados y registros de mantenimiento con costos reales.

**Credenciales del demo** (todos con contraseña `Demo1234!`):
| Email | Rol |
|---|---|
| carlos.aguirre@dgmotors.com | mecánico |
| miguel.torres@dgmotors.com | mecánico |
| jvargas@gmail.com | cliente (2 vehículos) |
| andrea.morales@gmail.com | cliente |
| roberto.chiriboga@hotmail.com | cliente (2 vehículos) |
| stephanie.alvarado@gmail.com | cliente |
| diego.espinoza@gmail.com | cliente |

### 7. Crear el primer usuario admin

1. Ir a **Supabase → Authentication → Users → Add user**
2. Crear el usuario con email y contraseña
3. Ir a **Table Editor → perfiles**
4. Encontrar el usuario recién creado y cambiar el campo `rol` de `cliente` a `admin`

### 7. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Estructura de roles

| Rol | Acceso | URL |
|---|---|---|
| `cliente` | Portal del cliente | `/cliente/dashboard` |
| `admin` | Panel de administración completo | `/admin/dashboard` |
| `mecanico` | Portal de mecánicos (citas asignadas) | `/mecanico/dashboard` |

### Crear mecánicos

Solo el admin puede crear cuentas de mecánicos desde:
**Panel Admin → Mecánicos → Nuevo Mecánico**

### Registrar clientes walk-in

Clientes que llegan sin cuenta previa se registran desde:
**Panel Admin → Clientes → Walk-In**

---

## Flujo de citas

```
Cliente agenda cita (estado: pendiente)
    ↓
Admin la ve en "Por confirmar" → confirma + asigna mecánico (estado: confirmada)
    ↓
Mecánico la ve en su portal → marca como en proceso (estado: en_proceso)
    ↓
Mecánico completa el trabajo (estado: completada)
    ↓
Admin registra el mantenimiento con los detalles
```

Cada cambio de estado tiene un botón de **WhatsApp** para notificar al cliente automáticamente.

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo en localhost:3000
npm run build    # Build de producción
npm run start    # Iniciar build de producción
npm run lint     # Revisar errores de ESLint
```

Verificar que no hay errores de TypeScript:
```bash
npx tsc --noEmit
```

---

## Variables de entorno

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + Servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Servidor | Key pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Key privada (crear usuarios, bypass RLS) |
| `NEXT_PUBLIC_APP_URL` | Servidor | URL de la app (ej. `http://localhost:3000`) |
| `NEXT_PUBLIC_EMPRESA_NOMBRE` | Cliente | Nombre que aparece en la UI |
| `NEXT_PUBLIC_TELEFONO_QUITO` | Cliente | Teléfono sucursal Quito |
| `NEXT_PUBLIC_TELEFONO_GUAYAQUIL` | Cliente | Teléfono sucursal Guayaquil |
| `NEXT_PUBLIC_EMAIL_CONTACTO` | Cliente | Email de contacto |
| `NEXT_PUBLIC_INSTAGRAM` | Cliente | URL Instagram |
| `NEXT_PUBLIC_FACEBOOK` | Cliente | URL Facebook |

> **Nunca subas `.env.local` al repositorio.** Ya está en `.gitignore`.

---

## Notas técnicas importantes

- Este proyecto usa **Next.js 16** — `params` y `searchParams` son `Promise<{}>`, siempre usar `await params`
- Supabase Auth con SSR: usar `createClient()` de `lib/supabase/server.ts` en Server Components
- Las políticas RLS están en Supabase — si algo no se muestra, revisar las migraciones
- El middleware de protección de rutas está en `proxy.ts` (renombrado de `middleware.ts` para Next.js 16)

---

## Sucursales

| Sucursal | Ubicación |
|---|---|
| Quito | [Ver en Maps](https://maps.app.goo.gl/y8gTFywEogqvDBM2A) |
| Guayaquil | Cdla. Guayacanes 3 Mz. 130 Solar #32 — [Ver en Maps](https://maps.app.goo.gl/eQ842Dow1e35st659) |
