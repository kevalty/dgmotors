import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Catálogo completo de servicios automotrices de DG Motors en Quito y Guayaquil.",
};

export default async function ServiciosPage() {
  const supabase = await createClient();
  const { data: categorias } = await supabase
    .from("categorias_servicio")
    .select(`
      id, nombre, descripcion, orden,
      servicios(id, nombre, descripcion, precio_min, precio_max, duracion_min, activo)
    `)
    .order("orden")
    .order("nombre", { referencedTable: "servicios" });

  const categoriasConServicios = (categorias || []).map((c) => ({
    ...c,
    servicios: (c.servicios as any[]).filter((s) => s.activo),
  }));

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-6 h-6 text-primary" />
        </div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Nuestros Servicios
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Ofrecemos servicios especializados para vehículos americanos, Ford y multimarca.
          Los precios son referenciales y pueden variar según el vehículo.
        </p>
      </div>

      {categoriasConServicios.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Servicios próximamente disponibles.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categoriasConServicios.map((cat) => (
            <section key={cat.id}>
              <div className="mb-5">
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {cat.nombre}
                </h2>
                {cat.descripcion && (
                  <p className="text-muted-foreground text-sm mt-1">{cat.descripcion}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.servicios.map((s: any) => (
                  <Card key={s.id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{s.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {s.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">{s.descripcion}</p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-sm font-semibold text-primary">
                          {s.precio_min && s.precio_max
                            ? `${formatCurrency(s.precio_min)} – ${formatCurrency(s.precio_max)}`
                            : s.precio_min
                            ? `Desde ${formatCurrency(s.precio_min)}`
                            : "Consultar precio"}
                        </span>
                        {s.duracion_min && (
                          <Badge variant="secondary" className="text-xs">
                            ~{s.duracion_min >= 60
                              ? `${Math.floor(s.duracion_min / 60)}h ${s.duracion_min % 60 > 0 ? s.duracion_min % 60 + "min" : ""}`
                              : `${s.duracion_min}min`}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
