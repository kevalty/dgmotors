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

function parseProductoForm(formData: FormData) {
  const nombreRaw = formData.get("nombre") as string;
  const slugRaw = formData.get("slug") as string;
  const imagenUrl = formData.get("imagen_url") as string;

  const raw = {
    nombre: nombreRaw,
    slug: slugRaw || buildSlug(nombreRaw),
    categoria_id: (formData.get("categoria_id") as string) || null,
    descripcion: (formData.get("descripcion") as string) || null,
    marca: (formData.get("marca") as string) || null,
    precio_referencial: formData.get("precio_referencial") as string,
    imagen_url: imagenUrl || null,
    destacado: formData.get("destacado") === "true",
    activo: formData.get("activo") !== "false",
  };

  const compatible_con = (formData.get("compatible_con") as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let variantes: unknown[] = [];
  try {
    const v = formData.get("variantes") as string;
    if (v) variantes = JSON.parse(v);
  } catch {
    // ignore bad JSON
  }

  return { raw, compatible_con, variantes };
}

export async function crearProducto(
  _prevState: ProductoState,
  formData: FormData
): Promise<ProductoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { raw, compatible_con, variantes } = parseProductoForm(formData);

  const parsed = productoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const id = formData.get("id") as string;
  if (!id) return { error: "ID requerido" };

  const { raw, compatible_con, variantes } = parseProductoForm(formData);

  const parsed = productoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("productos")
    .update({
      ...parsed.data,
      compatible_con,
      variantes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe un producto con ese slug." };
    return { error: "Error al actualizar el producto." };
  }

  redirect("/admin/productos");
}

export async function eliminarProducto(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("productos").update({ activo: false }).eq("id", id);
  redirect("/admin/productos");
}
