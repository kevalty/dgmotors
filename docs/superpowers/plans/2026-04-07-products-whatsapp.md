# Products Module + WhatsApp Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product catalog (browse + WhatsApp quote) and WhatsApp notifications (CallMeBot admin auto-notify + wa.me client link + floating chat button) to DG Motors.

**Architecture:** Products are stored in Supabase with public read access and admin-only writes. WhatsApp integration uses CallMeBot's free API for server-side admin notifications and wa.me links for client-side actions — no third-party SDK needed. A floating button component is added to the public layout.

**Tech Stack:** Next.js 16.2.2 (Server Actions, "use server", useActionState), TypeScript, Tailwind, shadcn/ui, Supabase SSR, Zod v4, CallMeBot free API.

---

## File Map

**Create:**
- `lib/whatsapp.ts` — CallMeBot send + wa.me URL builder
- `lib/validations/producto.ts` — Zod schema for products
- `lib/actions/productos.ts` — Server actions: crearProducto, actualizarProducto, eliminarProducto
- `components/layout/FloatingWhatsApp.tsx` — Fixed bottom-right WhatsApp button
- `app/(public)/productos/page.tsx` — Public product catalog
- `app/(public)/productos/[slug]/page.tsx` — Public product detail
- `app/admin/productos/page.tsx` — Admin product list
- `app/admin/productos/nuevo/page.tsx` — Admin create product form
- `app/admin/productos/[id]/editar/page.tsx` — Admin edit product form

**Modify:**
- `app/(public)/layout.tsx` — Add `<FloatingWhatsApp />` and `<Suspense>`
- `lib/actions/citas.ts` — Call `sendCallMeBot()` after successful cita insert
- `components/layout/SidebarAdmin.tsx` — Add "Productos" nav item
- `.env.local` — Add `CALLMEBOT_APIKEY_ADMIN` and `NEXT_PUBLIC_WHATSAPP_ADMIN`

---

## Task 1: WhatsApp Helper Library

**Files:**
- Create: `lib/whatsapp.ts`

- [ ] **Step 1: Create the WhatsApp helpers file**

```typescript
// lib/whatsapp.ts

/**
 * Sends a WhatsApp message via CallMeBot free API.
 * Requires one-time registration: send "I allow callmebot to send me messages"
 * to +34 644 50 23 81 on WhatsApp before use.
 */
export async function sendCallMeBot(phone: string, message: string, apikey: string): Promise<void> {
  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", message);
  url.searchParams.set("apikey", apikey);

  try {
    await fetch(url.toString(), { method: "GET" });
  } catch {
    // Non-blocking — don't fail the main action if WhatsApp notify fails
    console.error("[CallMeBot] Failed to send WhatsApp notification");
  }
}

/**
 * Builds a wa.me link with a pre-filled message.
 * Phone must be in international format without + (e.g. "593995220931").
 */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 2: Add env variables to .env.local**

Open `d:\Mecanica\dgmotors\.env.local` and append:
```
CALLMEBOT_APIKEY_ADMIN=YOUR_CALLMEBOT_APIKEY
NEXT_PUBLIC_WHATSAPP_ADMIN=593995220931
```
(Replace `YOUR_CALLMEBOT_APIKEY` with the key received after CallMeBot registration.)

---

## Task 2: Zod Validation Schema for Products

**Files:**
- Create: `lib/validations/producto.ts`

- [ ] **Step 1: Create the validation schema**

```typescript
// lib/validations/producto.ts
import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().min(2, { error: "Nombre mínimo 2 caracteres" }),
  slug: z.string().min(2, { error: "Slug requerido" }).regex(/^[a-z0-9-]+$/, { error: "Slug solo letras minúsculas, números y guiones" }),
  categoria_id: z.string().uuid({ error: "Categoría inválida" }).optional().nullable(),
  descripcion: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  precio_referencial: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive({ error: "Precio debe ser positivo" }).nullable().optional()
  ),
  imagen_url: z.string().url({ error: "URL de imagen inválida" }).optional().nullable(),
  destacado: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true),
});

export type ProductoInput = z.infer<typeof productoSchema>;
```

---

## Task 3: SQL Migration — Products Tables

**Files:**
- Create: `supabase/migrations/004_productos.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/004_productos.sql

CREATE TABLE IF NOT EXISTS categorias_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES categorias_producto(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  marca TEXT,
  precio_referencial NUMERIC(10,2),
  imagen_url TEXT,
  variantes JSONB DEFAULT '[]',
  compatible_con TEXT[] DEFAULT '{}',
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "categorias_producto_public_read" ON categorias_producto
  FOR SELECT USING (true);

CREATE POLICY "productos_public_read" ON productos
  FOR SELECT USING (activo = true);

-- Admin full access (checks perfiles.rol)
CREATE POLICY "categorias_producto_admin_all" ON categorias_producto
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "productos_admin_all" ON productos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Seed: product categories
INSERT INTO categorias_producto (nombre, slug, orden) VALUES
  ('Aceites y Lubricantes', 'aceites-lubricantes', 1),
  ('Filtros', 'filtros', 2),
  ('Frenos', 'frenos', 3),
  ('Suspensión', 'suspension', 4),
  ('Electricidad', 'electricidad', 5),
  ('Accesorios', 'accesorios', 6)
ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 2: Execute migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste the content of `004_productos.sql` → Run.

---

## Task 4: Products Server Actions

**Files:**
- Create: `lib/actions/productos.ts`

- [ ] **Step 1: Create the server actions**

```typescript
// lib/actions/productos.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { productoSchema } from "@/lib/validations/producto";

type ProductoState = { error?: string; success?: string };

function buildSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function crearProducto(
  _prevState: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nombreRaw = formData.get("nombre") as string;
  const raw = {
    nombre: nombreRaw,
    slug: (formData.get("slug") as string) || buildSlug(nombreRaw),
    categoria_id: (formData.get("categoria_id") as string) || null,
    descripcion: (formData.get("descripcion") as string) || null,
    marca: (formData.get("marca") as string) || null,
    precio_referencial: formData.get("precio_referencial") as string,
    imagen_url: (formData.get("imagen_url") as string) || null,
    destacado: formData.get("destacado") === "true",
    activo: formData.get("activo") !== "false",
  };

  const parsed = productoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // compatible_con: comma-separated string → array
  const compatible_con = (formData.get("compatible_con") as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // variantes: JSON string
  let variantes: unknown[] = [];
  try {
    const v = formData.get("variantes") as string;
    if (v) variantes = JSON.parse(v);
  } catch { /* ignore bad JSON */ }

  const { error } = await supabase.from("productos").insert({
    ...parsed.data,
    compatible_con,
    variantes,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un producto con ese slug." };
    return { error: "Error al guardar el producto." };
  }

  redirect("/admin/productos");
}

export async function actualizarProducto(
  _prevState: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido" };

  const nombreRaw = formData.get("nombre") as string;
  const raw = {
    nombre: nombreRaw,
    slug: (formData.get("slug") as string) || buildSlug(nombreRaw),
    categoria_id: (formData.get("categoria_id") as string) || null,
    descripcion: (formData.get("descripcion") as string) || null,
    marca: (formData.get("marca") as string) || null,
    precio_referencial: formData.get("precio_referencial") as string,
    imagen_url: (formData.get("imagen_url") as string) || null,
    destacado: formData.get("destacado") === "true",
    activo: formData.get("activo") !== "false",
  };

  const parsed = productoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const compatible_con = (formData.get("compatible_con") as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let variantes: unknown[] = [];
  try {
    const v = formData.get("variantes") as string;
    if (v) variantes = JSON.parse(v);
  } catch { /* ignore */ }

  const { error } = await supabase
    .from("productos")
    .update({ ...parsed.data, compatible_con, variantes, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un producto con ese slug." };
    return { error: "Error al actualizar el producto." };
  }

  redirect("/admin/productos");
}

export async function eliminarProducto(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Soft delete
  await supabase.from("productos").update({ activo: false }).eq("id", id);
  redirect("/admin/productos");
}
```

---

## Task 5: WhatsApp Notification on Cita Creation

**Files:**
- Modify: `lib/actions/citas.ts`

- [ ] **Step 1: Update crearCita to send CallMeBot notification**

Replace `lib/actions/citas.ts` with:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendCallMeBot } from "@/lib/whatsapp";

type CitaState = { error?: string; success?: string };

export async function crearCita(
  _prevState: CitaState,
  formData: FormData
): Promise<CitaState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const vehiculo_id = formData.get("vehiculo_id") as string;
  const servicio_id = formData.get("servicio_id") as string;
  const sucursal = formData.get("sucursal") as string;
  const fecha_hora = formData.get("fecha_hora") as string;
  const notas_cliente = formData.get("notas_cliente") as string;

  if (!vehiculo_id || !sucursal || !fecha_hora) {
    return { error: "Completa todos los campos requeridos." };
  }

  const { error } = await supabase.from("citas").insert({
    cliente_id: user.id,
    vehiculo_id,
    servicio_id: servicio_id || null,
    sucursal,
    fecha_hora: new Date(fecha_hora).toISOString(),
    notas_cliente: notas_cliente || null,
    estado: "pendiente",
  });

  if (error) {
    return { error: "Error al crear la cita. Intenta nuevamente." };
  }

  // Fetch details for the notification message
  const [{ data: perfil }, { data: vehiculo }, { data: servicio }] = await Promise.all([
    supabase.from("perfiles").select("nombre, apellido").eq("id", user.id).single(),
    supabase.from("vehiculos").select("placa, marca, modelo").eq("id", vehiculo_id).single(),
    servicio_id
      ? supabase.from("servicios").select("nombre").eq("id", servicio_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";
  const apikey = process.env.CALLMEBOT_APIKEY_ADMIN;

  if (apikey) {
    const fechaFmt = new Date(fecha_hora).toLocaleString("es-EC", {
      timeZone: "America/Guayaquil",
      dateStyle: "short",
      timeStyle: "short",
    });
    const msg = [
      "🔧 Nueva cita DG Motors",
      `Cliente: ${perfil?.nombre || ""} ${perfil?.apellido || ""}`.trim(),
      `Servicio: ${servicio?.nombre || "Sin especificar"}`,
      `Fecha: ${fechaFmt}`,
      `Sucursal: ${sucursal === "quito" ? "Quito" : "Guayaquil"}`,
      `Vehículo: ${vehiculo?.placa || ""} - ${vehiculo?.marca || ""} ${vehiculo?.modelo || ""}`.trim(),
    ].join("\n");

    await sendCallMeBot(adminPhone, msg, apikey);
  }

  redirect("/cliente/citas");
}

export async function cancelarCita(citaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("citas")
    .update({ estado: "cancelada" })
    .eq("id", citaId)
    .eq("cliente_id", user.id);

  redirect("/cliente/citas");
}
```

---

## Task 6: Floating WhatsApp Button Component

**Files:**
- Create: `components/layout/FloatingWhatsApp.tsx`
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 1: Create the FloatingWhatsApp component**

```tsx
// components/layout/FloatingWhatsApp.tsx
import Link from "next/link";

export function FloatingWhatsApp() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";
  const href = `https://wa.me/${phone}?text=${encodeURIComponent("Hola DG Motors, quisiera más información.")}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] shadow-lg flex items-center justify-center transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </Link>
  );
}
```

- [ ] **Step 2: Update public layout to include the floating button**

```tsx
// app/(public)/layout.tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
```

---

## Task 7: Admin Sidebar — Add Productos Nav Item

**Files:**
- Modify: `components/layout/SidebarAdmin.tsx`

- [ ] **Step 1: Add Package icon import and productos nav item**

In `components/layout/SidebarAdmin.tsx`, add `Package` to the lucide-react import and add it to the `navItems` array:

```typescript
// Change the import line from:
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Settings,
  BarChart3,
  LogOut,
  Car as CarIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// To:
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Settings,
  BarChart3,
  Package,
  LogOut,
  Car as CarIcon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
```

```typescript
// Change navItems array from:
const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/clientes", icon: Users, label: "Clientes" },
  { href: "/admin/vehiculos", icon: Car, label: "Vehículos" },
  { href: "/admin/citas", icon: Calendar, label: "Citas" },
  { href: "/admin/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/admin/servicios", icon: Settings, label: "Servicios" },
  { href: "/admin/reportes", icon: BarChart3, label: "Reportes" },
];

// To:
const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/clientes", icon: Users, label: "Clientes" },
  { href: "/admin/vehiculos", icon: Car, label: "Vehículos" },
  { href: "/admin/citas", icon: Calendar, label: "Citas" },
  { href: "/admin/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/admin/servicios", icon: Settings, label: "Servicios" },
  { href: "/admin/productos", icon: Package, label: "Productos" },
  { href: "/admin/reportes", icon: BarChart3, label: "Reportes" },
];
```

---

## Task 8: Admin Products List Page

**Files:**
- Create: `app/admin/productos/page.tsx`

- [ ] **Step 1: Create the admin products list**

```tsx
// app/admin/productos/page.tsx
import Link from "next/link";
import { Plus, Pencil, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductosPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, slug, marca, precio_referencial, destacado, activo, imagen_url, categorias_producto(nombre)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productos?.length || 0} productos registrados
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {!productos?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mb-3 opacity-30" />
          <p>No hay productos aún</p>
          <Link href="/admin/productos/nuevo" className="mt-3">
            <Button size="sm" variant="outline">Agregar primero</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Precio ref.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id} className={!p.activo ? "opacity-50" : ""}>
                  <TableCell>
                    {p.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagen_url} alt={p.nombre} className="w-9 h-9 object-cover rounded" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.nombre}</div>
                    {p.destacado && (
                      <Badge variant="outline" className="text-xs mt-0.5 border-primary/40 text-primary">Destacado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(p.categorias_producto as any)?.nombre || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.marca || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {p.precio_referencial ? formatCurrency(p.precio_referencial) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.activo ? "secondary" : "outline"} className="text-xs">
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/productos/${p.id}/editar`}>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
```

---

## Task 9: Admin New Product Form

**Files:**
- Create: `app/admin/productos/nuevo/page.tsx`

- [ ] **Step 1: Create the new product form page**

```tsx
// app/admin/productos/nuevo/page.tsx
"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { crearProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const initialState = {};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function NuevoProductoPage() {
  const [state, formAction, isPending] = useActionState(crearProducto, initialState);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categorias_producto")
      .select("id, nombre")
      .order("orden")
      .then(({ data }) => setCategorias(data || []));
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nombre));
  }, [nombre, slugTouched]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/productos">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Nuevo Producto
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="mi-producto"
              />
              <p className="text-xs text-muted-foreground">Se usa en la URL: /productos/{slug || "..."}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select name="categoria_id">
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" name="marca" placeholder="Mobil, Bosch..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" name="descripcion" rows={3} placeholder="Describe el producto..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="precio_referencial">Precio referencial (USD)</Label>
                <Input id="precio_referencial" name="precio_referencial" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imagen_url">URL de imagen</Label>
                <Input id="imagen_url" name="imagen_url" type="url" placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compatible_con">Compatible con (separar con comas)</Label>
              <Input id="compatible_con" name="compatible_con" placeholder="Ford F-150 2018, Toyota Hilux 2020..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destacado</Label>
                <Select name="destacado" defaultValue="false">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select name="activo" defaultValue="true">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/productos" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancelar</Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Crear Producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Task 10: Admin Edit Product Form

**Files:**
- Create: `app/admin/productos/[id]/editar/page.tsx`

- [ ] **Step 1: Create the edit product form page**

```tsx
// app/admin/productos/[id]/editar/page.tsx
"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { actualizarProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { use } from "react";

const initialState = {};

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, formAction, isPending] = useActionState(actualizarProducto, initialState);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("categorias_producto").select("id, nombre").order("orden"),
      supabase.from("productos").select("*").eq("id", id).single(),
    ]).then(([{ data: cats }, { data: prod }]) => {
      setCategorias(cats || []);
      setProducto(prod);
    });
  }, [id]);

  if (!producto) return (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
      Cargando...
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/productos">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Editar Producto
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">{producto.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={producto.id} />

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" defaultValue={producto.nombre} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input id="slug" name="slug" defaultValue={producto.slug} />
              <p className="text-xs text-muted-foreground">URL: /productos/{producto.slug}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select name="categoria_id" defaultValue={producto.categoria_id || ""}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" name="marca" defaultValue={producto.marca || ""} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" name="descripcion" rows={3} defaultValue={producto.descripcion || ""} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="precio_referencial">Precio referencial (USD)</Label>
                <Input id="precio_referencial" name="precio_referencial" type="number" step="0.01" min="0" defaultValue={producto.precio_referencial || ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imagen_url">URL de imagen</Label>
                <Input id="imagen_url" name="imagen_url" type="url" defaultValue={producto.imagen_url || ""} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compatible_con">Compatible con (separar con comas)</Label>
              <Input id="compatible_con" name="compatible_con" defaultValue={(producto.compatible_con || []).join(", ")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destacado</Label>
                <Select name="destacado" defaultValue={producto.destacado ? "true" : "false"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select name="activo" defaultValue={producto.activo ? "true" : "false"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/productos" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancelar</Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Task 11: Public Products Catalog Page

**Files:**
- Create: `app/(public)/productos/page.tsx`

- [ ] **Step 1: Create the public products catalog**

```tsx
// app/(public)/productos/page.tsx
import Link from "next/link";
import { Package, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Productos — DG Motors",
  description: "Catálogo de productos y repuestos para vehículos americanos, Ford y multimarca.",
};

export default async function ProductosPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: destacados }] = await Promise.all([
    supabase
      .from("categorias_producto")
      .select("id, nombre, slug, productos(id, nombre, slug, marca, precio_referencial, imagen_url, destacado)")
      .order("orden"),
    supabase
      .from("productos")
      .select("id, nombre, slug, marca, precio_referencial, imagen_url, categorias_producto(nombre)")
      .eq("activo", true)
      .eq("destacado", true)
      .limit(6),
  ]);

  const whatsappAdmin = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Catálogo de Productos
        </h1>
        <p className="text-muted-foreground">
          Repuestos y accesorios para vehículos americanos, Ford y multimarca.
          Solicita cotización por WhatsApp.
        </p>
      </div>

      {/* Destacados */}
      {destacados && destacados.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            Productos Destacados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {destacados.map((p) => (
              <ProductCard key={p.id} producto={p} whatsappPhone={whatsappAdmin} />
            ))}
          </div>
        </section>
      )}

      {/* Por categoría */}
      <div className="space-y-10">
        {categorias?.map((cat) => {
          const prods = (cat.productos as any[])?.filter((p: any) => p.activo !== false) || [];
          if (!prods.length) return null;
          return (
            <section key={cat.id}>
              <h2 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">{cat.nombre}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {prods.map((p: any) => (
                  <ProductCard key={p.id} producto={p} whatsappPhone={whatsappAdmin} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ producto, whatsappPhone }: { producto: any; whatsappPhone: string }) {
  const quoteMsg = `Hola DG Motors! Me interesa el producto: ${producto.nombre}. Quisiera una cotización.`;
  const quoteHref = waLink(whatsappPhone, quoteMsg);

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/productos/${producto.slug}`}>
        <div className="aspect-square bg-muted overflow-hidden">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <Link href={`/productos/${producto.slug}`}>
          <p className="font-medium text-sm leading-tight hover:text-primary transition-colors line-clamp-2">{producto.nombre}</p>
        </Link>
        {producto.marca && <p className="text-xs text-muted-foreground mt-0.5">{producto.marca}</p>}
        <div className="flex items-center justify-between mt-2 gap-1">
          <span className="text-xs font-medium text-primary">
            {producto.precio_referencial ? `Ref. ${formatCurrency(producto.precio_referencial)}` : "Consultar"}
          </span>
          <Link href={quoteHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-6 text-xs px-2">Cotizar</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Task 12: Public Product Detail Page

**Files:**
- Create: `app/(public)/productos/[slug]/page.tsx`

- [ ] **Step 1: Create the product detail page**

```tsx
// app/(public)/productos/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MessageCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("productos").select("nombre, descripcion").eq("slug", slug).single();
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: `${p.nombre} — DG Motors`,
    description: p.descripcion || `${p.nombre} disponible en DG Motors Ecuador`,
  };
}

export default async function ProductoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: producto } = await supabase
    .from("productos")
    .select("*, categorias_producto(nombre, slug)")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!producto) notFound();

  const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";
  const quoteMsg = `Hola DG Motors! Me interesa el producto: ${producto.nombre} (ref: ${producto.slug}). Quisiera una cotización.`;
  const quoteHref = waLink(whatsappPhone, quoteMsg);

  const variantes: Array<{ clave: string; valor: string }> = producto.variantes || [];
  const compatibleCon: string[] = producto.compatible_con || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/productos" className="hover:text-primary transition-colors">Productos</Link>
        {(producto.categorias_producto as any)?.nombre && (
          <>
            <span>/</span>
            <span>{(producto.categorias_producto as any).nombre}</span>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{producto.nombre}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {(producto.categorias_producto as any)?.nombre && (
            <Badge variant="secondary" className="mb-2 text-xs">{(producto.categorias_producto as any).nombre}</Badge>
          )}
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            {producto.nombre}
          </h1>
          {producto.marca && (
            <p className="text-muted-foreground text-sm mb-3">Marca: {producto.marca}</p>
          )}

          {producto.precio_referencial && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio referencial</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(producto.precio_referencial)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">* Precio sujeto a disponibilidad. Cotizar para precio final.</p>
            </div>
          )}

          {producto.descripcion && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{producto.descripcion}</p>
          )}

          {/* Variantes */}
          {variantes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Especificaciones</p>
              <div className="space-y-1">
                {variantes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-28 shrink-0">{v.clave}:</span>
                    <span className="font-medium">{v.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatible con */}
          {compatibleCon.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Compatible con</p>
              <div className="flex flex-wrap gap-1.5">
                {compatibleCon.map((v, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-1">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href={quoteHref} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2" size="lg">
              <MessageCircle className="w-4 h-4" />
              Solicitar Cotización por WhatsApp
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/productos">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver todos los productos
          </Button>
        </Link>
      </div>
    </div>
  );
}
```

---

## Task 13: Add Productos to Navigation

**Files:**
- Modify: `components/layout/Navbar.tsx`

- [ ] **Step 1: Add Productos link to the navbar**

Read `components/layout/Navbar.tsx` and find the array of nav links (typically `servicios`, `precios`, `sucursales`, etc.). Add `{ href: "/productos", label: "Productos" }` to the list.

The exact edit depends on how Navbar.tsx defines its links — look for the navigation array and add the productos entry.

---

## Post-Implementation Checklist

- [ ] Run migration `004_productos.sql` in Supabase SQL Editor
- [ ] Register CallMeBot: send "I allow callmebot to send me messages" to +34 644 50 23 81 on WhatsApp, then add the received API key to `.env.local` as `CALLMEBOT_APIKEY_ADMIN`
- [ ] Set `NEXT_PUBLIC_WHATSAPP_ADMIN=593995220931` in `.env.local`
- [ ] Run `npm run dev` and verify: `/productos`, `/admin/productos`, floating button, cita creation triggers WhatsApp
- [ ] Create a test product in admin to confirm the full flow
