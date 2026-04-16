"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearAsientoContable } from "@/lib/actions/contabilidad";

export type BancosState = { error?: string; success?: string };

// Roles permitidos para gestionar bancos
async function checkBancos() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles").select("rol, nombre").eq("id", user.id).single();
  if (!perfil || !["admin", "contador", "facturadora"].includes(perfil.rol)) {
    throw new Error("No autorizado");
  }
  return { supabase, user, perfil };
}

// ─────────────────────────────────────────────────────────────────────────────
// BANCOS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearBanco(
  _prev: BancosState,
  formData: FormData
): Promise<BancosState> {
  try {
    const { supabase } = await checkBancos();

    const nombre        = formData.get("nombre") as string;
    const numero_cta    = formData.get("numero_cta") as string;
    const tipo_cta      = formData.get("tipo_cta") as string;
    const sucursal      = formData.get("sucursal") as string;
    const saldo_str     = formData.get("saldo_inicial") as string;
    const cuenta_id     = formData.get("cuenta_id") as string;

    if (!nombre || !numero_cta) {
      return { error: "Nombre y número de cuenta son obligatorios." };
    }

    const saldo_inicial = parseFloat(saldo_str) || 0;

    const { data: banco, error } = await supabase
      .from("bancos")
      .insert({
        nombre,
        numero_cta,
        tipo_cta: tipo_cta || null,
        sucursal: sucursal || null,
        saldo_inicial,
        cuenta_id: cuenta_id || null,
        activo: true,
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear banco: " + error.message };

    redirect(`/admin/bancos/${banco.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function actualizarBanco(
  _prev: BancosState,
  formData: FormData
): Promise<BancosState> {
  try {
    const { supabase } = await checkBancos();

    const id         = formData.get("id") as string;
    const nombre     = formData.get("nombre") as string;
    const numero_cta = formData.get("numero_cta") as string;
    const tipo_cta   = formData.get("tipo_cta") as string;
    const sucursal   = formData.get("sucursal") as string;
    const activo     = formData.get("activo") === "true";

    if (!id || !nombre || !numero_cta) {
      return { error: "ID, nombre y número de cuenta son obligatorios." };
    }

    const { error } = await supabase
      .from("bancos")
      .update({ nombre, numero_cta, tipo_cta: tipo_cta || null, sucursal: sucursal || null, activo })
      .eq("id", id);

    if (error) return { error: "Error al actualizar: " + error.message };

    revalidatePath("/admin/bancos");
    revalidatePath(`/admin/bancos/${id}`);
    return { success: "Banco actualizado correctamente." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVIMIENTOS BANCARIOS
// ─────────────────────────────────────────────────────────────────────────────

// Tipos que representan un INGRESO al banco
const TIPOS_INGRESO = ["deposito", "transferencia_entrada", "nota_credito"];
// Tipos que representan un EGRESO del banco
const TIPOS_EGRESO  = ["retiro", "transferencia_salida", "nota_debito"];

export async function registrarMovimiento(
  _prev: BancosState,
  formData: FormData
): Promise<BancosState> {
  try {
    const { supabase, user } = await checkBancos();

    const banco_id    = formData.get("banco_id") as string;
    const fecha       = formData.get("fecha") as string;
    const tipo        = formData.get("tipo") as string;
    const concepto    = formData.get("concepto") as string;
    const monto_str   = formData.get("monto") as string;
    const referencia  = formData.get("referencia") as string;
    const beneficiario = formData.get("beneficiario") as string;
    const generar_asiento = formData.get("generar_asiento") === "true";

    if (!banco_id || !fecha || !tipo || !concepto || !monto_str) {
      return { error: "Banco, fecha, tipo, concepto y monto son obligatorios." };
    }

    const monto = parseFloat(monto_str);
    if (isNaN(monto) || monto <= 0) {
      return { error: "El monto debe ser un número positivo." };
    }

    const { error } = await supabase
      .from("movimientos_banco")
      .insert({
        banco_id,
        fecha,
        tipo,
        concepto,
        monto,
        referencia: referencia || null,
        beneficiario: beneficiario || null,
        conciliado: false,
        usuario_id: user.id,
      });

    if (error) return { error: "Error al registrar movimiento: " + error.message };

    // Asiento contable automático (solo si se solicita)
    if (generar_asiento) {
      const esIngreso = TIPOS_INGRESO.includes(tipo);
      const cuenta_banco = "1.1.01.001"; // Banco Pichincha (genérico)
      const cuenta_contrapartida = esIngreso ? "1.1.02.001" : "2.1.01.001";

      await crearAsientoContable({
        fecha,
        descripcion: `${tipo.replace(/_/g, " ")} — ${concepto}`,
        tipo: "automatico",
        modulo: "bancos",
        referencia: referencia || undefined,
        usuario_id: user.id,
        lineas: esIngreso
          ? [
              { cuenta_codigo: cuenta_banco, descripcion: concepto, debe: monto, haber: 0 },
              { cuenta_codigo: cuenta_contrapartida, descripcion: concepto, debe: 0, haber: monto },
            ]
          : [
              { cuenta_codigo: cuenta_contrapartida, descripcion: concepto, debe: monto, haber: 0 },
              { cuenta_codigo: cuenta_banco, descripcion: concepto, debe: 0, haber: monto },
            ],
      });
    }

    revalidatePath("/admin/bancos");
    revalidatePath(`/admin/bancos/${banco_id}`);
    revalidatePath("/admin/bancos/movimientos");
    return { success: "Movimiento registrado correctamente." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function conciliarMovimiento(
  movimientoId: string
): Promise<BancosState> {
  try {
    const { supabase } = await checkBancos();

    const { error } = await supabase
      .from("movimientos_banco")
      .update({ conciliado: true })
      .eq("id", movimientoId);

    if (error) return { error: "Error al conciliar: " + error.message };

    revalidatePath("/admin/bancos/movimientos");
    return { success: "Movimiento marcado como conciliado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function desconciliarMovimiento(
  movimientoId: string
): Promise<BancosState> {
  try {
    const { supabase } = await checkBancos();

    const { error } = await supabase
      .from("movimientos_banco")
      .update({ conciliado: false })
      .eq("id", movimientoId);

    if (error) return { error: "Error: " + error.message };

    revalidatePath("/admin/bancos/movimientos");
    return { success: "Conciliación revertida." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETAS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearTarjeta(
  _prev: BancosState,
  formData: FormData
): Promise<BancosState> {
  try {
    const { supabase } = await checkBancos();

    const nombre   = formData.get("nombre") as string;
    const tipo     = formData.get("tipo") as string;
    const banco_id = formData.get("banco_id") as string;

    if (!nombre || !tipo) {
      return { error: "Nombre y tipo son obligatorios." };
    }

    const { error } = await supabase
      .from("tarjetas")
      .insert({ nombre, tipo, banco_id: banco_id || null, activa: true });

    if (error) return { error: "Error al crear tarjeta: " + error.message };

    revalidatePath("/admin/bancos");
    return { success: "Tarjeta registrada correctamente." };
  } catch (e: any) {
    return { error: e.message };
  }
}
