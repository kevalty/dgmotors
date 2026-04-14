import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default async function CerrarCajaPage() {
  const supabase = await createClient();

  const { data: sesion } = await supabase
    .from("caja_sesiones")
    .select("*, cajas(nombre, sucursal)")
    .eq("estado", "abierta")
    .maybeSingle();

  if (!sesion) redirect("/admin/caja");

  // Calcular totales
  const { data: movimientos } = await supabase
    .from("caja_movimientos")
    .select("tipo, monto")
    .eq("sesion_id", sesion.id);

  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto, metodo")
    .eq("caja_id", (sesion as any).cajas?.id || "");

  const totalIngresos = (movimientos || [])
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  const totalEgresos = (movimientos || [])
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  const totalVentas = totalIngresos - totalEgresos;

  const totalEfectivo = (pagos || [])
    .filter((p) => p.metodo === "efectivo")
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  const totalTarjeta = (pagos || [])
    .filter((p) => ["tarjeta_credito", "tarjeta_debito"].includes(p.metodo))
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  const totalTransferencia = (pagos || [])
    .filter((p) => p.metodo === "transferencia")
    .reduce((acc, p) => acc + (p.monto || 0), 0);

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Cerrar Caja
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {(sesion as any).cajas?.nombre} — Abierta: {formatDateTime(sesion.fecha_apertura)}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumen de la sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto apertura</span>
              <span>{formatCurrency(sesion.monto_apertura)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Total ingresos</span>
              <span>+{formatCurrency(totalIngresos)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>Total egresos</span>
              <span>-{formatCurrency(totalEgresos)}</span>
            </div>
            <div className="border-t pt-2 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Por método de pago
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Efectivo</span>
                <span>{formatCurrency(totalEfectivo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tarjeta</span>
                <span>{formatCurrency(totalTarjeta)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transferencia</span>
                <span>{formatCurrency(totalTransferencia)}</span>
              </div>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total ventas neto</span>
              <span className="text-primary">{formatCurrency(totalVentas)}</span>
            </div>
          </CardContent>
        </Card>

        <form action={async (fd: FormData) => {
          "use server";
          const { createClient: cc } = await import("@/lib/supabase/server");
          const supabaseS = await cc();
          const sesionId = fd.get("sesion_id") as string;
          const montoCierre = parseFloat(fd.get("monto_cierre") as string) || 0;
          const observaciones = fd.get("observaciones") as string;
          const movs = await supabaseS.from("caja_movimientos").select("tipo, monto").eq("sesion_id", sesionId);
          const totalI = (movs.data || []).filter((m: any) => m.tipo === "ingreso").reduce((a: number, m: any) => a + m.monto, 0);
          const totalE = (movs.data || []).filter((m: any) => m.tipo === "egreso").reduce((a: number, m: any) => a + m.monto, 0);
          const sesR = await supabaseS.from("caja_sesiones").select("monto_apertura").eq("id", sesionId).single();
          const diferencia = montoCierre - (sesR.data?.monto_apertura || 0) - totalI;
          await supabaseS.from("caja_sesiones").update({
            fecha_cierre: new Date().toISOString(),
            monto_cierre: montoCierre,
            total_ventas: totalI - totalE,
            diferencia,
            observaciones: observaciones || null,
            estado: "cerrada",
          }).eq("id", sesionId);
          redirect("/admin/caja");
        }}>
          <input type="hidden" name="sesion_id" value={sesion.id} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conteo físico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Efectivo contado en caja *</Label>
                <Input
                  name="monto_cierre"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={(sesion.monto_apertura + totalEfectivo).toFixed(2)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el dinero físico contado al cierre. La diferencia se calculará automáticamente.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  name="observaciones"
                  placeholder="Notas del cierre..."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Confirmar cierre
                </Button>
                <Button type="button" variant="outline" onClick={() => history.back()}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
