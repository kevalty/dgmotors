import type { Metadata } from "next";
import { Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Historial de Aceite" };

export default async function AceitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id")
    .eq("cliente_id", user.id);

  const vehiculoIds = (vehiculos || []).map((v) => v.id);

  const { data: aceites } = vehiculoIds.length > 0
    ? await supabase
        .from("cambios_aceite")
        .select(`
          id, fecha, kilometraje, tipo_aceite, marca_aceite, viscosidad,
          cantidad_litros, proxima_fecha, proximo_km,
          vehiculos(placa, marca, modelo, kilometraje)
        `)
        .in("vehiculo_id", vehiculoIds)
        .order("fecha", { ascending: false })
    : { data: [] };

  // Agrupar por vehículo para mostrar estado
  const porVehiculo = (aceites || []).reduce<Record<string, any>>((acc, a) => {
    const vid = a.vehiculos ? JSON.stringify(a.vehiculos) : "desconocido";
    if (!acc[vid]) {
      acc[vid] = { vehiculo: a.vehiculos, registros: [] };
    }
    acc[vid].registros.push(a);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Cambios de Aceite
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {aceites?.length ?? 0} registro{aceites?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {!aceites || aceites.length === 0 ? (
        <div className="text-center py-20">
          <Droplets className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Sin registros de cambio de aceite</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(porVehiculo).map((grupo: any) => {
            const ultimo = grupo.registros[0];
            const kmActual = (grupo.vehiculo as any)?.kilometraje || 0;
            const proximoKm = ultimo.proximo_km;
            const kmRestantes = proximoKm ? proximoKm - kmActual : null;
            const necesitaCambio = kmRestantes !== null && kmRestantes <= 500;

            return (
              <div key={JSON.stringify(grupo.vehiculo)}>
                {/* Header vehículo */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {grupo.vehiculo?.marca} {grupo.vehiculo?.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground">{grupo.vehiculo?.placa}</p>
                  </div>
                  {necesitaCambio ? (
                    <Badge variant="destructive" className="ml-auto gap-1 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      Cambio pronto
                    </Badge>
                  ) : proximoKm ? (
                    <Badge variant="secondary" className="ml-auto gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Al día
                    </Badge>
                  ) : null}
                </div>

                {/* Estado próximo */}
                {(ultimo.proximo_km || ultimo.proxima_fecha) && (
                  <Card className="mb-4 border-primary/20 bg-primary/5">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-primary">
                        Próximo cambio de aceite
                      </p>
                      <div className="flex gap-4 mt-1 text-xs">
                        {ultimo.proximo_km && (
                          <span>{formatKm(ultimo.proximo_km)}</span>
                        )}
                        {ultimo.proxima_fecha && (
                          <span>{formatDate(ultimo.proxima_fecha)}</span>
                        )}
                        {kmRestantes !== null && (
                          <span className={kmRestantes <= 500 ? "text-destructive font-medium" : "text-muted-foreground"}>
                            {kmRestantes > 0 ? `Faltan ${formatKm(kmRestantes)}` : "¡Cambio vencido!"}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Historial */}
                <div className="space-y-2">
                  {grupo.registros.map((a: any) => (
                    <Card key={a.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {a.marca_aceite
                              ? `${a.marca_aceite}${a.viscosidad ? ` ${a.viscosidad}` : ""}`
                              : a.tipo_aceite || "Cambio de aceite"}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(a.fecha)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                          {a.kilometraje && <span>{formatKm(a.kilometraje)}</span>}
                          {a.tipo_aceite && a.marca_aceite && <span>{a.tipo_aceite}</span>}
                          {a.cantidad_litros && <span>{a.cantidad_litros}L</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
