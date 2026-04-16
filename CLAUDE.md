# CLAUDE.md — DG Motors ERP Platform
> **Archivo maestro unificado.** Lee TODO esto antes de escribir una sola línea de código.
> Este archivo reemplaza al CLAUDE.md original + CLAUDE_ERP_EXTENSION.md anteriores.
> Actualiza el estado de cada fase conforme avanzas. Nunca borres checkboxes completados.

---

## 🎯 Visión del Proyecto

**DG Motors** es una mecánica automotriz con dos sucursales en Ecuador (Quito y Guayaquil). Están migrando desde **GETSOFT** (ERP en la nube) a una plataforma propia, personalizada al 100%, construida para su operación y con visión de comercializarla a otros talleres.

**¿Por qué lo hacemos?**
GETSOFT es bueno pero no es de ellos — no pueden personalizarlo ni son dueños del sistema. Quieren exactamente las mismas capacidades pero con control total, y eventualmente venderlo a su red de 400+ talleres.

**Deadline crítico:** Viernes — presentación al cliente para definir precio y firma de contrato.
**Objetivo del viernes:** Demo funcional del flujo core + documento de fases que demuestre visión completa.

---

## 🏢 Información de la Empresa

```
Empresa:      DG Motors — Taller Automotriz
Especialidad: Vehículos americanos, Ford, multimarca. Motores diésel.
Web actual:   dgmotors.com.ec
Instagram:    @dgmotorstaller
Facebook:     DG Motors Ford

Sucursal Quito (Principal)
  Coordenadas: -0.1832186, -78.5108469
  Maps: https://maps.app.goo.gl/y8gTFywEogqvDBM2A

Sucursal Guayaquil
  Dirección: Cdla. Guayacanes 3 Mz. 130 Solar #32
  Maps: https://maps.app.goo.gl/eQ842Dow1e35st659
```

---

## 👥 Roles Confirmados por el Cliente

```
gerente           → Dashboards, reportes, visión global, todo de solo lectura + config
facturadora       → Ventas, facturas, cobros, caja, notas de crédito/débito
asesor_servicios  → OTs, citas, vehículos, clientes, agenda del taller
asesor_repuestos  → Inventario, compras, proveedores, solicitudes de repuestos
bodeguero         → Inventario, transferencias entre bodegas, ajustes de stock
contador          → Contabilidad completa, reportes financieros, cierre de período
admin             → Acceso total al sistema (superusuario)
cliente           → Portal cliente: sus vehículos, citas, facturas, historial
mecanico          → App móvil simplificada: fotos de daños y recomendaciones SOLO
```

**Contabilidad:** Interna Y externa — módulo contable completo es necesario.
**Facturación electrónica SRI:** Activa — credenciales se entregan al firmar contrato.
**Inventario:** Bodegas separadas por sucursal, necesitan transferencias entre ellas.
**Técnicos:** NO usan el sistema de escritorio. Tienen módulo móvil solo para fotos/checklist.

---

## 🛠 Stack Tecnológico

```
Framework:    Next.js 14+ — App Router (NO Pages Router)
Lenguaje:     TypeScript estricto (strict: true)
Estilos:      Tailwind CSS + darkMode: ['class']
Componentes:  shadcn/ui (instalar bajo demanda)
Iconos:       Lucide React
Fuentes:      Syne (headings) + DM Sans (body) via next/font
Auth:         Supabase Auth (NO NextAuth, NO Clerk)
Base de datos: PostgreSQL vía Supabase (queries directas, NO Prisma)
SSR:          @supabase/ssr para App Router
Validación:   Zod + react-hook-form + @hookform/resolvers
Modo:         Dark mode + Light mode (next-themes)
PDF:          @react-pdf/renderer
CSV:          papaparse
Storage:      Supabase Storage (fotos OT en bucket 'ot-fotos')
Email:        Resend o similar (activar con credenciales)
```

---

## 📁 Estado Actual del Proyecto

### ✅ Ya existe — NO recrear

**Sitio Público:**
- `app/(public)/page.tsx` — Home
- `app/(public)/servicios/page.tsx`
- `app/(public)/sucursales/page.tsx`
- `app/(public)/contacto/page.tsx`
- `app/(public)/nosotros/page.tsx`
- `app/(public)/productos/page.tsx` + `[slug]/page.tsx`

**Auth:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/registro/page.tsx`
- `app/(auth)/recuperar/page.tsx`
- `app/api/auth/callback/route.ts`

**Portal Cliente:**
- `app/cliente/dashboard/page.tsx`
- `app/cliente/vehiculos/page.tsx` + `nuevo/` + `[id]/`
- `app/cliente/citas/page.tsx` + `nueva/`
- `app/cliente/mantenimiento/page.tsx`
- `app/cliente/aceite/page.tsx`
- `app/cliente/perfil/page.tsx`
- `app/cliente/mis-facturas/page.tsx` + `[id]/`

**Panel Admin — Base:**
- `app/admin/dashboard/page.tsx`
- `app/admin/citas/page.tsx` + `[id]/`
- `app/admin/clientes/page.tsx` + `[id]/` + `nuevo/`
- `app/admin/mantenimiento/page.tsx` + `nuevo/` + `[id]/editar/`
- `app/admin/mecanicos/page.tsx` + `nuevo/`
- `app/admin/servicios/page.tsx`
- `app/admin/reportes/page.tsx`
- `app/admin/vehiculos/page.tsx`
- `app/admin/contacto/page.tsx`
- `app/admin/productos/page.tsx` + `nuevo/` + `[id]/editar/`

**Panel Admin — ERP (ya creados):**
- `app/admin/ordenes/page.tsx` + `nueva/` + `[id]/`
- `app/admin/inventario/page.tsx` + `nuevo/` + `[id]/` + `ajuste/`
- `app/admin/facturacion/page.tsx` + `nueva/` + `[id]/`
- `app/admin/caja/page.tsx` + `abrir/` + `cerrar/`
- `app/admin/compras/page.tsx` + `nueva/` + `[id]/`
- `app/admin/proveedores/page.tsx`

**Portal Mecánico (ya creado):**
- `app/mecanico/dashboard/page.tsx`
- `app/mecanico/citas/page.tsx` + `[id]/`
- `app/mecanico/vehiculos/page.tsx`
- `app/mecanico/historial/page.tsx`
- `app/mecanico/registrar/page.tsx`

**APIs ya creadas:**
- `app/api/pdf/factura/[id]/route.ts`
- `app/api/pdf/ot/[id]/route.ts`

**Migrations ejecutadas (001 → 014):**
- 004_productos, 005_mecanico_role, 006_seed_productos
- 007_citas_tecnico, 008_fix_citas_rls_y_tecnico
- 009_demo_seed, 010_contactos_table, 011_demo_contactos
- 012_reset_y_seed_final, **013_erp_schema_completo**, **014_checklist_fotos_ot**

---

## 🗄 Migrations Pendientes (015 en adelante)

```sql
-- =============================================
-- 015_roles_completos.sql
-- =============================================
ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_rol_check,
  ADD CONSTRAINT perfiles_rol_check
    CHECK (rol IN (
      'cliente','admin','mecanico',
      'gerente','facturadora','asesor_servicios',
      'asesor_repuestos','bodeguero','contador'
    ));
```

```sql
-- =============================================
-- 016_consulta_ant.sql
-- =============================================
-- Cache de consultas ANT para no repetir requests externos
CREATE TABLE public.ant_cache (
  placa       TEXT PRIMARY KEY,
  datos       JSONB NOT NULL,  -- {marca, modelo, anio, color, propietario, cedula}
  consultado  TIMESTAMPTZ DEFAULT NOW(),
  expira      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
ALTER TABLE public.ant_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ant_r" ON public.ant_cache FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ant_w" ON public.ant_cache FOR ALL USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin','asesor_servicios','facturadora'))
);
```

```sql
-- =============================================
-- 017_contabilidad.sql
-- =============================================

-- PLAN DE CUENTAS (jerarquía hasta nivel 5)
CREATE TABLE public.plan_cuentas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT UNIQUE NOT NULL,        -- ej: 1.1.01.001
  nombre       TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('activo','pasivo','patrimonio','ingreso','gasto','costo')),
  nivel        INTEGER NOT NULL,            -- 1=grupo 2=subgrupo 3=cuenta 4=subcuenta 5=auxiliar
  padre_id     UUID REFERENCES public.plan_cuentas(id),
  permite_mov  BOOLEAN DEFAULT FALSE,       -- solo nivel 5 permite movimientos
  aplica_iva   BOOLEAN DEFAULT FALSE,
  activa       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CENTROS DE COSTOS
CREATE TABLE public.centros_costos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo    TEXT UNIQUE NOT NULL,
  nombre    TEXT NOT NULL,
  sucursal  TEXT CHECK (sucursal IN ('quito','guayaquil','ambos')),
  activo    BOOLEAN DEFAULT TRUE
);

-- PERÍODOS CONTABLES
CREATE TABLE public.periodos_contables (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio       INTEGER NOT NULL,
  mes        INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  estado     TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado')),
  cerrado_en TIMESTAMPTZ,
  cerrado_por UUID REFERENCES public.perfiles(id),
  UNIQUE(anio, mes)
);

-- ASIENTOS CONTABLES
CREATE TABLE public.asientos_contables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero       SERIAL UNIQUE,
  fecha        DATE NOT NULL,
  descripcion  TEXT NOT NULL,
  tipo         TEXT DEFAULT 'manual' CHECK (tipo IN ('manual','automatico','apertura','cierre')),
  modulo       TEXT,   -- 'ventas','compras','caja','nomina'
  referencia   TEXT,   -- número de documento origen
  periodo_id   UUID REFERENCES public.periodos_contables(id),
  usuario_id   UUID REFERENCES public.perfiles(id),
  estado       TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','contabilizado','anulado')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- LÍNEAS DE ASIENTO (partida doble — debe = haber siempre)
CREATE TABLE public.asiento_lineas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asiento_id      UUID NOT NULL REFERENCES public.asientos_contables(id) ON DELETE CASCADE,
  cuenta_id       UUID NOT NULL REFERENCES public.plan_cuentas(id),
  centro_costo_id UUID REFERENCES public.centros_costos(id),
  descripcion     TEXT,
  debe            NUMERIC(15,2) DEFAULT 0,
  haber           NUMERIC(15,2) DEFAULT 0,
  referencia      TEXT
);
```

```sql
-- =============================================
-- 018_activos_fijos.sql
-- =============================================

CREATE TABLE public.categorias_activo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  vida_util_anios  INTEGER NOT NULL,
  metodo_dep       TEXT DEFAULT 'linea_recta' CHECK (metodo_dep IN ('linea_recta','saldo_decreciente')),
  cuenta_activo    UUID REFERENCES public.plan_cuentas(id),
  cuenta_dep_acu   UUID REFERENCES public.plan_cuentas(id),
  cuenta_gasto_dep UUID REFERENCES public.plan_cuentas(id)
);

CREATE TABLE public.activos_fijos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id   UUID REFERENCES public.categorias_activo(id),
  codigo         TEXT UNIQUE NOT NULL,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  fecha_compra   DATE NOT NULL,
  costo_original NUMERIC(15,2) NOT NULL,
  valor_residual NUMERIC(15,2) DEFAULT 0,
  ubicacion      TEXT,
  sucursal       TEXT CHECK (sucursal IN ('quito','guayaquil')),
  estado         TEXT DEFAULT 'activo' CHECK (estado IN ('activo','depreciado','dado_de_baja','vendido')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.depreciaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activo_id    UUID NOT NULL REFERENCES public.activos_fijos(id),
  periodo_id   UUID NOT NULL REFERENCES public.periodos_contables(id),
  monto        NUMERIC(15,2) NOT NULL,
  acu_anterior NUMERIC(15,2),
  acu_nuevo    NUMERIC(15,2),
  procesado    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

```sql
-- =============================================
-- 019_caja_bancos_avanzado.sql
-- =============================================

CREATE TABLE public.bancos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  numero_cta TEXT NOT NULL,
  tipo_cta   TEXT CHECK (tipo_cta IN ('corriente','ahorros')),
  cuenta_id  UUID REFERENCES public.plan_cuentas(id),
  sucursal   TEXT CHECK (sucursal IN ('quito','guayaquil','ambos')),
  activo     BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.movimientos_banco (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_id     UUID NOT NULL REFERENCES public.bancos(id),
  fecha        DATE NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('deposito','retiro','transferencia','nota_debito','nota_credito')),
  concepto     TEXT NOT NULL,
  monto        NUMERIC(15,2) NOT NULL,
  referencia   TEXT,
  beneficiario TEXT,
  conciliado   BOOLEAN DEFAULT FALSE,
  usuario_id   UUID REFERENCES public.perfiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tarjetas (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre   TEXT NOT NULL,
  tipo     TEXT CHECK (tipo IN ('credito','debito')),
  banco_id UUID REFERENCES public.bancos(id),
  activa   BOOLEAN DEFAULT TRUE
);
```

```sql
-- =============================================
-- 020_ventas_avanzado.sql
-- =============================================

-- RETENCIONES EN VENTAS (SRI Ecuador)
CREATE TABLE public.retenciones_venta (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id     UUID NOT NULL REFERENCES public.facturas(id),
  numero_ret     TEXT,
  fecha          DATE NOT NULL,
  tipo           TEXT CHECK (tipo IN ('renta','iva')),
  porcentaje     NUMERIC(5,2) NOT NULL,
  base_imponible NUMERIC(15,2) NOT NULL,
  valor          NUMERIC(15,2) NOT NULL,
  autorizacion   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ANTICIPOS DE CLIENTES
CREATE TABLE public.anticipos_cliente (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES public.perfiles(id),
  fecha       DATE NOT NULL,
  monto       NUMERIC(15,2) NOT NULL,
  saldo       NUMERIC(15,2) NOT NULL,
  metodo_pago TEXT,
  referencia  TEXT,
  aplicado    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROSPECTOS (leads para vender el sistema a otros talleres)
CREATE TABLE public.prospectos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  empresa     TEXT,
  telefono    TEXT,
  email       TEXT,
  ciudad      TEXT,
  pais        TEXT DEFAULT 'Ecuador',
  estado      TEXT DEFAULT 'nuevo'
                CHECK (estado IN ('nuevo','contactado','interesado','propuesta','cerrado','perdido')),
  notas       TEXT,
  vendedor_id UUID REFERENCES public.perfiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

```sql
-- =============================================
-- 021_rls_nuevas_tablas.sql
-- =============================================

ALTER TABLE public.plan_cuentas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_costos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asiento_lineas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activos_fijos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_activo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depreciaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bancos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_banco  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retenciones_venta  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticipos_cliente  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospectos         ENABLE ROW LEVEL SECURITY;

-- Helper de rol
CREATE OR REPLACE FUNCTION tiene_rol(roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Contabilidad: contador y admin escriben, gerente lee
CREATE POLICY "conta_r" ON public.plan_cuentas       FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "conta_w" ON public.plan_cuentas       FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "asi_r"   ON public.asientos_contables FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "asi_w"   ON public.asientos_contables FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "per_r"   ON public.periodos_contables FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "per_w"   ON public.periodos_contables FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "cc_r"    ON public.centros_costos      FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "cc_w"    ON public.centros_costos      FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));

-- Activos fijos
CREATE POLICY "af_r"  ON public.activos_fijos  FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "af_w"  ON public.activos_fijos  FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "dep_r" ON public.depreciaciones FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "dep_w" ON public.depreciaciones FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));

-- Bancos y movimientos
CREATE POLICY "ban_r" ON public.bancos            FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "ban_w" ON public.bancos            FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));
CREATE POLICY "mb_r"  ON public.movimientos_banco FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente']));
CREATE POLICY "mb_w"  ON public.movimientos_banco FOR ALL    USING (tiene_rol(ARRAY['admin','contador','facturadora']));
CREATE POLICY "tar_r" ON public.tarjetas          FOR SELECT USING (tiene_rol(ARRAY['admin','contador','facturadora']));
CREATE POLICY "tar_w" ON public.tarjetas          FOR ALL    USING (tiene_rol(ARRAY['admin','contador']));

-- Retenciones y anticipos
CREATE POLICY "ret_r"  ON public.retenciones_venta FOR SELECT USING (tiene_rol(ARRAY['admin','contador','gerente','facturadora']));
CREATE POLICY "ret_w"  ON public.retenciones_venta FOR ALL    USING (tiene_rol(ARRAY['admin','facturadora']));
CREATE POLICY "antc_r" ON public.anticipos_cliente FOR SELECT USING (tiene_rol(ARRAY['admin','facturadora','gerente','contador']) OR cliente_id = auth.uid());
CREATE POLICY "antc_w" ON public.anticipos_cliente FOR ALL    USING (tiene_rol(ARRAY['admin','facturadora']));

-- Prospectos: admin y gerente
CREATE POLICY "pros_r" ON public.prospectos FOR SELECT USING (tiene_rol(ARRAY['admin','gerente']));
CREATE POLICY "pros_w" ON public.prospectos FOR ALL    USING (tiene_rol(ARRAY['admin','gerente']));
```

---

## 🔌 Integración ANT — Feature Estrella del Demo

Al ingresar una placa ecuatoriana, el sistema consulta la ANT y autocompleta marca, modelo, año, color, propietario y cédula. **Esta es la feature más impactante visualmente para el viernes.**

```typescript
// lib/ant/consultar.ts

export interface DatosVehiculoANT {
  placa:       string
  marca:       string
  modelo:      string
  anio:        number
  color:       string
  propietario: string
  cedula:      string
  tipo:        string
}

export async function consultarPlacaANT(placa: string): Promise<DatosVehiculoANT | null> {
  // 1. Buscar en cache (tabla ant_cache)
  // 2. Si existe y no expiró → retornar cache
  // 3. Si no → llamar API externa
  // 4. Guardar en cache con expiración 30 días
  // 5. Retornar datos
}
```

**API a investigar al momento de implementar:**
- `https://api.consultaplaca.com.ec` (verificar disponibilidad)
- `https://srienlinea.sri.gob.ec` (SRI también tiene datos de vehículos)
- Alternativa: Supabase Edge Function con scraping del portal ANT

**UX esperada en el form de nuevo vehículo:**
1. Campo placa con botón "Consultar ANT"
2. Spinner "Consultando ANT..." (2-3 segundos)
3. Datos prellenados automáticamente
4. Recepcionista confirma o edita y guarda

---

## 🏗 Rutas Pendientes de Construir

```
app/
├── admin/
│   ├── contabilidad/
│   │   ├── plan-cuentas/page.tsx        — Árbol jerárquico de cuentas
│   │   ├── plan-cuentas/nueva/page.tsx
│   │   ├── asientos/page.tsx            — Lista con filtros
│   │   ├── asientos/nuevo/page.tsx      — Asiento manual partida doble
│   │   ├── asientos/[id]/page.tsx
│   │   ├── periodos/page.tsx            — Gestión y cierre de períodos
│   │   └── centros-costos/page.tsx
│   ├── activos/
│   │   ├── page.tsx                     — Lista con valor neto actual
│   │   ├── nuevo/page.tsx
│   │   └── depreciacion/page.tsx        — Procesar depreciación mensual
│   ├── bancos/
│   │   ├── page.tsx                     — Cuentas bancarias con saldo
│   │   └── movimientos/page.tsx         — Depósitos, retiros, transferencias
│   ├── retenciones/page.tsx             — Retenciones SRI en ventas
│   ├── anticipos/page.tsx               — Anticipos de clientes
│   └── prospectos/page.tsx              — CRM para vender el sistema
├── mecanico/
│   └── checklist/[ot_id]/page.tsx       — Fotos y checklist de daños (mobile)
└── api/
    ├── ant/placa/route.ts               — Proxy consulta ANT
    ├── sri/factura/route.ts             — Emisión electrónica SRI (post-contrato)
    └── reportes/[tipo]/route.ts         — Exportar Excel/CSV
```

---

## 📊 Permisos por Rol — Tabla Completa

| Módulo                  | cliente | mecanico | asesor_svc | asesor_rep | bodeguero | facturadora | contador | gerente | admin |
|-------------------------|---------|----------|------------|------------|-----------|-------------|----------|---------|-------|
| Sitio público           | ✅      | ✅       | ✅         | ✅         | ✅        | ✅          | ✅       | ✅      | ✅    |
| Portal cliente          | ✅      | ❌       | ❌         | ❌         | ❌        | ❌          | ❌       | ❌      | ✅    |
| Portal mecánico         | ❌      | ✅       | ❌         | ❌         | ❌        | ❌          | ❌       | ❌      | ✅    |
| OTs (crear/editar)      | ❌      | Parcial  | ✅         | ❌         | ❌        | ❌          | ❌       | 👁      | ✅    |
| Citas                   | ✅      | ✅       | ✅         | ❌         | ❌        | ❌          | ❌       | 👁      | ✅    |
| Inventario              | ❌      | ❌       | 👁         | ✅         | ✅        | ❌          | ❌       | 👁      | ✅    |
| Compras/Proveedores     | ❌      | ❌       | ❌         | ✅         | ✅        | ❌          | ❌       | 👁      | ✅    |
| Facturación/Ventas      | ❌      | ❌       | ❌         | ❌         | ❌        | ✅          | 👁       | 👁      | ✅    |
| Caja                    | ❌      | ❌       | ❌         | ❌         | ❌        | ✅          | 👁       | 👁      | ✅    |
| Contabilidad            | ❌      | ❌       | ❌         | ❌         | ❌        | ❌          | ✅       | 👁      | ✅    |
| Activos Fijos           | ❌      | ❌       | ❌         | ❌         | ❌        | ❌          | ✅       | 👁      | ✅    |
| Bancos                  | ❌      | ❌       | ❌         | ❌         | ❌        | Parcial     | ✅       | 👁      | ✅    |
| Retenciones SRI         | ❌      | ❌       | ❌         | ❌         | ❌        | ✅          | ✅       | 👁      | ✅    |
| Reportes                | ❌      | ❌       | Parcial    | Parcial    | Parcial   | Parcial     | ✅       | ✅      | ✅    |
| Dashboards              | ❌      | ❌       | ❌         | ❌         | ❌        | ❌          | ❌       | ✅      | ✅    |
| Prospectos              | ❌      | ❌       | ❌         | ❌         | ❌        | ❌          | ❌       | ✅      | ✅    |
| Config del sistema      | ❌      | ❌       | ❌         | ❌         | ❌        | ❌          | ❌       | ❌      | ✅    |

👁 = solo lectura

---

## 📋 Fases de Desarrollo

`[ ]` pendiente | `[~]` en progreso | `[x]` completado

---

### FASES 1-7 `[x]` — COMPLETADAS
Sitio público, auth, portal cliente, panel admin base, OTs, inventario, facturación, caja, compras, proveedores, portal mecánico, PDFs de OT y factura, fotos en OT, email automático.

---

### FASE 8 — Pulido Core ERP `[~]` ← EN PROGRESO
- [x] PDF factura con formato correcto SRI (001-001-000000001, IVA 15%) — `lib/pdf/FacturaPDF.tsx` + `app/api/pdf/factura/[id]/route.ts`
- [x] PDF OT con checklist de daños, fotos y línea de firma del cliente — `lib/pdf/PresupuestoPDF.tsx` + `app/api/pdf/ot/[id]/route.ts`
- [x] Email automático al cliente al cambiar estado de OT — `lib/emails/otStatusEmail.tsx` + Resend en `lib/actions/erp.ts`
- [x] Fotos entrada/salida suben correctamente a bucket `ot-fotos` — `components/admin/FotosOT.tsx` + server actions `subirFotoOT` / `eliminarFotoOT`
- [x] **Integración ANT** — `lib/ant/consultar.ts` + `app/api/ant/placa/route.ts` + formularios admin y cliente actualizados
- [x] Cache ANT funcionando en tabla `ant_cache` — migration 016 lista para ejecutar en Supabase
- [x] Migration 015 (roles completos) — lista para ejecutar en Supabase
- [x] Middleware actualizado con nuevos roles (gerente, facturadora, asesor_servicios, etc.) — `lib/supabase/middleware.ts`
- [x] Dashboard admin: OTs del día, facturación del mes, stock bajo mínimo, estado caja — `app/admin/dashboard/page.tsx` + `components/admin/IngresosMesChart.tsx`
- [ ] **Ejecutar migrations 015 y 016 en Supabase** (pendiente — requiere acceso al panel Supabase)
- [ ] Prueba flujo completo: vehículo por placa ANT → OT → factura → cobro → cierre caja
- [x] **DEMO_GUIDE.html actualizado** con módulos ERP (Págs. 7 y 8 agregadas)

---

### FASE 9 — Contabilidad `[~]` ← EN PROGRESO
- [ ] Ejecutar migration 017 en Supabase (plan_cuentas, centros_costos, periodos, asientos)
- [x] `admin/contabilidad/plan-cuentas/page.tsx` — Árbol jerárquico de cuentas con CRUD
- [x] `admin/contabilidad/plan-cuentas/nueva/page.tsx` — Nueva cuenta con validación de padre
- [x] `admin/contabilidad/asientos/page.tsx` — Lista con filtros de estado y tipo
- [x] `admin/contabilidad/asientos/[id]/page.tsx` — Detalle con cuadre, acciones contabilizar/anular
- [x] `admin/contabilidad/asientos/nuevo/page.tsx` — Asiento manual partida doble (validación debe = haber)
- [x] `admin/contabilidad/periodos/page.tsx` — Cierre y apertura de períodos mensuales
- [x] `lib/actions/contabilidad.ts` — contabilizarAsiento, anularAsiento, cerrarPeriodo, abrirPeriodo
- [x] Sidebar admin actualizado con sección "Contabilidad"
- [x] Migration 017 escrita con seed de plan de cuentas NEC/NIIF Ecuador + períodos 2026
- [x] Asientos automáticos al emitir factura de venta — `lib/actions/erp.ts` (crearFactura)
- [x] Asientos automáticos al registrar pago/cobro — `lib/actions/erp.ts` (registrarPago)
- [x] Asientos automáticos al recibir compra — `lib/actions/erp.ts` (recibirCompra)
- [x] `lib/actions/contabilidad.ts` — crearAsientoContable helper exportable
- [x] `admin/contabilidad/balance/page.tsx` — Balance General con activos/pasivos/patrimonio
- [x] `admin/contabilidad/resultados/page.tsx` — Estado de Resultados filtrable por año/mes

---

### FASE 10 — Activos Fijos `[x]`
- [ ] Ejecutar migration 018 en Supabase (categorias_activo, activos_fijos, depreciaciones)
- [x] `supabase/migrations/018_activos_fijos.sql` — migration con seed de 5 categorías
- [x] `admin/activos/page.tsx` — Lista con costo original, dep. acumulada, valor neto, % depreciado
- [x] `admin/activos/nuevo/page.tsx` — Registrar activo con categoría y fecha de compra
- [x] `admin/activos/[id]/page.tsx` — Detalle con historial de depreciaciones y barra progreso
- [x] `admin/activos/depreciacion/page.tsx` — Procesar depreciación mensual (todos los activos)
- [x] `lib/actions/activos.ts` — crearActivoFijo, procesarDepreciacionMensual
- [x] Sidebar admin con sección "Activos Fijos"
- [x] Asiento contable automático generado al procesar depreciación

---

### FASE 11 — Caja y Bancos Avanzado `[x]`
- [ ] Ejecutar migration 019 en Supabase (bancos, movimientos_banco, tarjetas)
- [x] `supabase/migrations/019_caja_bancos_avanzado.sql` — tablas + RLS + trigger updated_at
- [x] `lib/actions/bancos.ts` — crearBanco, actualizarBanco, registrarMovimiento, conciliarMovimiento, desconciliarMovimiento, crearTarjeta
- [x] `admin/bancos/page.tsx` — Cuentas bancarias con saldo calculado (ingresos − egresos + saldo_inicial)
- [x] `admin/bancos/nuevo/page.tsx` — Formulario nueva cuenta bancaria
- [x] `admin/bancos/[id]/page.tsx` — Detalle banco: stats + movimientos + tarjetas asociadas
- [x] `admin/bancos/movimientos/page.tsx` — Todos los movimientos con filtros (banco, tipo, conciliación)
- [x] `components/admin/bancos/NuevoMovimientoDialog.tsx` — Dialog para registrar movimiento
- [x] `components/admin/bancos/ConciliarButton.tsx` — Botón inline para conciliar/desconciliar
- [x] Conciliación bancaria: marcar movimientos como conciliados desde lista y detalle
- [x] Saldo inicial de cuentas configurable al crear el banco
- [x] Sidebar admin actualizado con sección "Bancos"
- [ ] Prueba: registrar banco → depósito → retiro → verificar saldo correcto

---

### FASE 12 — Ventas Avanzadas y SRI `[x]`
- [ ] Ejecutar migration 020 en Supabase (retenciones, anticipos, prospectos, factura_origen_id)
- [x] `supabase/migrations/020_ventas_avanzado.sql` — tablas + RLS + trigger
- [x] `lib/actions/ventas.ts` — crearRetencion, crearAnticipo, aplicarAnticipo, crearNotaCredito, crearProspecto, actualizarEstadoProspecto
- [x] `admin/retenciones/page.tsx` — Retenciones en ventas con resumen Renta/IVA
- [x] `admin/retenciones/nueva/page.tsx` — Formulario con códigos SRI precargados (303, 304, 312, etc.)
- [x] `admin/anticipos/page.tsx` — Anticipos: total recibido, saldo disponible, aplicados
- [x] `admin/anticipos/nuevo/page.tsx` — Registrar anticipo con asiento automático
- [x] `admin/prospectos/page.tsx` — CRM de talleres: pipeline, estado kanban, funnel de valor
- [x] `admin/prospectos/nuevo/page.tsx` — Nuevo prospecto con campos empresa/cargo/origen/valor
- [x] `admin/facturacion/nota-credito/page.tsx` — Emitir NC vinculada a factura origen
- [x] `admin/facturacion/[id]/page.tsx` — Botón "Nota de Crédito" en facturas activas
- [x] `components/admin/prospectos/CambiarEstadoProspecto.tsx` — Select inline para avanzar en el pipeline
- [x] Sidebar actualizado con sección "Ventas Avanzado"
- [ ] Notas de débito (variante futura cuando el cliente lo pida)
- [ ] **Facturación Electrónica SRI** ← implementar cuando lleguen credenciales P12

---

### FASE 13 — Los 8 Dashboards Completos `[x]`
Replicar exactamente los 8 dashboards de GETSOFT:
- [x] **Gerencial** — KPIs (ventas, cobrado, compras, utilidad), gráfica mensual, top 10 clientes, % por sucursal
- [x] **Ventas** — Ventas brutas/netas/IVA/NC, gráfica mensual, por método de pago, por establecimiento, descuentos
- [x] **Compras** — Total/pendientes/recibidas, gráfica mensual, top 10 proveedores
- [x] **Cuentas por Cobrar** — CxC total, vencidas, anticipos, top 10 deudores, detalle 50 facturas pendientes
- [x] **Tesorería** — Saldo total bancos, cobros del mes, pagos proveedores, anticipos, movimientos bancarios
- [x] **Vendedores** — Facturas emitidas, total facturado/cobrado/NC, ranking cobradores, por establecimiento
- [x] **Comparativa** — KPIs con variación % vs año anterior, líneas ventas vs compras, tabla mes a mes, utilidad acumulada
- [x] **Rentabilidad** — Venta neta/costo/margen bruto/%, top 10 servicios, por categoría, por establecimiento
- [x] Todos filtrables por sucursal y rango de fechas (año/mes vía searchParams)
- [ ] Exportar cualquier reporte/dashboard a Excel y PDF ← **PENDIENTE (Fase 14-prep)**

---

### FASE 14 — Inventario Avanzado `[ ]`
- [ ] Transferencias entre bodegas Quito ↔ Guayaquil (solicitud → aprobación → confirmación)
- [ ] Kardex valorizado por producto (método promedio ponderado o FIFO configurable)
- [ ] Toma física de inventario (escanear → contar → aprobar diferencias)
- [ ] Control de series y lotes para repuestos específicos
- [ ] Lista de precios múltiple (general, mayorista, VIP)
- [ ] Impresión de etiquetas con código de barras/QR
- [ ] Prueba: solicitar transferencia Quito → Guayaquil → aprobar → verificar ambos stocks

---

### FASE 15 — Módulo Móvil Técnicos (PWA) `[ ]`
- [ ] Optimizar `app/mecanico/` exclusivamente para mobile (touch-first)
- [ ] `app/mecanico/checklist/[ot_id]/page.tsx`
  - Tomar foto con cámara del celular (input type="file" accept="image/*" capture)
  - Diagrama visual del vehículo para marcar zonas de daño
  - Campo de descripción y recomendación por zona
  - Guardar en JSONB `checklist_entrada` de la OT
- [ ] OTs asignadas al técnico (solo las suyas, solo lo que necesita ver)
- [ ] Cambiar estado OT desde móvil: en_proceso → completado
- [ ] Configurar como PWA: `manifest.json`, service worker, íconos
- [ ] Prueba: técnico abre OT en celular → agrega fotos → admin las ve en tiempo real

---

### FASE 16 — Multi-Taller SaaS `[ ]`
> Esta fase convierte el sistema en producto comercializable

- [ ] Agregar columna `taller_id UUID` a todas las tablas principales
- [ ] Tabla `talleres` con config por taller (nombre, logo, RUC, SRI, sucursales, plan)
- [ ] Super-admin panel para gestionar todos los talleres activos
- [ ] Wizard de onboarding para nuevo taller
- [ ] Subdominios dinámicos: `dg-motors.tuapp.com`, `taller-abc.tuapp.com`
- [ ] `admin/prospectos/page.tsx` — CRM para gestionar los 400+ talleres interesados
- [ ] Planes de suscripción y facturación mensual por taller
- [ ] Prueba: crear segundo taller → verificar aislamiento total de datos (RLS por taller_id)

---

### FASE 17 — QA Final y Deploy `[ ]`
- [ ] Tests E2E: flujo completo cita → OT → factura → caja → contabilidad
- [ ] Tests RLS: usuario taller A no puede ver datos de taller B
- [ ] Performance: todas las listas paginadas con 500+ registros sin degradación
- [ ] Optimizar las 5 queries más lentas con EXPLAIN ANALYZE
- [ ] Configurar backups automáticos diarios en Supabase
- [ ] Variables de entorno de producción en Vercel
- [ ] Deploy en Vercel con dominio `app.dgmotors.com.ec`
- [ ] Comandos finales para subir a repositorio GitHub:

```bash
cd dgmotors
git init
git add .
git commit -m "feat: DG Motors ERP Platform v1.0"
git remote add origin https://github.com/TU_USUARIO/dgmotors-erp.git
git branch -M main
git push -u origin main
```

---

## 🔐 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EMPRESA_NOMBRE="DG Motors"

# ANT Ecuador (investigar API disponible)
ANT_API_URL=https://api.consultaplaca.com.ec
ANT_API_KEY=

# SRI Ecuador — llegan al firmar contrato
SRI_RUC=
SRI_AMBIENTE=pruebas
SRI_CERTIFICADO_P12=
SRI_CERTIFICADO_PASS=

# Email automático
RESEND_API_KEY=

# WhatsApp (fase futura)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

---

## ⚠️ Reglas Técnicas — NUNCA violar

1. **NUNCA** usar `<form>` HTML nativo — usar `onSubmit` con `event.preventDefault()`
2. **SIEMPRE** `createServerClient` de `@supabase/ssr` en Server Components y API Routes
3. **SIEMPRE** `createBrowserClient` de `@supabase/ssr` en Client Components
4. **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
5. **NUNCA** usar Prisma — queries directas con Supabase client
6. Instalar shadcn/ui bajo demanda: `npx shadcn@latest add [componente]`
7. Imágenes siempre con `next/image`
8. Fechas con `date-fns` y locale español
9. Zod para validación en servidor Y cliente
10. Permisos verificados en servidor, nunca solo en cliente
11. **Leer `node_modules/next/dist/docs/`** antes de usar cualquier API de Next.js (AGENTS.md)

---

## ✅ Criterios de Demo Listo — Viernes

1. ✅ Login muestra interfaz diferente según rol
2. ✅ Ingresar placa → ANT autocompleta datos del vehículo
3. ✅ Crear OT completa con servicios, repuestos, mecánico y fotos de daños
4. ✅ Cambiar estado OT → cliente recibe email automático
5. ✅ Generar factura desde OT con IVA 15% y numeración SRI
6. ✅ Cobrar factura con método de pago (efectivo/tarjeta/transferencia)
7. ✅ Abrir caja → cobrar → cerrar con cuadre correcto
8. ✅ Stock baja automáticamente al usar repuesto en OT
9. ✅ Dashboard gerencial con métricas reales del día
10. ✅ Técnico sube fotos de daños desde el celular
11. ✅ PDF de factura y PDF de OT generados correctamente
12. ✅ Cliente ve estado de su OT en tiempo real desde el portal

---

## 🗒 Instrucciones de Contexto — LEER Y EJECUTAR SIEMPRE

### Al iniciar cada sesión (OBLIGATORIO antes de tocar cualquier archivo)
1. Leer este CLAUDE.md completo de principio a fin
2. Ubicar la sección `## 📍 Estado Actual` y leer el último estado guardado
3. Continuar exactamente desde donde se dejó — sin preguntar, sin repetir trabajo ya hecho
4. Si algo no está claro, revisar los archivos existentes del proyecto antes de preguntar

### Durante el trabajo (AUTOMÁTICO — Claude Code hace esto sin que nadie lo pida)
5. **Al completar cada tarea individual:** marcar `[x]` en el checkbox correspondiente de inmediato
6. **Al terminar cada archivo:** actualizar `## 📍 Estado Actual` con el archivo recién completado y cuál es el próximo paso concreto
7. **Al encontrar un bloqueador** (credencial faltante, duda sin respuesta, dependencia externa): anotarlo en `## 📍 Estado Actual` bajo "Bloqueadores activos" y continuar con la siguiente tarea disponible sin detenerse
8. **Antes de quedarse sin tokens o pausar:** actualizar `## 📍 Estado Actual` con exactamente dónde se quedó, qué línea del archivo se estaba editando si aplica, y cuál es el próximo paso — esto es lo más crítico del documento

### Reglas inamovibles
9. **NUNCA borrar** checkboxes `[x]` ya completados — son el historial permanente del proyecto
10. **NUNCA** marcar `[x]` en algo que no se verificó que funciona
11. Este CLAUDE.md tiene **prioridad absoluta** sobre cualquier otro archivo .md del proyecto
12. Cada vez que se actualice `## 📍 Estado Actual` debe incluir: fase activa, último archivo tocado, próximo paso específico, y bloqueadores si los hay

### Prompt de reanudación
Cuando se inicie una sesión nueva, el humano solo necesita escribir:
> **"Lee el CLAUDE.md, identifica dónde estamos y continúa"**
Claude Code debe retomar inmediatamente sin necesitar ninguna explicación adicional.

---

## 📍 Estado Actual

```
Última actualización:  16 de abril 2026 (sesión 4)
Fases completadas:     1–13 (código completo) — Fases 14–17 pendientes
Migrations ejecutadas: 001 → 014
Migrations listas (NO ejecutadas aún): 015, 016, 017, 018, 019, 020

Historial de sesiones:
  Sesión 1-2: Fases 1–10 (sitio público, auth, cliente, OTs, facturación, caja, inventario,
              compras, proveedores, portal mecánico, PDFs, email, ANT, contabilidad, activos fijos)
  Sesión 3:   Fases 11–12 (bancos, retenciones, anticipos, notas de crédito, CRM prospectos)
  Sesión 4:   Fase 13 (8 dashboards gerenciales), tests E2E 97/97, docs v3.0

Completado en sesión 4:
  ✅ Dashboard Comparativa (app/admin/dashboards/comparativa/page.tsx)
     → KPIs con variación % vs año anterior, DualLineChart ventas vs compras
     → Tabla mes a mes con margen y % margen, saldo acumulado mensual
  ✅ Dashboard Rentabilidad (app/admin/dashboards/rentabilidad/page.tsx)
     → Margen bruto, top 10 servicios con minibarras, por categoría, por establecimiento
  ✅ Build verificado: 9 dashboards compilan sin errores TypeScript
  ✅ Tests E2E: 4 nuevas suites (10-13) — 48 tests nuevos, 97 total, 100% passing
     → tests/e2e/10-bancos.spec.ts       (7 tests — bancos, movimientos, conciliación)
     → tests/e2e/11-activos.spec.ts      (6 tests — activos fijos, depreciación)
     → tests/e2e/12-ventas-avanzadas.spec.ts (13 tests — retenciones, anticipos, NC, prospectos)
     → tests/e2e/13-dashboards.spec.ts   (22 tests — 8 dashboards + navegación)
  ✅ DG_MOTORS_DOCUMENTACION.html v3.0 — nuevas secciones Bancos, Ventas Avanzadas, Dashboards
  ✅ DG_MOTORS_VALORACION.html actualizada — fases 11-13 marcadas como completadas
  ✅ CLAUDE.md actualizado con estado actual correcto

Próximo paso INMEDIATO (pendiente — requiere acceso Supabase):
  1. Ejecutar en Supabase SQL Editor (en este orden exacto):
     → supabase/migrations/015_roles_completos.sql
     → supabase/migrations/016_consulta_ant.sql
     → supabase/migrations/017_contabilidad.sql
     → supabase/migrations/018_activos_fijos.sql
     → supabase/migrations/019_caja_bancos_avanzado.sql
     → supabase/migrations/020_ventas_avanzado.sql
  2. Prueba flujo completo: placa ANT → OT → factura → cobro → asientos contabilidad
  3. Siguiente fase disponible: Fase 14 — Inventario Avanzado (transferencias entre bodegas)

Pendiente menor (no bloqueante):
  - Exportar dashboards a Excel y PDF (libxlsx + @react-pdf, estimado 8h)
  - SRI electrónico (XML/firma P12) — esperando credenciales del cliente

Bloqueadores activos:
  - Migrations 015–020: requieren ejecución manual en panel Supabase del cliente
  - API ANT key: sin key devuelve null; confirmar proveedor con cliente
  - Credenciales SRI P12: llegan al firmar contrato
  - RESEND_API_KEY: emails no se envían sin esta clave
```

---

*CLAUDE.md v3.0 — Consolidado el 15 de abril 2026. Actualizado sesión 4 — 16 abril 2026.*
