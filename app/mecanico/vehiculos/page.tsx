import Link from "next/link";
import { Car, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function MecanicoVehiculosPage() {
  const supabase = await createClient();
  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select(
      "id, placa, marca, modelo, anio, color, kilometraje, tipo, combustible, perfiles(nombre, apellido)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Vehículos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {vehiculos?.length || 0} vehículos registrados en el sistema
        </p>
      </div>

      {!vehiculos?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Car className="w-10 h-10 mb-3 opacity-30" />
          <p>No hay vehículos registrados</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehiculos.map((v) => (
            <Card key={v.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg">{v.placa}</p>
                    <p className="text-sm text-muted-foreground">
                      {v.marca} {v.modelo} {v.anio}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Car className="w-4.5 h-4.5 text-primary" />
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  {v.color && <p>Color: {v.color}</p>}
                  {v.kilometraje != null && (
                    <p>Kilometraje: {v.kilometraje.toLocaleString()} km</p>
                  )}
                  {(v.perfiles as any)?.nombre && (
                    <p className="font-medium text-foreground">
                      Propietario: {(v.perfiles as any).nombre}{" "}
                      {(v.perfiles as any).apellido}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {v.tipo && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {v.tipo}
                    </Badge>
                  )}
                  {v.combustible && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {v.combustible}
                    </Badge>
                  )}
                </div>
                <Link
                  href={`/mecanico/registrar?vehiculo=${v.id}`}
                  className="block mt-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Registrar trabajo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
