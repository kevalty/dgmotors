import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

async function getSaldosPorTipo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tipos: string[],
  anio?: number,
  mes?: number
) {
  const { data: cuentas } = await supabase
    .from("plan_cuentas")
    .select("id, codigo, nombre, tipo, nivel")
    .in("tipo", tipos)
    .eq("activa", true)
    .eq("permite_mov", true)
    .order("codigo");

  if (!cuentas || cuentas.length === 0) return [];

  let query = supabase
    .from("asiento_lineas")
    .select("cuenta_id, debe, haber, asientos_contables!inner(estado, fecha)")
    .in("cuenta_id", cuentas.map((c) => c.id))
    .eq("asientos_contables.estado", "contabilizado");

  if (anio && mes) {
    const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const fin = new Date(anio, mes, 0).toISOString().slice(0, 10);
    query = query.gte("asientos_contables.fecha", inicio).lte("asientos_contables.fecha", fin);
  } else if (anio) {
    query = query
      .gte("asientos_contables.fecha", `${anio}-01-01`)
      .lte("asientos_contables.fecha", `${anio}-12-31`);
  }

  const { data: lineas } = await query;

  const saldoMap: Record<string, number> = {};
  (lineas || []).forEach((l: any) => {
    if (!saldoMap[l.cuenta_id]) saldoMap[l.cuenta_id] = 0;
    // Para ingresos: haber - debe es positivo. Para gastos/costos: debe - haber
    saldoMap[l.cuenta_id] += l.haber - l.debe;
  });

  return cuentas.map((c) => ({
    ...c,
    saldo: saldoMap[c.id] ?? 0,
  }));
}

export default async function EstadoResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador","gerente"].includes(perfil?.rol ?? "")) redirect("/admin/dashboard");

  const anioActual = new Date().getFullYear();
  const anio = params.anio ? parseInt(params.anio) : anioActual;
  const mes = params.mes ? parseInt(params.mes) : undefined;

  const [ingresos, costos, gastos] = await Promise.all([
    getSaldosPorTipo(supabase, ["ingreso"], anio, mes),
    getSaldosPorTipo(supabase, ["costo"], anio, mes),
    getSaldosPorTipo(supabase, ["gasto"], anio, mes),
  ]);

  const totalIngresos = ingresos.reduce((s, c) => s + c.saldo, 0);
  const totalCostos = costos.reduce((s, c) => s + Math.abs(c.saldo), 0);
  const totalGastos = gastos.reduce((s, c) => s + Math.abs(c.saldo), 0);
  const utilidadBruta = totalIngresos - totalCostos;
  const utilidadNeta = utilidadBruta - totalGastos;

  const periodoLabel = mes
    ? new Date(anio, mes - 1).toLocaleDateString("es-EC", { month: "long", year: "numeric" })
    : `Año ${anio}`;

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estado de Resultados</h1>
          <p className="text-muted-foreground text-sm">Período: {periodoLabel}</p>
        </div>
        <form className="flex gap-2 items-center flex-wrap">
          <select
            name="anio"
            defaultValue={anio}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {[2024, 2025, 2026, 2027].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            name="mes"
            defaultValue={mes ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Todo el año</option>
            {meses.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Filtrar
          </button>
        </form>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="pb-2">
          <CardTitle>Estado de Pérdidas y Ganancias</CardTitle>
          <p className="text-xs text-muted-foreground">Solo asientos contabilizados</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* INGRESOS */}
          <div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="font-bold uppercase text-sm tracking-wide">Ingresos</span>
            </div>
            {ingresos.map((c) => (
              <div key={c.id} className="flex justify-between items-center py-0.5 ml-4 text-sm">
                <span className="text-muted-foreground">{c.codigo} — {c.nombre}</span>
                <span>{formatCurrency(c.saldo)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1 mt-1 font-semibold text-sm">
              <span>Total Ingresos</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(totalIngresos)}</span>
            </div>
          </div>

          {/* COSTOS */}
          <div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="font-bold uppercase text-sm tracking-wide">Costos de Ventas</span>
            </div>
            {costos.map((c) => (
              <div key={c.id} className="flex justify-between items-center py-0.5 ml-4 text-sm">
                <span className="text-muted-foreground">{c.codigo} — {c.nombre}</span>
                <span className="text-red-500">({formatCurrency(Math.abs(c.saldo))})</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1 mt-1 font-semibold text-sm">
              <span>Total Costos</span>
              <span className="text-red-500">({formatCurrency(totalCostos)})</span>
            </div>
          </div>

          {/* UTILIDAD BRUTA */}
          <div className="flex justify-between items-center py-2 px-3 bg-muted rounded-md font-bold">
            <span>Utilidad Bruta</span>
            <span className={utilidadBruta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}>
              {formatCurrency(utilidadBruta)}
            </span>
          </div>

          {/* GASTOS */}
          <div>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="font-bold uppercase text-sm tracking-wide">Gastos Operacionales</span>
            </div>
            {gastos.map((c) => (
              <div key={c.id} className="flex justify-between items-center py-0.5 ml-4 text-sm">
                <span className="text-muted-foreground">{c.codigo} — {c.nombre}</span>
                <span className="text-red-500">({formatCurrency(Math.abs(c.saldo))})</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1 mt-1 font-semibold text-sm">
              <span>Total Gastos</span>
              <span className="text-red-500">({formatCurrency(totalGastos)})</span>
            </div>
          </div>

          {/* UTILIDAD NETA */}
          <div className={`flex justify-between items-center py-3 px-3 rounded-md font-bold text-base border-2 ${
            utilidadNeta >= 0 ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"
          }`}>
            <span>{utilidadNeta >= 0 ? "UTILIDAD NETA" : "PÉRDIDA NETA"}</span>
            <span className={utilidadNeta >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600"}>
              {formatCurrency(Math.abs(utilidadNeta))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
