"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearAsientoContable } from "@/lib/actions/contabilidad";

export type ActivosState = { error?: string; success?: string };

async function checkContador() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin","contador"].includes(perfil.rol)) throw new Error("No autorizado");
  return { supabase, user };
}

export async function crearActivoFijo(
  _prev: ActivosState,
  formData: FormData
): Promise<ActivosState> {
  try {
    const { supabase } = await checkContador();

    const nombre        = formData.get("nombre") as string;
    const categoria_id  = formData.get("categoria_id") as string;
    const codigo        = formData.get("codigo") as string;
    const fecha_compra  = formData.get("fecha_compra") as string;
    const costo_str     = formData.get("costo_original") as string;
    const residual_str  = formData.get("valor_residual") as string;
    const descripcion   = formData.get("descripcion") as string;
    const ubicacion     = formData.get("ubicacion") as string;
    const sucursal      = formData.get("sucursal") as string;
    const proveedor     = formData.get("proveedor") as string;
    const factura_ref   = formData.get("factura_ref") as string;

    if (!nombre || !fecha_compra || !costo_str || !codigo) {
      return { error: "Nombre, código, fecha de compra y costo son obligatorios." };
    }

    const costo_original = parseFloat(costo_str);
    const valor_residual = parseFloat(residual_str) || 0;

    const { data: activo, error } = await supabase
      .from("activos_fijos")
      .insert({
        nombre,
        codigo,
        categoria_id: categoria_id || null,
        fecha_compra,
        costo_original,
        valor_residual,
        descripcion: descripcion || null,
        ubicacion: ubicacion || null,
        sucursal: sucursal || null,
        proveedor: proveedor || null,
        factura_ref: factura_ref || null,
        estado: "activo",
        dep_acumulada: 0,
      })
      .select("id")
      .single();

    if (error) return { error: "Error al crear activo: " + error.message };

    redirect(`/admin/activos/${activo.id}`);
  } catch (e: any) {
    if (e.message === "NEXT_REDIRECT") throw e;
    return { error: e.message };
  }
}

export async function procesarDepreciacionMensual(
  anio: number,
  mes: number
): Promise<ActivosState> {
  try {
    const { supabase, user } = await checkContador();

    // Verificar que no se haya procesado ya
    const { data: yaProc } = await supabase
      .from("depreciaciones")
      .select("id")
      .eq("anio", anio)
      .eq("mes", mes)
      .eq("procesado", true)
      .limit(1);

    if (yaProc && yaProc.length > 0) {
      return { error: `La depreciación de ${mes}/${anio} ya fue procesada.` };
    }

    // Obtener período
    const { data: periodo } = await supabase
      .from("periodos_contables")
      .select("id, estado")
      .eq("anio", anio)
      .eq("mes", mes)
      .maybeSingle();

    if (periodo?.estado === "cerrado") {
      return { error: "El período contable está cerrado." };
    }

    // Obtener activos activos con su categoría
    const { data: activos } = await supabase
      .from("activos_fijos")
      .select(`
        id, codigo, nombre, costo_original, valor_residual, dep_acumulada,
        fecha_compra,
        categorias_activo(vida_util_anios, metodo_dep,
          cuenta_dep_acu, cuenta_gasto_dep)
      `)
      .eq("estado", "activo");

    if (!activos || activos.length === 0) {
      return { error: "No hay activos activos para depreciar." };
    }

    let totalDepMes = 0;
    const depreciaciones = [];

    for (const a of activos as any[]) {
      const cat = a.categorias_activo;
      if (!cat) continue;

      const vidaUtilMeses = cat.vida_util_anios * 12;
      const depreciable = a.costo_original - (a.valor_residual || 0);
      const dep_mensual = parseFloat((depreciable / vidaUtilMeses).toFixed(2));

      // No depreciar más allá del depreciable
      const depRestante = depreciable - (a.dep_acumulada || 0);
      if (depRestante <= 0) continue;

      const montoMes = Math.min(dep_mensual, depRestante);
      const acuNuevo = (a.dep_acumulada || 0) + montoMes;

      depreciaciones.push({
        activo_id: a.id,
        periodo_id: periodo?.id ?? null,
        anio,
        mes,
        monto: montoMes,
        acu_anterior: a.dep_acumulada || 0,
        acu_nuevo: acuNuevo,
        procesado: true,
      });

      totalDepMes += montoMes;
    }

    if (depreciaciones.length === 0) {
      return { error: "Todos los activos están completamente depreciados." };
    }

    // Insertar registros de depreciación
    const { error: errDep } = await supabase
      .from("depreciaciones")
      .insert(depreciaciones);

    if (errDep) return { error: "Error al registrar depreciaciones: " + errDep.message };

    // Actualizar dep_acumulada de cada activo
    for (const d of depreciaciones) {
      await supabase
        .from("activos_fijos")
        .update({ dep_acumulada: d.acu_nuevo })
        .eq("id", d.activo_id);
    }

    // Asiento contable único por el total del mes
    const fechaDep = `${anio}-${String(mes).padStart(2, "0")}-28`;
    await crearAsientoContable({
      fecha: fechaDep,
      descripcion: `Depreciación mensual — ${mes}/${anio} (${depreciaciones.length} activos)`,
      tipo: "automatico",
      modulo: "activos",
      referencia: `DEP-${anio}-${String(mes).padStart(2, "0")}`,
      usuario_id: user.id,
      lineas: [
        { cuenta_codigo: "5.1.02.003", descripcion: "Depreciación Activos", debe: totalDepMes, haber: 0 },
        { cuenta_codigo: "1.2.01.002", descripcion: "(-) Dep. Acumulada Maquinaria", debe: 0, haber: totalDepMes },
      ],
    });

    revalidatePath("/admin/activos");
    revalidatePath("/admin/activos/depreciacion");
    return { success: `Depreciación procesada: $${totalDepMes.toFixed(2)} en ${depreciaciones.length} activos.` };
  } catch (e: any) {
    return { error: e.message };
  }
}
