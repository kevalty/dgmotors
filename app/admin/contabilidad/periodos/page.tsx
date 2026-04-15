import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Lock, Unlock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cerrarPeriodo, abrirPeriodo } from "@/lib/actions/contabilidad";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default async function PeriodosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || !["admin","contador","gerente"].includes(perfil.rol)) {
    redirect("/admin/dashboard");
  }

  const { data: periodos } = await supabase
    .from("periodos_contables")
    .select(`*, perfiles!periodos_contables_cerrado_por_fkey(nombre, apellido)`)
    .order("anio", { ascending: false })
    .order("mes",  { ascending: false });

  const lista = periodos || [];
  const puedeEditar = ["admin","contador"].includes(perfil.rol);

  // Calcular próximo mes para apertura
  const hoy = new Date();
  const siguienteAnio = lista.find(p => p.estado === "abierto") ? hoy.getFullYear() : hoy.getFullYear();
  const siguienteMes  = (hoy.getMonth()) + 1; // mes actual (1-based)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Períodos Contables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión y cierre de períodos mensuales
          </p>
        </div>
        {puedeEditar && (
          <form action={abrirPeriodo.bind(null, siguienteAnio, siguienteMes)}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Unlock className="w-4 h-4" />Abrir {MESES[siguienteMes - 1]} {siguienteAnio}
            </Button>
          </form>
        )}
      </div>

      <div className="grid gap-3">
        {lista.map(p => {
          const cerradoPor = (p as any).perfiles;
          return (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  p.estado === "abierto"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {p.estado === "abierto"
                    ? <Unlock  className="w-4 h-4" />
                    : <Lock    className="w-4 h-4" />
                  }
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {MESES[p.mes - 1]} {p.anio}
                  </p>
                  {p.estado === "cerrado" && p.cerrado_en && (
                    <p className="text-xs text-muted-foreground">
                      Cerrado el {format(new Date(p.cerrado_en), "dd/MM/yyyy HH:mm", { locale: es })}
                      {cerradoPor && ` por ${cerradoPor.nombre} ${cerradoPor.apellido}`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.estado === "abierto"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {p.estado === "abierto" ? "Abierto" : "Cerrado"}
                  </span>

                  {puedeEditar && p.estado === "abierto" && (
                    <form action={cerrarPeriodo.bind(null, p.id)}>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Lock className="w-3 h-3" />Cerrar período
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lista.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No hay períodos registrados.</p>
          <p className="text-xs mt-1">Ejecuta la migration 017 para cargar los períodos iniciales.</p>
        </div>
      )}
    </div>
  );
}
