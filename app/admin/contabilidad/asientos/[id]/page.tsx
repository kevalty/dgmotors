import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { contabilizarAsiento, anularAsiento } from "@/lib/actions/contabilidad";

export default async function AsientoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin","contador","gerente"].includes(perfil.rol)) {
    redirect("/admin/dashboard");
  }

  const [{ data: asiento }, { data: lineas }] = await Promise.all([
    supabase
      .from("asientos_contables")
      .select(`*, perfiles!asientos_contables_usuario_id_fkey(nombre, apellido)`)
      .eq("id", id)
      .single(),
    supabase
      .from("asiento_lineas")
      .select(`*, plan_cuentas(codigo, nombre), centros_costos(codigo, nombre)`)
      .eq("asiento_id", id)
      .order("id"),
  ]);

  if (!asiento) notFound();

  const totalDebe  = (lineas || []).reduce((s, l) => s + Number(l.debe  || 0), 0);
  const totalHaber = (lineas || []).reduce((s, l) => s + Number(l.haber || 0), 0);
  const cuadrado   = Math.abs(totalDebe - totalHaber) < 0.01;

  const fmt = (n: number) => `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/contabilidad/asientos">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Asiento #{String(asiento.numero).padStart(6,"0")}
          </h1>
          <p className="text-sm text-muted-foreground">{asiento.descripcion}</p>
        </div>
        {/* Acciones solo para contador/admin y asiento en borrador */}
        {["admin","contador"].includes(perfil.rol) && asiento.estado === "borrador" && (
          <div className="flex gap-2">
            <form action={contabilizarAsiento.bind(null, id)}>
              <Button size="sm" className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" />Contabilizar
              </Button>
            </form>
            <form action={anularAsiento.bind(null, id)}>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <XCircle className="w-4 h-4" />Anular
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="text-sm font-medium">
              {format(new Date(asiento.fecha), "dd 'de' MMMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Tipo / Módulo</p>
            <p className="text-sm font-medium capitalize">
              {asiento.tipo}{asiento.modulo ? ` · ${asiento.modulo}` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-1.5">
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge className={
              asiento.estado === "contabilizado" ? "bg-green-100 text-green-700" :
              asiento.estado === "anulado"       ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }>
              {asiento.estado.charAt(0).toUpperCase() + asiento.estado.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Líneas del asiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Líneas del Asiento</span>
            {cuadrado
              ? <span className="text-xs text-green-600 font-normal flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Cuadrado</span>
              : <span className="text-xs text-destructive font-normal">⚠ No cuadrado</span>
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-y">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Cuenta</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">C. Costo</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Débito</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(lineas || []).map(l => {
                const cuenta = (l as any).plan_cuentas;
                const cc     = (l as any).centros_costos;
                return (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <p className="font-mono text-xs text-muted-foreground">{cuenta?.codigo}</p>
                      <p className="text-xs">{cuenta?.nombre}</p>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{l.descripcion || "—"}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{cc?.codigo || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {Number(l.debe) > 0 ? fmt(Number(l.debe)) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {Number(l.haber) > 0 ? fmt(Number(l.haber)) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-right">TOTALES</td>
                <td className="px-4 py-2 text-right font-mono text-xs font-bold">{fmt(totalDebe)}</td>
                <td className="px-4 py-2 text-right font-mono text-xs font-bold">{fmt(totalHaber)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
