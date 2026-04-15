import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TIPO_COLOR: Record<string, string> = {
  activo:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pasivo:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  patrimonio:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ingreso:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  gasto:       "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  costo:       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default async function PlanCuentasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin","contador","gerente"].includes(perfil.rol)) {
    redirect("/admin/dashboard");
  }

  const { data: cuentas } = await supabase
    .from("plan_cuentas")
    .select("*")
    .order("codigo");

  const lista = cuentas || [];

  // Agrupar en árbol por nivel 1 (primer dígito del código)
  const grupos = lista.filter(c => c.nivel === 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Plan de Cuentas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lista.length} cuentas · Estructura NEC/NIIF Ecuador
          </p>
        </div>
        {["admin","contador"].includes(perfil.rol) && (
          <Link href="/admin/contabilidad/plan-cuentas/nueva">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />Nueva cuenta
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {grupos.map(grupo => {
          const hijos = lista.filter(c => c.codigo.startsWith(grupo.codigo + ".") && c.nivel === 2);
          return (
            <div key={grupo.id} className="border rounded-lg overflow-hidden">
              {/* Cabecera grupo nivel 1 */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 font-semibold text-sm">
                <span className="font-mono text-xs text-muted-foreground w-20">{grupo.codigo}</span>
                <span className="flex-1">{grupo.nombre}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLOR[grupo.tipo]}`}>
                  {grupo.tipo.charAt(0).toUpperCase() + grupo.tipo.slice(1)}
                </span>
              </div>

              {/* Subgrupos nivel 2 */}
              {hijos.map(subgrupo => {
                const nietos = lista.filter(c =>
                  c.codigo.startsWith(subgrupo.codigo + ".") && c.nivel >= 3
                );
                return (
                  <div key={subgrupo.id}>
                    <div className="flex items-center gap-3 px-4 py-2 border-t bg-background text-sm font-medium">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-2" />
                      <span className="font-mono text-xs text-muted-foreground w-16">{subgrupo.codigo}</span>
                      <span className="flex-1">{subgrupo.nombre}</span>
                    </div>

                    {/* Cuentas nivel 3+ */}
                    {nietos.map(cuenta => (
                      <div
                        key={cuenta.id}
                        className="flex items-center gap-3 px-4 py-1.5 border-t text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                        style={{ paddingLeft: `${(cuenta.nivel - 1) * 16 + 16}px` }}
                      >
                        <span className="font-mono text-xs w-28 shrink-0">{cuenta.codigo}</span>
                        <span className="flex-1">{cuenta.nombre}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {cuenta.permite_mov && (
                            <Badge variant="outline" className="text-xs py-0 h-5">Mov.</Badge>
                          )}
                          {!cuenta.activa && (
                            <Badge variant="secondary" className="text-xs py-0 h-5">Inactiva</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {lista.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No hay cuentas contables.</p>
          <p className="text-xs mt-1">Ejecuta la migration 017 en Supabase para cargar el plan de cuentas base.</p>
        </div>
      )}
    </div>
  );
}
