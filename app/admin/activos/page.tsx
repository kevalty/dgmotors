import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const ESTADO_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  activo:        { label: "Activo",        variant: "default" },
  depreciado:    { label: "Depreciado",    variant: "secondary" },
  dado_de_baja:  { label: "Dado de Baja",  variant: "destructive" },
  vendido:       { label: "Vendido",       variant: "outline" },
};

export default async function ActivosFijosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!["admin","contador","gerente"].includes(perfil?.rol ?? "")) redirect("/admin/dashboard");

  const { data: activos } = await supabase
    .from("activos_fijos")
    .select(`
      id, codigo, nombre, fecha_compra, costo_original,
      valor_residual, dep_acumulada, sucursal, estado,
      categorias_activo(nombre, vida_util_anios, metodo_dep)
    `)
    .order("codigo");

  const totalOriginal = (activos || []).reduce((s, a) => s + (a.costo_original || 0), 0);
  const totalDepAcu   = (activos || []).reduce((s, a) => s + (a.dep_acumulada || 0), 0);
  const totalNeto     = totalOriginal - totalDepAcu;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activos Fijos</h1>
          <p className="text-muted-foreground text-sm">Control de activos y depreciación</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/activos/depreciacion">
            <Button variant="outline">Procesar Depreciación</Button>
          </Link>
          <Link href="/admin/activos/nuevo">
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Activo</Button>
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costo Original Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{formatCurrency(totalOriginal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depreciación Acumulada</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-red-500">({formatCurrency(totalDepAcu)})</p>
          </CardContent>
        </Card>
        <Card className="border-primary">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Neto en Libros</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalNeto)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      {(!activos || activos.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No hay activos registrados</p>
            <Link href="/admin/activos/nuevo">
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Registrar primer activo</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Código</th>
                <th className="text-left py-3 px-4 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Categoría</th>
                <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Costo</th>
                <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">Dep. Acu.</th>
                <th className="text-right py-3 px-4 font-medium">Valor Neto</th>
                <th className="text-center py-3 px-4 font-medium hidden sm:table-cell">Sucursal</th>
                <th className="text-center py-3 px-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(activos || []).map((a: any) => {
                const valorNeto = a.costo_original - (a.dep_acumulada || 0);
                const pctDep = a.costo_original > 0
                  ? Math.round(((a.dep_acumulada || 0) / a.costo_original) * 100)
                  : 0;
                const est = ESTADO_LABELS[a.estado] ?? { label: a.estado, variant: "outline" as const };
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{a.codigo}</td>
                    <td className="py-3 px-4">
                      <Link href={`/admin/activos/${a.id}`} className="font-medium hover:text-primary transition-colors">
                        {a.nombre}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        Compra: {new Date(a.fecha_compra).toLocaleDateString("es-EC")}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground text-xs">
                      {a.categorias_activo?.nombre ?? "—"}
                      <br />
                      {a.categorias_activo?.vida_util_anios}  años · {a.categorias_activo?.metodo_dep?.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 text-right hidden sm:table-cell">{formatCurrency(a.costo_original)}</td>
                    <td className="py-3 px-4 text-right hidden lg:table-cell text-red-500">
                      ({formatCurrency(a.dep_acumulada || 0)})
                      <div className="text-xs text-muted-foreground">{pctDep}%</div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(valorNeto)}</td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell capitalize text-xs text-muted-foreground">
                      {a.sucursal ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={est.variant}>{est.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
