import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Pencil } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function MecanicoHistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: trabajos } = await supabase
    .from("mantenimientos")
    .select(
      "id, tipo, descripcion, fecha, kilometraje, costo, proxima_fecha, observaciones, vehiculos(placa, marca, modelo, perfiles(nombre, apellido))"
    )
    .eq("tecnico_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Mi Historial
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {trabajos?.length || 0} trabajos registrados por ti
        </p>
      </div>

      {!trabajos?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mb-3 opacity-30" />
          <p>Aún no has registrado trabajos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trabajos.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {t.tipo.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(t.fecha)}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{t.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(t.vehiculos as any)?.placa} —{" "}
                      {(t.vehiculos as any)?.marca}{" "}
                      {(t.vehiculos as any)?.modelo}
                      {(t.vehiculos as any)?.perfiles?.nombre && (
                        <> · {(t.vehiculos as any).perfiles.nombre} {(t.vehiculos as any).perfiles.apellido}</>
                      )}
                    </p>
                    {t.observaciones && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {t.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    {t.costo != null && (
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(t.costo)}
                      </p>
                    )}
                    {t.kilometraje != null && (
                      <p className="text-xs text-muted-foreground">
                        {t.kilometraje.toLocaleString()} km
                      </p>
                    )}
                    {t.proxima_fecha && (
                      <p className="text-xs text-muted-foreground">
                        Próx: {formatDate(t.proxima_fecha)}
                      </p>
                    )}
                    <Link href={`/admin/mantenimiento/${t.id}/editar`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 mt-1">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
