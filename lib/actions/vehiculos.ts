"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { vehiculoSchema } from "@/lib/validations/vehiculo";

type VehiculoState = { error?: string; success?: string };

export async function crearVehiculo(
  _prevState: VehiculoState,
  formData: FormData
): Promise<VehiculoState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const raw = {
    placa: (formData.get("placa") as string)?.toUpperCase(),
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: parseInt(formData.get("anio") as string),
    color: formData.get("color") as string,
    kilometraje: parseInt(formData.get("kilometraje") as string) || 0,
    tipo: formData.get("tipo") as string,
    combustible: formData.get("combustible") as string,
    vin: formData.get("vin") as string,
    notas: formData.get("notas") as string,
  };

  const parsed = vehiculoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("vehiculos").insert({
    ...parsed.data,
    cliente_id: user.id,
    color: parsed.data.color || null,
    tipo: parsed.data.tipo || null,
    combustible: parsed.data.combustible || null,
    vin: parsed.data.vin || null,
    notas: parsed.data.notas || null,
  });

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      return { error: "Ya existe un vehículo con esa placa." };
    }
    return { error: "Error al guardar el vehículo. Intenta nuevamente." };
  }

  redirect("/cliente/vehiculos");
}

export async function eliminarVehiculo(vehiculoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("vehiculos")
    .delete()
    .eq("id", vehiculoId)
    .eq("cliente_id", user.id);

  redirect("/cliente/vehiculos");
}
