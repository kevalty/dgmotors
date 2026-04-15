import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CuentaSaldo {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  nivel: number;
  saldo: number;
}

async function getSaldosCuentas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tipos: string[]
): Promise<CuentaSaldo[]> {
  // Obtener todas las cuentas de los tipos pedidos
  const { data: cuentas } = await supabase
    .from("plan_cuentas")
    .select("id, codigo, nombre, tipo, nivel, permite_mov")
    .in("tipo", tipos)
    .eq("activa", true)
    .order("codigo");

  if (!cuentas || cuentas.length === 0) return [];

  // Obtener saldos de las cuentas que permiten movimiento
  const idsMovibles = cuentas
    .filter((c) => c.permite_mov)
    .map((c) => c.id);

  const { data: lineas } = await supabase
    .from("asiento_lineas")
    .select("cuenta_id, debe, haber, asientos_contables!inner(estado, fecha)")
    .in("cuenta_id", idsMovibles)
    .eq("asientos_contables.estado", "contabilizado");

  // Calcular saldo por cuenta: activo/gasto/costo: saldo = debe - haber; pasivo/patrimonio/ingreso: haber - debe
  const saldoMap: Record<string, number> = {};
  (lineas || []).forEach((l: any) => {
    if (!saldoMap[l.cuenta_id]) saldoMap[l.cuenta_id] = 0;
    saldoMap[l.cuenta_id] += l.debe - l.haber;
  });

  return cuentas.map((c) => ({
    ...c,
    saldo: saldoMap[c.id] ?? 0,
  }));
}

export default async function BalanceGeneralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador","gerente"].includes(perfil?.rol ?? "")) redirect("/admin/dashboard");

  const [activos, pasivos, patrimonio] = await Promise.all([
    getSaldosCuentas(supabase, ["activo"]),
    getSaldosCuentas(supabase, ["pasivo"]),
    getSaldosCuentas(supabase, ["patrimonio"]),
  ]);

  const totalActivos = activos.filter((c) => c.nivel >= 4).reduce((s, c) => s + c.saldo, 0);
  const totalPasivos = pasivos.filter((c) => c.nivel >= 4).reduce((s, c) => s + Math.abs(c.saldo), 0);
  const totalPatrimonio = patrimonio.filter((c) => c.nivel >= 4).reduce((s, c) => s + Math.abs(c.saldo), 0);

  const fechaHoy = new Date().toLocaleDateString("es-EC", {
    day: "2-digit", month: "long", year: "numeric",
  });

  function renderGrupo(cuentas: CuentaSaldo[], tipo: "activo" | "pasivo" | "patrimonio") {
    const grupos = cuentas.filter((c) => c.nivel === 1);
    return grupos.map((grupo) => {
      const subgrupos = cuentas.filter(
        (c) => c.nivel === 2 && c.codigo.startsWith(grupo.codigo + ".")
      );
      const totalGrupo = cuentas
        .filter((c) => c.nivel >= 4 && c.codigo.startsWith(grupo.codigo))
        .reduce((s, c) => s + (tipo === "activo" ? c.saldo : Math.abs(c.saldo)), 0);

      return (
        <div key={grupo.id} className="mb-4">
          <div className="flex justify-between items-center py-1 border-b border-border">
            <span className="font-bold uppercase text-sm tracking-wide">{grupo.nombre}</span>
            <span className="font-bold text-sm">{formatCurrency(totalGrupo)}</span>
          </div>
          {subgrupos.map((sg) => {
            const cuentasHoja = cuentas.filter(
              (c) => c.nivel >= 4 && c.codigo.startsWith(sg.codigo + ".")
            );
            const totalSg = cuentasHoja.reduce(
              (s, c) => s + (tipo === "activo" ? c.saldo : Math.abs(c.saldo)), 0
            );
            if (totalSg === 0 && cuentasHoja.length === 0) return null;
            return (
              <div key={sg.id} className="ml-2 mt-1">
                <div className="flex justify-between items-center py-0.5 text-muted-foreground text-sm">
                  <span className="font-medium">{sg.nombre}</span>
                  <span>{formatCurrency(totalSg)}</span>
                </div>
                {cuentasHoja.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-0.5 ml-4 text-xs">
                    <span className="text-muted-foreground">{c.codigo} — {c.nombre}</span>
                    <span>{formatCurrency(tipo === "activo" ? c.saldo : Math.abs(c.saldo))}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Balance General</h1>
        <p className="text-muted-foreground text-sm">Al {fechaHoy} — Solo incluye asientos contabilizados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVOS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ACTIVOS</CardTitle>
          </CardHeader>
          <CardContent>
            {renderGrupo(activos, "activo")}
            <div className="flex justify-between items-center pt-3 border-t-2 border-foreground mt-4">
              <span className="font-bold text-base">TOTAL ACTIVOS</span>
              <span className="font-bold text-base text-primary">{formatCurrency(totalActivos)}</span>
            </div>
          </CardContent>
        </Card>

        {/* PASIVOS + PATRIMONIO */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">PASIVOS</CardTitle>
            </CardHeader>
            <CardContent>
              {renderGrupo(pasivos, "pasivo")}
              <div className="flex justify-between items-center pt-3 border-t-2 border-foreground mt-4">
                <span className="font-bold text-base">TOTAL PASIVOS</span>
                <span className="font-bold text-base">{formatCurrency(totalPasivos)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">PATRIMONIO</CardTitle>
            </CardHeader>
            <CardContent>
              {renderGrupo(patrimonio, "patrimonio")}
              <div className="flex justify-between items-center pt-3 border-t-2 border-foreground mt-4">
                <span className="font-bold text-base">TOTAL PATRIMONIO</span>
                <span className="font-bold text-base">{formatCurrency(totalPatrimonio)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-base">TOTAL PASIVOS + PATRIMONIO</span>
                <span className="font-bold text-base text-primary">
                  {formatCurrency(totalPasivos + totalPatrimonio)}
                </span>
              </div>
              {Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) > 0.01 && (
                <p className="text-yellow-500 text-xs mt-2">
                  ⚠ Diferencia de {formatCurrency(Math.abs(totalActivos - (totalPasivos + totalPatrimonio)))} — revisar asientos pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
