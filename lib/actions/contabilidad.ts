"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: crear asiento contable automático
// ─────────────────────────────────────────────────────────────────────────────

export interface LineaAsiento {
  cuenta_codigo: string;   // ej: "4.1.01.001"
  descripcion?: string;
  debe: number;
  haber: number;
}

export async function crearAsientoContable(params: {
  fecha: string;           // "YYYY-MM-DD"
  descripcion: string;
  tipo: "manual" | "automatico" | "apertura" | "cierre";
  modulo?: string;         // 'ventas', 'compras', 'caja'
  referencia?: string;
  usuario_id: string;
  lineas: LineaAsiento[];
}): Promise<string | null> {
  try {
    const supabase = await createClient();

    // Buscar período contable abierto para la fecha dada
    const [anio, mesStr] = params.fecha.split("-");
    const mes = parseInt(mesStr);

    const { data: periodo } = await supabase
      .from("periodos_contables")
      .select("id")
      .eq("anio", parseInt(anio))
      .eq("mes", mes)
      .eq("estado", "abierto")
      .maybeSingle();

    // Crear el asiento
    const { data: asiento, error: errAsiento } = await supabase
      .from("asientos_contables")
      .insert({
        fecha: params.fecha,
        descripcion: params.descripcion,
        tipo: params.tipo,
        modulo: params.modulo || null,
        referencia: params.referencia || null,
        periodo_id: periodo?.id || null,
        usuario_id: params.usuario_id,
        estado: "contabilizado",
      })
      .select("id")
      .single();

    if (errAsiento || !asiento) return null;

    // Buscar IDs de cuentas por código
    const codigos = params.lineas.map((l) => l.cuenta_codigo);
    const { data: cuentas } = await supabase
      .from("plan_cuentas")
      .select("id, codigo")
      .in("codigo", codigos);

    const mapCuentas: Record<string, string> = {};
    (cuentas || []).forEach((c) => { mapCuentas[c.codigo] = c.id; });

    // Insertar líneas
    const lineasInsert = params.lineas
      .filter((l) => mapCuentas[l.cuenta_codigo])
      .map((l) => ({
        asiento_id: asiento.id,
        cuenta_id: mapCuentas[l.cuenta_codigo],
        descripcion: l.descripcion || null,
        debe: l.debe,
        haber: l.haber,
      }));

    if (lineasInsert.length > 0) {
      await supabase.from("asiento_lineas").insert(lineasInsert);
    }

    return asiento.id;
  } catch {
    return null;
  }
}

export async function contabilizarAsiento(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador"].includes(perfil?.rol ?? "")) return;

  await supabase
    .from("asientos_contables")
    .update({ estado: "contabilizado" })
    .eq("id", id)
    .eq("estado", "borrador");

  revalidatePath(`/admin/contabilidad/asientos/${id}`);
}

export async function anularAsiento(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador"].includes(perfil?.rol ?? "")) return;

  await supabase
    .from("asientos_contables")
    .update({ estado: "anulado" })
    .eq("id", id);

  revalidatePath(`/admin/contabilidad/asientos/${id}`);
}

export async function cerrarPeriodo(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador"].includes(perfil?.rol ?? "")) return;

  await supabase
    .from("periodos_contables")
    .update({ estado: "cerrado", cerrado_en: new Date().toISOString(), cerrado_por: user.id })
    .eq("id", id)
    .eq("estado", "abierto");

  revalidatePath("/admin/contabilidad/periodos");
}

export async function abrirPeriodo(anio: number, mes: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador"].includes(perfil?.rol ?? "")) return;

  await supabase
    .from("periodos_contables")
    .upsert({ anio, mes, estado: "abierto" }, { onConflict: "anio,mes" });

  revalidatePath("/admin/contabilidad/periodos");
}
