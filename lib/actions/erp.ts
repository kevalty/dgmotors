"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createElement } from "react";
import { OTStatusEmail } from "@/lib/emails/otStatusEmail";
import { crearAsientoContable } from "@/lib/actions/contabilidad";

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

export type ErpState = { error?: string; success?: string };

// ─────────────────────────────────────────────────────────────────────────────
// ÓRDENES DE TRABAJO
// ─────────────────────────────────────────────────────────────────────────────

export async function crearOrdenTrabajo(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const vehiculo_id = formData.get("vehiculo_id") as string;
    const cliente_id = formData.get("cliente_id") as string;
    const sucursal = formData.get("sucursal") as string;
    const tipo = formData.get("tipo") as string;
    const descripcion = formData.get("descripcion") as string;
    const km_entrada = formData.get("km_entrada") as string;
    const fecha_prometida = formData.get("fecha_prometida") as string;
    const cita_id = formData.get("cita_id") as string;

    if (!vehiculo_id || !cliente_id || !sucursal || !tipo) {
      return { error: "Vehículo, cliente, sucursal y tipo son obligatorios." };
    }

    const { data, error } = await supabase
      .from("ordenes_trabajo")
      .insert({
        vehiculo_id,
        cliente_id,
        sucursal,
        tipo,
        descripcion: descripcion || null,
        km_entrada: km_entrada ? parseInt(km_entrada) : null,
        fecha_prometida: fecha_prometida || null,
        cita_id: cita_id || null,
        estado: "presupuesto",
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear la OT: " + error.message };

    // Registrar historial
    await supabase.from("ot_historial").insert({
      ot_id: data.id,
      estado_new: "presupuesto",
      usuario_id: user.id,
      nota: "OT creada",
    });

    redirect(`/admin/ordenes/${data.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function actualizarEstadoOT(
  otId: string,
  estadoNuevo: string,
  nota?: string
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const { data: ot } = await supabase
      .from("ordenes_trabajo")
      .select(`
        estado, numero, cliente_email,
        perfiles!ordenes_trabajo_cliente_id_fkey(nombre, apellido, id),
        vehiculos(marca, modelo, placa)
      `)
      .eq("id", otId)
      .single();

    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ estado: estadoNuevo })
      .eq("id", otId);

    if (error) return { error: "Error al actualizar estado." };

    await supabase.from("ot_historial").insert({
      ot_id: otId,
      estado_ant: ot?.estado,
      estado_new: estadoNuevo,
      usuario_id: user.id,
      nota: nota || null,
    });

    // Enviar email de notificación si hay API key configurada
    if (process.env.RESEND_API_KEY && ot) {
      const perfil = ot.perfiles as any;
      const vehiculo = ot.vehiculos as any;

      // Obtener email del perfil si no está en la OT
      let emailDestino = ot.cliente_email;
      if (!emailDestino && perfil?.id) {
        const { data: authUser } = await supabase.auth.admin.getUserById(perfil.id);
        emailDestino = authUser?.user?.email || null;
      }

      if (emailDestino) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          await resend.emails.send({
            from: "DG Motors <notificaciones@dgmotors.com.ec>",
            to: emailDestino,
            subject: `OT-${String(ot.numero).padStart(4, "0")} — ${estadoNuevo === "completado" ? "Tu vehículo está listo 🎉" : "Actualización de tu orden de trabajo"}`,
            react: createElement(OTStatusEmail, {
              clienteNombre: `${perfil?.nombre || ""} ${perfil?.apellido || ""}`.trim(),
              otNumero: String(ot.numero).padStart(4, "0"),
              estadoNuevo,
              vehiculo: `${vehiculo?.marca || ""} ${vehiculo?.modelo || ""} — ${vehiculo?.placa || ""}`.trim(),
              nota,
              linkOT: `${appUrl}/cliente/dashboard`,
            }),
          });
        } catch {
          // Email falla silenciosamente — no bloquea la operación
        }
      }
    }

    return { success: "Estado actualizado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST DE RECEPCIÓN
// ─────────────────────────────────────────────────────────────────────────────

export async function guardarChecklistOT(
  otId: string,
  checklist: Record<string, any>
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();
    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ checklist_entrada: checklist })
      .eq("id", otId);
    if (error) return { error: "Error al guardar checklist." };
    return { success: "Checklist guardado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FOTOS DE OT (Supabase Storage)
// ─────────────────────────────────────────────────────────────────────────────

export async function subirFotoOT(
  formData: FormData
): Promise<ErpState & { url?: string }> {
  try {
    const { supabase } = await checkAdmin();

    const file = formData.get("file") as File;
    const otId = formData.get("ot_id") as string;
    const tipo = formData.get("tipo") as "entrada" | "salida";

    if (!file || !otId) return { error: "Archivo y OT son requeridos." };
    if (file.size > 5 * 1024 * 1024) return { error: "Máximo 5 MB por foto." };

    const ext = file.name.split(".").pop() || "jpg";
    const path = `ot/${otId}/${tipo}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("ot-fotos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) return { error: "Error al subir foto: " + uploadError.message };

    const { data: urlData } = supabase.storage.from("ot-fotos").getPublicUrl(path);
    const url = urlData.publicUrl;

    // Actualizar array en la OT
    const campo = tipo === "entrada" ? "fotos_entrada" : "fotos_salida";
    const { data: ot } = await supabase
      .from("ordenes_trabajo")
      .select(campo)
      .eq("id", otId)
      .single();

    const fotosActuales: string[] = (ot as any)?.[campo] || [];
    await supabase
      .from("ordenes_trabajo")
      .update({ [campo]: [...fotosActuales, url] })
      .eq("id", otId);

    return { success: "Foto subida.", url };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function eliminarFotoOT(
  otId: string,
  tipo: "entrada" | "salida",
  url: string
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    // Extraer path del storage desde la URL pública
    const urlObj = new URL(url);
    const path = urlObj.pathname.split("/storage/v1/object/public/ot-fotos/")[1];

    if (path) {
      await supabase.storage.from("ot-fotos").remove([path]);
    }

    // Actualizar array en la OT
    const campo = tipo === "entrada" ? "fotos_entrada" : "fotos_salida";
    const { data: ot } = await supabase
      .from("ordenes_trabajo")
      .select(campo)
      .eq("id", otId)
      .single();

    const fotosActuales: string[] = (ot as any)?.[campo] || [];
    await supabase
      .from("ordenes_trabajo")
      .update({ [campo]: fotosActuales.filter((f) => f !== url) })
      .eq("id", otId);

    return { success: "Foto eliminada." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function agregarLineaOT(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    const ot_id = formData.get("ot_id") as string;
    const tipo = formData.get("tipo") as string;
    const descripcion = formData.get("descripcion") as string;
    const cantidad = parseFloat(formData.get("cantidad") as string) || 1;
    const precio_unitario = parseFloat(formData.get("precio_unitario") as string) || 0;
    const descuento_pct = parseFloat(formData.get("descuento_pct") as string) || 0;
    const repuesto_id = formData.get("repuesto_id") as string;
    const servicio_id = formData.get("servicio_id") as string;
    const mecanico_id = formData.get("mecanico_id") as string;
    const notas = formData.get("notas") as string;

    if (!ot_id || !tipo || !descripcion) {
      return { error: "Tipo y descripción son obligatorios." };
    }

    const { error } = await supabase.from("ot_lineas").insert({
      ot_id,
      tipo,
      descripcion,
      cantidad,
      precio_unitario,
      descuento_pct,
      repuesto_id: repuesto_id || null,
      servicio_id: servicio_id || null,
      mecanico_id: mecanico_id || null,
      notas: notas || null,
    });

    if (error) return { error: "Error al agregar línea: " + error.message };

    // Si es repuesto y OT está en proceso, descontar stock
    if (repuesto_id && tipo === "repuesto") {
      const { data: rep } = await supabase
        .from("repuestos")
        .select("stock_actual")
        .eq("id", repuesto_id)
        .single();

      if (rep) {
        const nuevoStock = (rep.stock_actual || 0) - cantidad;
        await supabase
          .from("repuestos")
          .update({ stock_actual: nuevoStock })
          .eq("id", repuesto_id);

        await supabase.from("inventario_movimientos").insert({
          repuesto_id,
          tipo: "salida",
          cantidad,
          stock_ant: rep.stock_actual,
          stock_new: nuevoStock,
          referencia: `OT-${ot_id.slice(0, 8)}`,
          ot_id,
        });
      }
    }

    return { success: "Línea agregada." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function eliminarLineaOT(lineaId: string): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();
    const { error } = await supabase.from("ot_lineas").delete().eq("id", lineaId);
    if (error) return { error: "Error al eliminar línea." };
    return { success: "Línea eliminada." };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function actualizarDiagnosticoOT(
  otId: string,
  diagnostico: string,
  observaciones?: string
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();
    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ diagnostico, observaciones: observaciones || null })
      .eq("id", otId);
    if (error) return { error: "Error al guardar diagnóstico." };
    return { success: "Diagnóstico guardado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────

export async function crearRepuesto(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    const nombre = formData.get("nombre") as string;
    const codigo = formData.get("codigo") as string;
    const descripcion = formData.get("descripcion") as string;
    const categoria_id = formData.get("categoria_id") as string;
    const unidad = formData.get("unidad") as string;
    const precio_costo = parseFloat(formData.get("precio_costo") as string) || 0;
    const precio_venta = parseFloat(formData.get("precio_venta") as string) || 0;
    const stock_actual = parseFloat(formData.get("stock_actual") as string) || 0;
    const stock_minimo = parseFloat(formData.get("stock_minimo") as string) || 0;
    const ubicacion = formData.get("ubicacion") as string;
    const sucursal = formData.get("sucursal") as string;

    if (!nombre) return { error: "El nombre es obligatorio." };

    const { error } = await supabase.from("repuestos").insert({
      nombre,
      codigo: codigo || null,
      descripcion: descripcion || null,
      categoria_id: categoria_id || null,
      unidad: unidad || "unidad",
      precio_costo,
      precio_venta,
      stock_actual,
      stock_minimo,
      ubicacion: ubicacion || null,
      sucursal: sucursal || "ambos",
    });

    if (error) return { error: "Error al crear repuesto: " + error.message };

    redirect("/admin/inventario");
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function ajustarStock(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const repuesto_id = formData.get("repuesto_id") as string;
    const tipo = formData.get("tipo") as string;
    const cantidad = parseFloat(formData.get("cantidad") as string);
    const notas = formData.get("notas") as string;

    if (!repuesto_id || !cantidad) return { error: "Repuesto y cantidad son obligatorios." };

    const { data: rep } = await supabase
      .from("repuestos")
      .select("stock_actual, nombre")
      .eq("id", repuesto_id)
      .single();

    if (!rep) return { error: "Repuesto no encontrado." };

    let nuevoStock = rep.stock_actual;
    if (tipo === "entrada") nuevoStock += cantidad;
    else if (tipo === "salida") nuevoStock -= cantidad;
    else if (tipo === "ajuste") nuevoStock = cantidad;

    await supabase
      .from("repuestos")
      .update({ stock_actual: nuevoStock })
      .eq("id", repuesto_id);

    await supabase.from("inventario_movimientos").insert({
      repuesto_id,
      tipo,
      cantidad,
      stock_ant: rep.stock_actual,
      stock_new: nuevoStock,
      referencia: "Ajuste manual",
      usuario_id: user.id,
      notas: notas || null,
    });

    return { success: `Stock actualizado a ${nuevoStock}.` };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export async function crearFactura(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    const ot_id = formData.get("ot_id") as string;
    const cliente_id = formData.get("cliente_id") as string;
    const sucursal = formData.get("sucursal") as string;
    const numero = formData.get("numero") as string;
    const tipo = (formData.get("tipo") as string) || "factura";
    const fecha_vence = formData.get("fecha_vence") as string;
    const notas = formData.get("notas") as string;
    const iva_pct = parseFloat(formData.get("iva_pct") as string) || 15;

    if (!cliente_id || !sucursal || !numero) {
      return { error: "Cliente, sucursal y número son obligatorios." };
    }

    // Obtener líneas de la OT para calcular subtotal
    let subtotal = 0;
    let lineasOT: any[] = [];

    if (ot_id) {
      const { data: lineas } = await supabase
        .from("ot_lineas")
        .select("descripcion, cantidad, precio_unitario, descuento_pct, subtotal")
        .eq("ot_id", ot_id);
      lineasOT = lineas || [];
      subtotal = lineasOT.reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0);
    } else {
      subtotal = parseFloat(formData.get("subtotal") as string) || 0;
    }

    const descuento = parseFloat(formData.get("descuento") as string) || 0;
    const subtotal_neto = subtotal - descuento;
    const iva_valor = subtotal_neto * (iva_pct / 100);
    const total = subtotal_neto + iva_valor;

    const { data: factura, error } = await supabase
      .from("facturas")
      .insert({
        numero,
        tipo,
        ot_id: ot_id || null,
        cliente_id,
        sucursal,
        fecha_vence: fecha_vence || null,
        subtotal,
        descuento,
        subtotal_neto,
        iva_pct,
        iva_valor,
        total,
        notas: notas || null,
        estado: "pendiente",
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear factura: " + error.message };

    // Crear líneas de factura desde la OT
    if (lineasOT.length > 0) {
      await supabase.from("factura_lineas").insert(
        lineasOT.map((l: any) => ({
          factura_id: factura.id,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          descuento_pct: l.descuento_pct || 0,
          subtotal: l.subtotal,
          ot_linea_id: l.id,
        }))
      );
    }

    // Marcar OT como facturada
    if (ot_id) {
      await supabase
        .from("ordenes_trabajo")
        .update({ estado: "facturado" })
        .eq("id", ot_id);
    }

    // Asiento contable automático: Venta
    // DEBE: Clientes (CxC)  = total
    // HABER: Ventas Servicios = subtotal_neto
    // HABER: IVA en Ventas   = iva_valor
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const fechaHoy = new Date().toISOString().slice(0, 10);
      await crearAsientoContable({
        fecha: fechaHoy,
        descripcion: `Venta — Factura ${numero}`,
        tipo: "automatico",
        modulo: "ventas",
        referencia: numero,
        usuario_id: u.id,
        lineas: [
          { cuenta_codigo: "1.1.02.001", descripcion: "Clientes", debe: total, haber: 0 },
          { cuenta_codigo: "4.1.01.001", descripcion: "Ventas de Servicios", debe: 0, haber: subtotal_neto },
          { cuenta_codigo: "2.1.02.001", descripcion: "IVA en Ventas", debe: 0, haber: iva_valor },
        ],
      });
    }

    redirect(`/admin/facturacion/${factura.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function registrarPago(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const factura_id = formData.get("factura_id") as string;
    const monto = parseFloat(formData.get("monto") as string);
    const metodo = formData.get("metodo") as string;
    const referencia = formData.get("referencia") as string;
    const notas = formData.get("notas") as string;

    if (!factura_id || !monto || !metodo) {
      return { error: "Factura, monto y método son obligatorios." };
    }

    // Obtener sesión de caja activa
    const { data: sesion } = await supabase
      .from("caja_sesiones")
      .select("id, caja_id")
      .eq("estado", "abierta")
      .maybeSingle();

    const { data: pago, error } = await supabase
      .from("pagos")
      .insert({
        factura_id,
        monto,
        metodo,
        referencia: referencia || null,
        notas: notas || null,
        caja_id: sesion?.caja_id || null,
        usuario_id: user.id,
      })
      .select("id")
      .single();

    if (error) return { error: "Error al registrar pago: " + error.message };

    // Verificar si la factura está pagada completamente
    const { data: factura } = await supabase
      .from("facturas")
      .select("total")
      .eq("id", factura_id)
      .single();

    const { data: pagos } = await supabase
      .from("pagos")
      .select("monto")
      .eq("factura_id", factura_id);

    const totalPagado = (pagos || []).reduce((acc: number, p: any) => acc + p.monto, 0);
    const nuevoEstado =
      totalPagado >= (factura?.total || 0) ? "pagada" : "parcial";

    await supabase
      .from("facturas")
      .update({ estado: nuevoEstado })
      .eq("id", factura_id);

    // Registrar en movimientos de caja si hay sesión activa
    if (sesion) {
      await supabase.from("caja_movimientos").insert({
        sesion_id: sesion.id,
        tipo: "ingreso",
        concepto: `Pago factura — ${metodo}`,
        monto,
        pago_id: pago.id,
        usuario_id: user.id,
      });
    }

    // Asiento contable automático: Cobro
    // DEBE: Caja General = monto
    // HABER: Clientes (CxC) = monto
    const fechaHoy = new Date().toISOString().slice(0, 10);
    await crearAsientoContable({
      fecha: fechaHoy,
      descripcion: `Cobro factura — ${metodo}`,
      tipo: "automatico",
      modulo: "caja",
      referencia: factura_id,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "1.1.01.001", descripcion: "Caja General", debe: monto, haber: 0 },
        { cuenta_codigo: "1.1.02.001", descripcion: "Clientes", debe: 0, haber: monto },
      ],
    });

    return { success: `Pago de $${monto.toFixed(2)} registrado.` };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAJA
// ─────────────────────────────────────────────────────────────────────────────

export async function abrirCaja(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const caja_id = formData.get("caja_id") as string;
    const monto_apertura = parseFloat(formData.get("monto_apertura") as string) || 0;

    // Verificar que no haya sesión abierta para esta caja
    const { data: abierta } = await supabase
      .from("caja_sesiones")
      .select("id")
      .eq("caja_id", caja_id)
      .eq("estado", "abierta")
      .maybeSingle();

    if (abierta) return { error: "Ya hay una sesión abierta para esta caja." };

    const { error } = await supabase.from("caja_sesiones").insert({
      caja_id,
      usuario_id: user.id,
      monto_apertura,
      estado: "abierta",
    });

    if (error) return { error: "Error al abrir caja: " + error.message };

    redirect("/admin/caja");
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function cerrarCaja(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    const sesion_id = formData.get("sesion_id") as string;
    const monto_cierre = parseFloat(formData.get("monto_cierre") as string) || 0;
    const observaciones = formData.get("observaciones") as string;

    // Calcular totales reales desde movimientos
    const { data: movs } = await supabase
      .from("caja_movimientos")
      .select("tipo, monto")
      .eq("sesion_id", sesion_id);

    const total_ingresos = (movs || [])
      .filter((m: any) => m.tipo === "ingreso")
      .reduce((acc: number, m: any) => acc + m.monto, 0);

    const total_egresos = (movs || [])
      .filter((m: any) => m.tipo === "egreso")
      .reduce((acc: number, m: any) => acc + m.monto, 0);

    const total_ventas = total_ingresos - total_egresos;

    // Totales por método de pago
    const { data: pagos } = await supabase
      .from("pagos")
      .select("monto, metodo, caja_sesiones!inner(id)")
      .eq("caja_sesiones.id", sesion_id);

    const total_efectivo = (pagos || [])
      .filter((p: any) => p.metodo === "efectivo")
      .reduce((acc: number, p: any) => acc + p.monto, 0);

    const total_tarjeta = (pagos || [])
      .filter((p: any) => ["tarjeta_credito", "tarjeta_debito"].includes(p.metodo))
      .reduce((acc: number, p: any) => acc + p.monto, 0);

    const total_transferencia = (pagos || [])
      .filter((p: any) => p.metodo === "transferencia")
      .reduce((acc: number, p: any) => acc + p.monto, 0);

    const { data: sesion } = await supabase
      .from("caja_sesiones")
      .select("monto_apertura")
      .eq("id", sesion_id)
      .single();

    const diferencia = monto_cierre - (sesion?.monto_apertura || 0) - total_efectivo;

    const { error } = await supabase
      .from("caja_sesiones")
      .update({
        fecha_cierre: new Date().toISOString(),
        monto_cierre,
        total_efectivo,
        total_tarjeta,
        total_transferencia,
        total_ventas,
        diferencia,
        observaciones: observaciones || null,
        estado: "cerrada",
      })
      .eq("id", sesion_id);

    if (error) return { error: "Error al cerrar caja: " + error.message };

    redirect("/admin/caja");
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function registrarMovimientoCaja(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const sesion_id = formData.get("sesion_id") as string;
    const tipo = formData.get("tipo") as string;
    const concepto = formData.get("concepto") as string;
    const monto = parseFloat(formData.get("monto") as string);

    if (!sesion_id || !tipo || !concepto || !monto) {
      return { error: "Todos los campos son obligatorios." };
    }

    const { error } = await supabase.from("caja_movimientos").insert({
      sesion_id,
      tipo,
      concepto,
      monto,
      usuario_id: user.id,
    });

    if (error) return { error: "Error al registrar movimiento." };
    return { success: "Movimiento registrado." };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVEEDORES Y COMPRAS
// ─────────────────────────────────────────────────────────────────────────────

export async function crearProveedor(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase } = await checkAdmin();

    const nombre = formData.get("nombre") as string;
    const ruc = formData.get("ruc") as string;
    const telefono = formData.get("telefono") as string;
    const email = formData.get("email") as string;
    const direccion = formData.get("direccion") as string;
    const contacto = formData.get("contacto") as string;
    const notas = formData.get("notas") as string;

    if (!nombre) return { error: "El nombre es obligatorio." };

    const { error } = await supabase.from("proveedores").insert({
      nombre,
      ruc: ruc || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      contacto: contacto || null,
      notas: notas || null,
    });

    if (error) return { error: "Error al crear proveedor: " + error.message };

    redirect("/admin/proveedores");
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function crearCompra(
  _prev: ErpState,
  formData: FormData
): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    const proveedor_id = formData.get("proveedor_id") as string;
    const sucursal = formData.get("sucursal") as string;
    const fecha_esperada = formData.get("fecha_esperada") as string;
    const notas = formData.get("notas") as string;

    if (!proveedor_id || !sucursal) {
      return { error: "Proveedor y sucursal son obligatorios." };
    }

    // Generar número de compra
    const { count } = await supabase
      .from("compras")
      .select("*", { count: "exact", head: true });

    const numero = `COMP-${String((count || 0) + 1).padStart(4, "0")}`;

    const { data: compra, error } = await supabase
      .from("compras")
      .insert({
        numero,
        proveedor_id,
        sucursal,
        fecha_esperada: fecha_esperada || null,
        notas: notas || null,
        usuario_id: user.id,
        estado: "pendiente",
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear compra: " + error.message };

    redirect(`/admin/compras/${compra.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function recibirCompra(compraId: string): Promise<ErpState> {
  try {
    const { supabase, user } = await checkAdmin();

    // Obtener líneas de la compra
    const { data: lineas } = await supabase
      .from("compra_lineas")
      .select("repuesto_id, cantidad, precio_unitario")
      .eq("compra_id", compraId);

    if (!lineas || lineas.length === 0) {
      return { error: "La compra no tiene líneas." };
    }

    // Actualizar stock por cada repuesto
    for (const linea of lineas) {
      const { data: rep } = await supabase
        .from("repuestos")
        .select("stock_actual, precio_costo")
        .eq("id", linea.repuesto_id)
        .single();

      if (rep) {
        const nuevoStock = (rep.stock_actual || 0) + linea.cantidad;
        await supabase
          .from("repuestos")
          .update({
            stock_actual: nuevoStock,
            precio_costo: linea.precio_unitario,
          })
          .eq("id", linea.repuesto_id);

        await supabase.from("inventario_movimientos").insert({
          repuesto_id: linea.repuesto_id,
          tipo: "entrada",
          cantidad: linea.cantidad,
          stock_ant: rep.stock_actual,
          stock_new: nuevoStock,
          referencia: `COMP-${compraId.slice(0, 8)}`,
          compra_id: compraId,
          usuario_id: user.id,
        });
      }
    }

    // Marcar compra como recibida
    const { data: compraData } = await supabase
      .from("compras")
      .select("numero, total")
      .eq("id", compraId)
      .single();

    await supabase
      .from("compras")
      .update({ estado: "recibida" })
      .eq("id", compraId);

    // Asiento contable automático: Compra
    // DEBE: Repuestos y Materiales = subtotal
    // HABER: Proveedores (CxP) = total
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const totalCompra = compraData?.total || lineas.reduce(
      (acc: number, l: any) => acc + l.cantidad * l.precio_unitario, 0
    );
    await crearAsientoContable({
      fecha: fechaHoy,
      descripcion: `Compra recibida — ${compraData?.numero || compraId.slice(0, 8)}`,
      tipo: "automatico",
      modulo: "compras",
      referencia: compraData?.numero || compraId,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "1.1.03.001", descripcion: "Repuestos y Materiales", debe: totalCompra, haber: 0 },
        { cuenta_codigo: "2.1.01.001", descripcion: "Proveedores", debe: 0, haber: totalCompra },
      ],
    });

    return { success: "Compra recibida. Stock actualizado." };
  } catch (e: any) {
    return { error: e.message };
  }
}
