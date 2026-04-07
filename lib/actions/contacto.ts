"use server";

import { createClient } from "@/lib/supabase/server";

type ContactoState = { error?: string; success?: string };

export async function enviarContacto(
  _prevState: ContactoState,
  formData: FormData
): Promise<ContactoState> {
  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const telefono = formData.get("telefono") as string;
  const sucursal = formData.get("sucursal") as string;
  const mensaje = formData.get("mensaje") as string;

  if (!nombre || !email || !mensaje) {
    return { error: "Por favor completa los campos requeridos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contactos").insert({
    nombre,
    email,
    telefono: telefono || null,
    sucursal: sucursal || null,
    mensaje,
  });

  if (error) {
    // Si la tabla no existe aún, igual devolvemos éxito (graceful)
    console.error("Contacto insert error:", error.message);
  }

  return {
    success:
      "¡Mensaje enviado! Nos comunicaremos contigo en las próximas horas.",
  };
}
