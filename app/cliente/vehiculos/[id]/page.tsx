import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  Droplets,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle Vehículo" };

export default async function VehiculoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehiculo } = await supabase
    .from("vehiculos")
    .select("*")
    .eq("id", id)
    .eq("cliente_id", user.id)
    .single();

  if (!vehiculo) notFound();

  const [{ data: mantenimientos }, { data: aceites }] = await Promise.all([
    supabase
      .from("mantenimientos")
      .select("id, tipo, descripcion, fecha, kilometraje, costo, proxima_fecha, proximo_km")
      .eq("vehiculo_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("cambios_aceite")
      .select("id, fecha, kilometraje, tipo_aceite, marca_aceite, viscosidad, cantidad_litros, proxima_fecha, proximo_km")
      .eq("vehiculo_id", id)
      .order("fecha", { ascending: false }),
  ]);

  const infoItems = [
    { label: "Placa", value: vehiculo.placa },
    { label: "Marca", value: vehiculo.marca },
    { label: "Modelo", value: vehiculo.modelo },
    { label: "Año", value: vehiculo.anio },
    { label: "Color", value: vehiculo.color || "—" },
    { label: "Kilometraje", value: vehiculo.kilometraje ? formatKm(vehiculo.kilometraje) : "—" },
    { label: "Tipo", value: vehiculo.tipo ? vehiculo.tipo.charAt(0).toUpperCase() + vehiculo.tipo.slice(1) : "—" },
    { label: "Combustible", value: vehiculo.combustible ? vehiculo.combustible.charAt(0).toUpperCase() + vehiculo.combustible.slice(1) : "—" },
    { label: "VIN/Chasis", value: vehiculo.vin || "—" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cliente/vehiculos">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-heading)" }}>
            {vehiculo.marca} {vehiculo.modelo}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="font-mono text-xs">
              {vehiculo.placa}
            </Badge>
            <span className="text-muted-foreground text-xs">{vehiculo.anio}</span>
          </div>
        </div>
        <Link href="/cliente/citas/nueva">
          <Button size="sm" className="gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            Agendar Cita
          </Button>
        </Link>
      </div>

      {/* Info del vehículo */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            Información del Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {infoItems.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
          {vehiculo.notas && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Notas</p>
              <p className="text-sm">{vehiculo.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de mantenimientos */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Historial de Mantenimiento
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mantenimientos && mantenimientos.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {mantenimientos.map((m) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -left-2.5 top-1.5 w-2 h-2 rounded-full bg-primary" />
                    <div className="bg-muted/40 rounded-lg p-3 ml-2">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
                        <p className="text-sm font-medium capitalize">
                          {m.tipo.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {formatDate(m.fecha)}
                          </Badge>
                          {m.costo && (
                            <Badge variant="outline" className="text-xs text-primary">
                              {formatCurrency(m.costo)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.descripcion}</p>
                      {m.kilometraje && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatKm(m.kilometraje)}
                        </p>
                      )}
                      {(m.proxima_fecha || m.proximo_km) && (
                        <p className="text-xs text-primary mt-1">
                          Próximo:{" "}
                          {m.proximo_km && formatKm(m.proximo_km)}
                          {m.proxima_fecha && ` · ${formatDate(m.proxima_fecha)}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin registros de mantenimiento
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cambios de aceite */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            Cambios de Aceite
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aceites && aceites.length > 0 ? (
            <div className="space-y-3">
              {aceites.map((a) => (
                <div key={a.id} className="bg-muted/40 rounded-lg p-3">
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
                    {a.cantidad_litros && <span>{a.cantidad_litros}L</span>}
                  </div>
                  {(a.proximo_km || a.proxima_fecha) && (
                    <p className="text-xs text-primary mt-1">
                      Próximo:{" "}
                      {a.proximo_km && formatKm(a.proximo_km)}
                      {a.proxima_fecha && ` · ${formatDate(a.proxima_fecha)}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin registros de cambio de aceite
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
