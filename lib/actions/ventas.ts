"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearAsientoContable } from "@/lib/actions/contabilidad";

export type VentasState = { error?: string; success?: string };

async function checkVentas() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin", "facturadora", "contador"].includes(perfil.rol)) {
    throw new Error("No autorizado");
  }
  return { supabase, user };
}

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin", "gerente"].includes(perfil.rol)) {
    throw new Error("No autorizado");
  }
  return { supabase, user };
}

// ─────────────────────────────────────────────────────────────────────────────
// RETENCIONES
// ─────────────────────────────────────────────────────────────────────────────

export async function crearRetencion(
  _prev: VentasState,
  formData: FormData
): Promise<VentasState> {
  try {
    const { supabase, user } = await checkVentas();

    const factura_id     = formData.get("factura_id") as string;
    const numero_ret     = formData.get("numero_ret") as string;
    const fecha          = formData.get("fecha") as string;
    const tipo           = formData.get("tipo") as string;           // renta | iva
    const codigo_ret     = formData.get("codigo_ret") as string;
    const concepto_ret   = formData.get("concepto_ret") as string;
    const porcentaje_str = formData.get("porcentaje") as string;
    const base_str       = formData.get("base_imponible") as string;
    const autorizacion   = formData.get("autorizacion") as string;

    if (!factura_id || !fecha || !tipo || !porcentaje_str || !base_str) {
      return { error: "Factura, fecha, tipo, porcentaje y base imponible son obligatorios." };
    }

    const porcentaje     = parseFloat(porcentaje_str);
    const base_imponible = parseFloat(base_str);
    const valor          = parseFloat((base_imponible * porcentaje / 100).toFixed(2));

    const { error } = await supabase
      .from("retenciones_venta")
      .insert({
        factura_id,
        numero_ret: numero_ret || null,
        fecha,
        tipo,
        codigo_ret: codigo_ret || null,
        concepto_ret: concepto_ret || null,
        porcentaje,
        base_imponible,
        valor,
        autorizacion: autorizacion || null,
      });

    if (error) return { error: "Error al registrar retención: " + error.message };

    // Asiento contable: Clientes / Retención por Cobrar SRI
    await crearAsientoContable({
      fecha,
      descripcion: `Retención ${tipo === "iva" ? "IVA" : "Renta"} ${porcentaje}% — Cía ${codigo_ret || ""}`,
      tipo: "automatico",
      modulo: "ventas",
      referencia: numero_ret || undefined,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "1.1.02.003", descripcion: "Retención por cobrar SRI", debe: valor, haber: 0 },
        { cuenta_codigo: "1.1.02.001", descripcion: "(-) Clientes", debe: 0, haber: valor },
      ],
    });

    revalidatePath("/admin/retenciones");
    revalidatePath(`/admin/facturacion/${factura_id}`);
    return { success: `Retención registrada: $${valor.toFixed(2)}` };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANTICIPOS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearAnticipo(
  _prev: VentasState,
  formData: FormData
): Promise<VentasState> {
  try {
    const { supabase, user } = await checkVentas();

    const cliente_id  = formData.get("cliente_id") as string;
    const fecha       = formData.get("fecha") as string;
    const monto_str   = formData.get("monto") as string;
    const metodo_pago = formData.get("metodo_pago") as string;
    const referencia  = formData.get("referencia") as string;
    const notas       = formData.get("notas") as string;

    if (!cliente_id || !fecha || !monto_str) {
      return { error: "Cliente, fecha y monto son obligatorios." };
    }

    const monto = parseFloat(monto_str);
    if (isNaN(monto) || monto <= 0) {
      return { error: "El monto debe ser mayor a cero." };
    }

    const { data: anticipo, error } = await supabase
      .from("anticipos_cliente")
      .insert({
        cliente_id,
        fecha,
        monto,
        saldo: monto,
        metodo_pago: metodo_pago || null,
        referencia: referencia || null,
        notas: notas || null,
        aplicado: false,
      })
      .select("id")
      .single();

    if (error) return { error: "Error al registrar anticipo: " + error.message };

    // Asiento: Caja / Anticipos de Clientes
    await crearAsientoContable({
      fecha,
      descripcion: `Anticipo cliente — ${referencia || "Sin referencia"}`,
      tipo: "automatico",
      modulo: "ventas",
      referencia: anticipo.id,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "1.1.01.001", descripcion: "Caja General", debe: monto, haber: 0 },
        { cuenta_codigo: "2.1.03.001", descripcion: "Anticipos de Clientes", debe: 0, haber: monto },
      ],
    });

    revalidatePath("/admin/anticipos");
    return { success: `Anticipo de $${monto.toFixed(2)} registrado.` };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function aplicarAnticipo(
  _prev: VentasState,
  formData: FormData
): Promise<VentasState> {
  try {
    const { supabase, user } = await checkVentas();

    const anticipo_id = formData.get("anticipo_id") as string;
    const factura_id  = formData.get("factura_id") as string;
    const monto_str   = formData.get("monto") as string;

    if (!anticipo_id || !factura_id || !monto_str) {
      return { error: "Anticipo, factura y monto son obligatorios." };
    }

    const monto = parseFloat(monto_str);

    // Verificar saldo disponible
    const { data: anticipo } = await supabase
      .from("anticipos_cliente")
      .select("saldo, monto")
      .eq("id", anticipo_id)
      .single();

    if (!anticipo) return { error: "Anticipo no encontrado." };
    if (monto > Number(anticipo.saldo)) {
      return { error: `Saldo disponible insuficiente: $${Number(anticipo.saldo).toFixed(2)}` };
    }

    // Registrar aplicación
    const { error: errAp } = await supabase
      .from("anticipo_aplicaciones")
      .insert({ anticipo_id, factura_id, monto });

    if (errAp) return { error: "Error: " + errAp.message };

    // Actualizar saldo del anticipo
    const nuevoSaldo = Number(anticipo.saldo) - monto;
    await supabase
      .from("anticipos_cliente")
      .update({ saldo: nuevoSaldo, aplicado: nuevoSaldo === 0 })
      .eq("id", anticipo_id);

    // Asiento: Anticipos Clientes / Cuentas por Cobrar
    const hoy = new Date().toISOString().split("T")[0];
    await crearAsientoContable({
      fecha: hoy,
      descripcion: `Aplicación anticipo a factura`,
      tipo: "automatico",
      modulo: "ventas",
      referencia: factura_id,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "2.1.03.001", descripcion: "Anticipo Aplicado", debe: monto, haber: 0 },
        { cuenta_codigo: "1.1.02.001", descripcion: "(-) Clientes", debe: 0, haber: monto },
      ],
    });

    revalidatePath("/admin/anticipos");
    revalidatePath(`/admin/facturacion/${factura_id}`);
    return { success: `Anticipo de $${monto.toFixed(2)} aplicado a la factura.` };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS DE CRÉDITO
// ─────────────────────────────────────────────────────────────────────────────

export async function crearNotaCredito(
  _prev: VentasState,
  formData: FormData
): Promise<VentasState> {
  try {
    const { supabase, user } = await checkVentas();

    const factura_origen_id = formData.get("factura_origen_id") as string;
    const motivo_nc         = formData.get("motivo_nc") as string;
    const monto_str         = formData.get("monto") as string;

    if (!factura_origen_id || !motivo_nc || !monto_str) {
      return { error: "Factura origen, motivo y monto son obligatorios." };
    }

    const monto = parseFloat(monto_str);
    if (isNaN(monto) || monto <= 0) return { error: "Monto inválido." };

    // Obtener datos de la factura original
    const { data: facturaOrigen } = await supabase
      .from("facturas")
      .select("numero, cliente_id, sucursal, iva_pct, total")
      .eq("id", factura_origen_id)
      .single();

    if (!facturaOrigen) return { error: "Factura origen no encontrada." };
    if (monto > Number(facturaOrigen.total)) {
      return { error: `El monto de la NC no puede superar el total de la factura ($${Number(facturaOrigen.total).toFixed(2)}).` };
    }

    // Generar número de NC
    const { count } = await supabase
      .from("facturas")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "nota_credito");

    const numero = `NC-${String((count || 0) + 1).padStart(6, "0")}`;
    const fechaHoy = new Date().toISOString().split("T")[0];
    const ivaPct = Number(facturaOrigen.iva_pct) || 15;
    const subtotal = parseFloat((monto / (1 + ivaPct / 100)).toFixed(2));
    const iva_valor = parseFloat((monto - subtotal).toFixed(2));

    // Crear la nota de crédito como factura tipo nota_credito
    const { data: nc, error } = await supabase
      .from("facturas")
      .insert({
        numero,
        tipo: "nota_credito",
        cliente_id: facturaOrigen.cliente_id,
        sucursal: facturaOrigen.sucursal,
        fecha_emision: fechaHoy,
        subtotal,
        subtotal_neto: subtotal,
        iva_pct: ivaPct,
        iva_valor,
        total: monto,
        estado: "pagada",
        factura_origen_id,
        motivo_nc,
        descuento: 0,
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear NC: " + error.message };

    // Insertar línea de la NC
    await supabase.from("factura_lineas").insert({
      factura_id: nc.id,
      descripcion: `Nota de Crédito — ${motivo_nc}`,
      cantidad: 1,
      precio_unitario: subtotal,
      subtotal,
      aplica_iva: true,
    });

    // Asiento contable: Ventas / Clientes (reversión)
    await crearAsientoContable({
      fecha: fechaHoy,
      descripcion: `NC ${numero} — ${motivo_nc}`,
      tipo: "automatico",
      modulo: "ventas",
      referencia: numero,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "4.1.01.001", descripcion: "Devolución en Ventas", debe: subtotal, haber: 0 },
        { cuenta_codigo: "2.1.02.001", descripcion: "IVA en Ventas (NC)", debe: iva_valor, haber: 0 },
        { cuenta_codigo: "1.1.02.001", descripcion: "Clientes", debe: 0, haber: monto },
      ],
    });

    revalidatePath("/admin/facturacion");
    redirect(`/admin/facturacion/${nc.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROSPECTOS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearProspecto(
  _prev: VentasState,
  formData: FormData
): Promise<VentasState> {
  try {
    const { supabase, user } = await checkAdmin();

    const nombre    = formData.get("nombre") as string;
    const empresa   = formData.get("empresa") as string;
    const cargo     = formData.get("cargo") as string;
    const telefono  = formData.get("telefono") as string;
    const email     = formData.get("email") as string;
    const ciudad    = formData.get("ciudad") as string;
    const origen    = formData.get("origen") as string;
    const notas     = formData.get("notas") as string;
    const valor_str = formData.get("valor_est") as string;

    if (!nombre) return { error: "El nombre es obligatorio." };

    const { data: p, error } = await supabase
      .from("prospectos")
      .insert({
        nombre,
        empresa: empresa || null,
        cargo: cargo || null,
        telefono: telefono || null,
        email: email || null,
        ciudad: ciudad || null,
        origen: origen || null,
        notas: notas || null,
        valor_est: valor_str ? parseFloat(valor_str) : null,
        vendedor_id: user.id,
        estado: "nuevo",
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear prospecto: " + error.message };

    redirect(`/admin/prospectos`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function actualizarEstadoProspecto(
  prospectoId: string,
  estado: string
): Promise<VentasState> {
  try {
    const { supabase } = await checkAdmin();

    const { error } = await supabase
      .from("prospectos")
      .update({ estado })
      .eq("id", prospectoId);

    if (error) return { error: error.message };

    revalidatePath("/admin/prospectos");
    return { success: "Estado actualizado." };
  } catch (e: any) {
    return { error: e.message };
  }
}
