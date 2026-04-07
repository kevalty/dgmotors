"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email({ error: "Email inválido" }),
  password: z.string().min(6, { error: "Contraseña mínimo 6 caracteres" }),
});

const registroSchema = z.object({
  nombre: z.string().min(2, { error: "Nombre mínimo 2 caracteres" }),
  apellido: z.string().min(2, { error: "Apellido mínimo 2 caracteres" }),
  cedula: z.string().min(6, { error: "Cédula mínimo 6 caracteres" }),
  email: z.email({ error: "Email inválido" }),
  password: z.string().min(6, { error: "Contraseña mínimo 6 caracteres" }),
  telefono: z.string().optional(),
});

export type AuthState = {
  error?: string;
  success?: string;
};

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Credenciales incorrectas. Verifica tu email y contraseña." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Error al iniciar sesión." };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfil?.rol === "admin") {
    redirect("/admin/dashboard");
  }

  if (perfil?.rol === "mecanico") {
    redirect("/mecanico/dashboard");
  }

  redirect("/cliente/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
    cedula: formData.get("cedula") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    telefono: formData.get("telefono") as string,
  };

  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verificar cédula única
  const { data: cedulaExistente } = await supabase
    .from("perfiles")
    .select("id")
    .eq("cedula", parsed.data.cedula)
    .maybeSingle();
  if (cedulaExistente) return { error: "Ya existe una cuenta con esa cédula." };

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        nombre: parsed.data.nombre,
        apellido: parsed.data.apellido,
        telefono: parsed.data.telefono || null,
      },
    },
  });

  // Guardar cédula y teléfono en el perfil (el trigger crea el perfil sin estos)
  if (!error && signUpData.user) {
    await supabase
      .from("perfiles")
      .update({
        cedula: parsed.data.cedula,
        telefono: parsed.data.telefono || null,
      })
      .eq("id", signUpData.user.id);
  }

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("User already registered")) {
      return { error: "Este email ya está registrado." };
    }
    if (error.message.includes("email rate limit") || error.message.includes("over_email_send_rate_limit")) {
      return { error: "Se enviaron demasiados emails. Espera unos minutos e intenta de nuevo." };
    }
    if (error.message.includes("invalid") && error.message.includes("email")) {
      return { error: "El email ingresado no es válido." };
    }
    return { error: `Error: ${error.message}` };
  }

  return {
    success:
      "¡Cuenta creada! Revisa tu email para confirmar tu registro antes de ingresar.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email requerido" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    return { error: "Error al enviar el email. Verifica la dirección." };
  }

  return { success: "Te enviamos un email con instrucciones para resetear tu contraseña." };
}
