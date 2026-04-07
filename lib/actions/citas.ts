"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type CitaState = { error?: string; success?: string };

export async function crearCita(
  _prevState: CitaState,
  formData: FormData
): Promise<CitaState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  redirect("/cliente/citas");
}

export async function cancelarCita(citaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("citas")
    .update({ estado: "cancelada" })
    .eq("id", citaId)
    .eq("cliente_id", user.id);

  redirect("/cliente/citas");
}
