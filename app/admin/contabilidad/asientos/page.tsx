import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_BADGE: Record<string, string> = {
  borrador:      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  contabilizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  anulado:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TIPO_LABEL: Record<string, string> = {
  manual:     "Manual",
  automatico: "Automático",
  apertura:   "Apertura",
  cierre:     "Cierre",
};

export default async function AsientosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; tipo?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin","contador","gerente"].includes(perfil.rol)) {
    redirect("/admin/dashboard");
  }

  let query = supabase
    .from("asientos_contables")
    .select(`
      id, numero, fecha, descripcion, tipo, modulo, referencia, estado, created_at,
      perfiles!asientos_contables_usuario_id_fkey(nombre, apellido)
    `)
    .order("numero", { ascending: false })
    .limit(100);

  if (sp.estado) query = query.eq("estado", sp.estado);
  if (sp.tipo)   query = query.eq("tipo",   sp.tipo);

  const { data: asientos } = await query;
  const lista = asientos || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Asientos Contables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{lista.length} asientos</p>
        </div>
        {["admin","contador"].includes(perfil.rol) && (
          <Link href="/admin/contabilidad/asientos/nuevo">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />Nuevo Asiento
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {[
          { label: "Todos",         href: "/admin/contabilidad/asientos" },
          { label: "Borrador",      href: "?estado=borrador" },
          { label: "Contabilizado", href: "?estado=contabilizado" },
          { label: "Manuales",      href: "?tipo=manual" },
          { label: "Automáticos",   href: "?tipo=automatico" },
        ].map(f => (
          <Link key={f.label} href={f.href}>
            <Button variant="outline" size="sm" className="h-7 text-xs">{f.label}</Button>
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Descripción</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Módulo</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lista.map(a => {
              const usuario = (a as any).perfiles;
              return (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {String(a.numero).padStart(6,"0")}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {format(new Date(a.fecha), "dd/MM/yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    <p className="truncate">{a.descripcion}</p>
                    {a.referencia && (
                      <p className="text-xs text-muted-foreground truncate">{a.referencia}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {TIPO_LABEL[a.tipo] || a.tipo}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">
                    {a.modulo || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_BADGE[a.estado] || ""}`}>
                      {a.estado.charAt(0).toUpperCase() + a.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/contabilidad/asientos/${a.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                        <FileText className="w-3.5 h-3.5" />Ver
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {lista.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No hay asientos contables.
          </div>
        )}
      </div>
    </div>
  );
}
