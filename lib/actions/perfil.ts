"use server";

import { createClient } from "@/lib/supabase/server";

type PerfilState = { error?: string; success?: string };

export async function actualizarPerfil(
  _prevState: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;
  const telefono = formData.get("telefono") as string;
  const cedula = formData.get("cedula") as string;

  if (!nombre || !apellido) {
    return { error: "Nombre y apellido son requeridos" };
  }

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono?.trim() || null,
      cedula: cedula?.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Esa cédula ya está registrada." };
    }
    return { error: "Error al actualizar el perfil." };
  }

  return { success: "Perfil actualizado correctamente." };
}
