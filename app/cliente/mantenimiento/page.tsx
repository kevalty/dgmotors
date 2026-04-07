import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Historial de Mantenimiento" };

export default async function MantenimientoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id")
    .eq("cliente_id", user.id);

  const vehiculoIds = (vehiculos || []).map((v) => v.id);

  const { data: mantenimientos } = vehiculoIds.length > 0
    ? await supabase
        .from("mantenimientos")
        .select(`
          id, tipo, descripcion, fecha, kilometraje, costo,
          proxima_fecha, proximo_km, observaciones,
          vehiculos(placa, marca, modelo)
        `)
        .in("vehiculo_id", vehiculoIds)
        .order("fecha", { ascending: false })
    : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Historial de Mantenimiento
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mantenimientos?.length ?? 0} registro{mantenimientos?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!mantenimientos || mantenimientos.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Sin registros de mantenimiento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los mantenimientos los registra el taller después de cada servicio
          </p>
        </div>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-2 top-3 bottom-3 w-px bg-border" />
          <div className="space-y-4">
            {mantenimientos.map((m) => (
              <div key={m.id} className="relative">
                <div className="absolute -left-3.5 top-3.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                <Card className="ml-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="font-medium capitalize text-sm">
                          {m.tipo.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(m.vehiculos as any)?.marca} {(m.vehiculos as any)?.modelo} · {(m.vehiculos as any)?.placa}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(m.fecha)}
                        </Badge>
                        {m.costo && (
                          <Badge variant="outline" className="text-xs text-primary">
                            {formatCurrency(m.costo)}
                          </Badge>
                        )}
                        {m.kilometraje && (
                          <Badge variant="outline" className="text-xs">
                            {formatKm(m.kilometraje)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{m.descripcion}</p>
                    {m.observaciones && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{m.observaciones}</p>
                    )}
                    {(m.proxima_fecha || m.proximo_km) && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-primary">
                          Próximo mantenimiento:{" "}
                          {m.proximo_km && formatKm(m.proximo_km)}
                          {m.proxima_fecha && ` · ${formatDate(m.proxima_fecha)}`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
