import type { Metadata } from "next";
import Link from "next/link";
import { Car, Plus, Fuel, Calendar, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis Vehículos" };

export default async function VehiculosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, placa, marca, modelo, anio, color, kilometraje, tipo, combustible")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Mis Vehículos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {vehiculos?.length ?? 0} vehículo{vehiculos?.length !== 1 ? "s" : ""} registrado{vehiculos?.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/cliente/vehiculos/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </Button>
        </Link>
      </div>

      {!vehiculos || vehiculos.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Sin vehículos registrados</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Agrega tu primer vehículo para gestionar sus mantenimientos y citas
          </p>
          <Link href="/cliente/vehiculos/nuevo">
            <Button className="gap-1.5">
              <Plus className="w-4 h-4" />
              Agregar Vehículo
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehiculos.map((v) => (
            <Link key={v.id} href={`/cliente/vehiculos/${v.id}`}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {v.placa}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base mb-1">
                    {v.marca} {v.modelo}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {v.anio}
                    </span>
                    {v.kilometraje > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {formatKm(v.kilometraje)}
                      </span>
                    )}
                    {v.combustible && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 capitalize">
                        <Fuel className="w-3 h-3" />
                        {v.combustible}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
