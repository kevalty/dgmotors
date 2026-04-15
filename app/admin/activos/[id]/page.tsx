import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DetalleActivoPage({
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
  if (!["admin","contador","gerente"].includes(perfil?.rol ?? "")) redirect("/admin/dashboard");

  const { data: activo } = await supabase
    .from("activos_fijos")
    .select(`
      *,
      categorias_activo(nombre, vida_util_anios, metodo_dep)
    `)
    .eq("id", id)
    .single();

  if (!activo) notFound();

  const { data: depreciaciones } = await supabase
    .from("depreciaciones")
    .select("anio, mes, monto, acu_anterior, acu_nuevo, procesado, created_at")
    .eq("activo_id", id)
    .order("anio", { ascending: false })
    .order("mes", { ascending: false });

  const valorNeto = activo.costo_original - (activo.dep_acumulada || 0);
  const pctDep = activo.costo_original > 0
    ? Math.round(((activo.dep_acumulada || 0) / activo.costo_original) * 100)
    : 0;

  const cat = activo.categorias_activo as any;
  const vidaUtilMeses = cat ? cat.vida_util_anios * 12 : null;
  const depMensual = cat
    ? parseFloat(((activo.costo_original - (activo.valor_residual || 0)) / (cat.vida_util_anios * 12)).toFixed(2))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/activos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{activo.nombre}</h1>
          <p className="text-muted-foreground text-sm font-mono">{activo.codigo}</p>
        </div>
        <Badge className="ml-auto" variant={activo.estado === "activo" ? "default" : "secondary"}>
          {activo.estado}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Información del Activo</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Categoría</p>
              <p className="font-medium">{cat?.nombre ?? "Sin categoría"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Fecha de Compra</p>
              <p className="font-medium">{new Date(activo.fecha_compra).toLocaleDateString("es-EC")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Sucursal</p>
              <p className="font-medium capitalize">{activo.sucursal ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ubicación</p>
              <p className="font-medium">{activo.ubicacion ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Proveedor</p>
              <p className="font-medium">{activo.proveedor ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Factura de Compra</p>
              <p className="font-medium">{activo.factura_ref ?? "—"}</p>
            </div>
            {activo.descripcion && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Descripción</p>
                <p className="font-medium">{activo.descripcion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Valores */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Valores</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo original</span>
                <span className="font-medium">{formatCurrency(activo.costo_original)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor residual</span>
                <span>{formatCurrency(activo.valor_residual || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dep. acumulada</span>
                <span className="text-red-500">({formatCurrency(activo.dep_acumulada || 0)})</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold">
                <span>Valor neto</span>
                <span className="text-primary">{formatCurrency(valorNeto)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Depreciación</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="capitalize">{cat?.metodo_dep?.replace("_", " ") ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vida útil</span>
                <span>{cat ? `${cat.vida_util_anios} años (${vidaUtilMeses} meses)` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dep. mensual</span>
                <span>{depMensual !== null ? formatCurrency(depMensual) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">% depreciado</span>
                <span>{pctDep}%</span>
              </div>
              {/* Barra de progreso */}
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(pctDep, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial de depreciaciones */}
      {depreciaciones && depreciaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Depreciaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Período</th>
                  <th className="text-right py-2 px-3 font-medium">Dep. Mensual</th>
                  <th className="text-right py-2 px-3 font-medium">Dep. Acu. Anterior</th>
                  <th className="text-right py-2 px-3 font-medium">Dep. Acu. Nueva</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(depreciaciones || []).map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="py-2 px-3">
                      {new Date(d.anio, d.mes - 1).toLocaleDateString("es-EC", { month: "long", year: "numeric" })}
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(d.monto)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">({formatCurrency(d.acu_anterior)})</td>
                    <td className="py-2 px-3 text-right text-red-500">({formatCurrency(d.acu_nuevo)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
