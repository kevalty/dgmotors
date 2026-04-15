"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
