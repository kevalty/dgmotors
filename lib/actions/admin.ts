"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "admin") throw new Error("No autorizado");
  return { supabase, user };
}

async function checkMecanicoOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || !["admin", "mecanico"].includes(perfil.rol)) throw new Error("No autorizado");
  return { supabase, user, rol: perfil.rol };
}

export type AdminState = { error?: string; success?: string };

export async function actualizarEstadoCita(
  citaId: string,
  estado: string,
  notasAdmin?: string,
  tecnicoId?: string
): Promise<AdminState> {
  try {
    const { supabase } = await checkMecanicoOrAdmin();

    const updatePayload: Record<string, any> = { estado };
    if (notasAdmin !== undefined) updatePayload.notas_admin = notasAdmin;
    if (tecnicoId && tecnicoId !== "ninguno") updatePayload.tecnico_id = tecnicoId;

    const { error } = await supabase
      .from("citas")
      .update(updatePayload)
      .eq("id", citaId);

    if (error) return { error: "Error al actualizar la cita." };

    return { success: "Cita actualizada." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function registrarMantenimiento(
  _prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    const { supabase, user, rol } = await checkMecanicoOrAdmin();

    const vehiculo_id = formData.get("vehiculo_id") as string;
    const tipo = formData.get("tipo") as string;
    const descripcion = formData.get("descripcion") as string;
    const fecha = formData.get("fecha") as string;
    const kilometraje = formData.get("kilometraje") as string;
    const costo = formData.get("costo") as string;
    const proxima_fecha = formData.get("proxima_fecha") as string;
    const proximo_km = formData.get("proximo_km") as string;
    const observaciones = formData.get("observaciones") as string;
    const cita_id = formData.get("cita_id") as string;

    // Registrar cambio de aceite si aplica
    const es_aceite = formData.get("es_aceite") === "true";
    if (es_aceite) {
      await supabase.from("cambios_aceite").insert({
        vehiculo_id,
        fecha,
        kilometraje: parseInt(kilometraje) || null,
        tipo_aceite: formData.get("tipo_aceite") as string || null,
        marca_aceite: formData.get("marca_aceite") as string || null,
        viscosidad: formData.get("viscosidad") as string || null,
        cantidad_litros: parseFloat(formData.get("cantidad_litros") as string) || null,
        proxima_fecha: proxima_fecha || null,
        proximo_km: parseInt(proximo_km) || null,
      });
    }

    const { error } = await supabase.from("mantenimientos").insert({
      vehiculo_id,
      cita_id: cita_id || null,
      tecnico_id: user.id,
      tipo,
      descripcion,
      fecha,
      kilometraje: parseInt(kilometraje) || null,
      costo: parseFloat(costo) || null,
      proxima_fecha: proxima_fecha || null,
      proximo_km: parseInt(proximo_km) || null,
      observaciones: observaciones || null,
    });

    if (error) return { error: "Error al registrar el mantenimiento." };

    redirect(rol === "mecanico" ? "/mecanico/historial" : "/admin/mantenimiento");
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function editarMantenimiento(
  _prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    const { supabase } = await checkMecanicoOrAdmin();

    const id = formData.get("id") as string;
    const vehiculo_id = formData.get("vehiculo_id") as string;
    const tipo = formData.get("tipo") as string;
    const descripcion = formData.get("descripcion") as string;
    const fecha = formData.get("fecha") as string;
    const kilometraje = formData.get("kilometraje") as string;
    const costo = formData.get("costo") as string;
    const proxima_fecha = formData.get("proxima_fecha") as string;
    const proximo_km = formData.get("proximo_km") as string;
    const observaciones = formData.get("observaciones") as string;

    const { error } = await supabase
      .from("mantenimientos")
      .update({
        vehiculo_id,
        tipo,
        descripcion,
        fecha,
        kilometraje: parseInt(kilometraje) || null,
        costo: parseFloat(costo) || null,
        proxima_fecha: proxima_fecha || null,
        proximo_km: parseInt(proximo_km) || null,
        observaciones: observaciones || null,
      })
      .eq("id", id);

    if (error) return { error: "Error al actualizar el mantenimiento." };

    return { success: "Mantenimiento actualizado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function actualizarServicio(
  _prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    const { supabase } = await checkAdmin();
    const id = formData.get("id") as string;
    const nombre = formData.get("nombre") as string;
    const descripcion = formData.get("descripcion") as string;
    const precio_min = parseFloat(formData.get("precio_min") as string);
    const precio_max = parseFloat(formData.get("precio_max") as string);
    const duracion_min = parseInt(formData.get("duracion_min") as string);
    const activo = formData.get("activo") === "true";

    if (id) {
      await supabase.from("servicios").update({ nombre, descripcion, precio_min, precio_max, duracion_min, activo }).eq("id", id);
    } else {
      const categoria_id = formData.get("categoria_id") as string;
      await supabase.from("servicios").insert({ categoria_id, nombre, descripcion, precio_min, precio_max, duracion_min, activo: true });
    }
    return { success: "Servicio guardado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function registrarClienteWalkIn(
  _prevState: AdminState,
  formData: FormData
): Promise<AdminState & { clienteId?: string }> {
  try {
    await checkMecanicoOrAdmin();
    const adminClient = await createAdminClient();

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const telefono = formData.get("telefono") as string;
    const cedula = formData.get("cedula") as string;

    if (!nombre || !apellido) return { error: "Nombre y apellido son obligatorios." };

    // Verificar si ya existe por cédula
    if (cedula) {
      const { data: existente } = await adminClient.from("perfiles").select("id").eq("cedula", cedula).maybeSingle();
      if (existente) return { error: "Ya existe un cliente con esa cédula.", clienteId: existente.id };
    }

    // Crear usuario auth con email generado — no puede hacer login con esto
    const emailGenerado = `walkin_${cedula || Date.now()}@dgmotors.local`;
    const passwordGenerado = Math.random().toString(36).slice(-10) + "Aa1!";

    const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
      email: emailGenerado,
      password: passwordGenerado,
      email_confirm: true,
      user_metadata: { nombre, apellido, telefono: telefono || null },
    });

    if (authError) return { error: `Error al crear cliente: ${authError.message}` };

    await adminClient.from("perfiles").update({
      cedula: cedula || null,
      telefono: telefono || null,
    }).eq("id", newUser.user.id);

    return { success: `Cliente ${nombre} ${apellido} registrado.`, clienteId: newUser.user.id };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function crearMecanico(
  _prevState: AdminState,
  formData: FormData
): Promise<AdminState> {
  try {
    await checkAdmin();
    const adminClient = await createAdminClient();

    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const telefono = formData.get("telefono") as string;
    const cedula = formData.get("cedula") as string;

    if (!nombre || !apellido || !email || !password) {
      return { error: "Nombre, apellido, email y contraseña son obligatorios." };
    }
    if (password.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres." };
    }

    // Crear usuario en auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, telefono: telefono || null },
    });

    if (createError) {
      if (createError.message.includes("already registered") || createError.message.includes("already been registered")) {
        return { error: "Ya existe un usuario con ese email." };
      }
      return { error: `Error al crear usuario: ${createError.message}` };
    }

    // Actualizar perfil con rol mecanico, cédula y teléfono
    await adminClient
      .from("perfiles")
      .update({
        rol: "mecanico",
        cedula: cedula || null,
        telefono: telefono || null,
      })
      .eq("id", newUser.user.id);

    return { success: `Mecánico ${nombre} ${apellido} creado correctamente.` };
  } catch (e: any) {
    return { error: e.message };
  }
}
