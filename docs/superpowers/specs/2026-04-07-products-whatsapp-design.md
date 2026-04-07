# Products Module + WhatsApp Notifications — Design Spec

**Date:** 2026-04-07  
**Project:** DG Motors — Next.js 16.2.2, TypeScript, Tailwind, shadcn/ui, Supabase  

---

## Overview

Add a product catalog (no e-commerce) and WhatsApp-based notifications to the DG Motors platform. Customers can browse products and request quotes via WhatsApp. Admins get auto-notified via CallMeBot when a new appointment is created.

---

## 1. Database Schema

### New tables (migration `004_productos.sql`)

```sql
-- Product categories
CREATE TABLE categorias_producto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES categorias_producto(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  marca TEXT,
  precio_referencial NUMERIC(10,2),
  imagen_url TEXT,
  imagenes TEXT[] DEFAULT '{}',
  variantes JSONB DEFAULT '[]',
  compatible_con TEXT[] DEFAULT '{}',
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp quote requests (logging only)
CREATE TABLE cotizaciones_wa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  nombre_cliente TEXT,
  telefono_cliente TEXT,
  mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- `categorias_producto` — public SELECT, admin-only INSERT/UPDATE/DELETE
- `productos` — public SELECT where `activo = true`, admin-only full access
- `cotizaciones_wa` — INSERT for authenticated users, admin-only SELECT

---

## 2. Product Catalog (Public)

### `/productos` — Product listing page
- Filter by category (tabs or sidebar)
- Search by name/brand
- Card grid: image, name, brand, reference price (or "Consultar"), quote button
- Featured products section at top (`destacado = true`)

### `/productos/[slug]` — Product detail page
- Full description, images, variants (JSONB rendered as key-value list)
- Compatible vehicles list
- "Solicitar cotización" button → opens WhatsApp with pre-filled message:
  ```
  Hola DG Motors! Me interesa el producto: [nombre] (Ref: [slug]). Quisiera una cotización.
  ```
  Link format: `https://wa.me/593995220931?text=...`

---

## 3. Admin Product Management

### `/admin/productos` — Product list
- Table with: imagen, nombre, categoría, marca, precio, destacado toggle, activo toggle
- Actions: edit, delete (soft delete via `activo = false`)
- "Nuevo producto" button

### `/admin/productos/nuevo` — Create product
- Form fields: nombre, slug (auto-generated from nombre), categoría, descripción, marca, precio_referencial, imagen_url (Supabase Storage upload), variantes (JSON editor or key-value pairs), compatible_con (tag input), destacado, activo

### `/admin/productos/[id]/editar` — Edit product
- Same form pre-populated

### Image Upload
- Supabase Storage bucket: `productos-imagenes` (public)
- Upload via client-side component, store URL in `imagen_url`

---

## 4. WhatsApp Notifications

### CallMeBot — Admin auto-notification
**Trigger:** When a client creates a new cita (appointment)  
**Recipient:** `+593995220931` (admin number, registered with CallMeBot)  
**Message:** 
```
Nueva cita DG Motors:
Cliente: [nombre completo]
Servicio: [servicio]
Fecha: [fecha] [hora]
Vehiculo: [placa] - [marca modelo]
```
**Implementation:** In `lib/actions/citas.ts` → `crearCita()` server action, call CallMeBot after successful DB insert:
```
GET https://api.callmebot.com/whatsapp.php?phone=593995220931&text=MESSAGE&apikey=APIKEY
```
API key stored in `.env.local` as `CALLMEBOT_APIKEY_ADMIN`.

### wa.me — Client confirmation link
After creating a cita, show success page/message with:
```
¡Cita agendada! Recibirás confirmación de DG Motors.
[Botón: Confirmar por WhatsApp] → wa.me link with cita summary
```

### Floating WhatsApp Button (all public pages)
- Fixed bottom-right position
- Green WhatsApp icon (use SVG or text)
- Links to: `https://wa.me/593995220931`
- Added to `app/(public)/layout.tsx`

---

## 5. File Structure

```
app/
  (public)/
    layout.tsx              ← add FloatingWhatsApp component
    productos/
      page.tsx              ← catalog listing
      [slug]/
        page.tsx            ← product detail
  admin/
    productos/
      page.tsx              ← admin list
      nuevo/
        page.tsx            ← create form
      [id]/
        editar/
          page.tsx          ← edit form

components/
  layout/
    FloatingWhatsApp.tsx    ← new
  productos/
    ProductCard.tsx         ← new
    ProductForm.tsx         ← new (admin)

lib/
  actions/
    productos.ts            ← new server actions
    citas.ts                ← add CallMeBot call
  validations/
    producto.ts             ← new Zod schema
  whatsapp.ts               ← new: callmebot + wa.me helpers
```

---

## 6. Environment Variables

```env
CALLMEBOT_APIKEY_ADMIN=<from CallMeBot registration>
NEXT_PUBLIC_WHATSAPP_ADMIN=593995220931
```

---

## 7. Constraints & Notes

- No e-commerce: no cart, no checkout, no payments
- Product prices show as reference only ("Precio referencial: $XX")
- Slug is auto-generated from nombre on create, editable on edit
- CallMeBot requires one-time WhatsApp registration: send `I allow callmebot to send me messages` to `+34 644 50 23 81`
- Image upload is optional; products can have no image
- `variantes` JSONB stores array like `[{"clave": "Tamaño", "valor": "10W-40"}, ...]`
