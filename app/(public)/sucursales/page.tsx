import type { Metadata } from "next";
import { MapPin, Phone, Clock, Navigation } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Sucursales",
  description: "Encuentra nuestras sucursales de DG Motors en Quito y Guayaquil, Ecuador.",
};

const sucursales = [
  {
    id: "quito",
    ciudad: "Quito",
    descripcion: "Sucursal Principal",
    referencia: "Quito, Ecuador",
    telefono: process.env.NEXT_PUBLIC_TELEFONO_QUITO || "+593 99 XXX XXXX",
    maps: "https://maps.app.goo.gl/y8gTFywEogqvDBM2A",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7998!2d-78.5108469!3d-0.1832186!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMMKwMTAnNTkuNiJTIDc4wrAzMCczOS4wIlc!5e0!3m2!1ses!2sec!4v1700000000000",
    horarios: [
      { dias: "Lunes – Viernes", horas: "08:00 – 18:00" },
      { dias: "Sábado", horas: "08:00 – 13:00" },
      { dias: "Domingo", horas: "Cerrado" },
    ],
  },
  {
    id: "guayaquil",
    ciudad: "Guayaquil",
    descripcion: "Sucursal Guayaquil",
    referencia: "Cdla. Guayacanes 3 Mz. 130 Solar #32",
    telefono: process.env.NEXT_PUBLIC_TELEFONO_GUAYAQUIL || "+593 99 XXX XXXX",
    maps: "https://maps.app.goo.gl/eQ842Dow1e35st659",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.8!2d-79.8891!3d-2.1894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMsKwMTEnMjEuOCJTIDc5wrA1MycyMC44Ilc!5e0!3m2!1ses!2sec!4v1700000000000",
    horarios: [
      { dias: "Lunes – Viernes", horas: "08:00 – 17:00" },
      { dias: "Sábado", horas: "08:00 – 13:00" },
      { dias: "Domingo", horas: "Cerrado" },
    ],
  },
];

export default function SucursalesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Nuestras Sucursales
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Estamos presentes en las dos ciudades más importantes del Ecuador.
          Visítanos en cualquiera de nuestras sucursales.
        </p>
      </div>

      <div className="space-y-16 max-w-5xl mx-auto">
        {sucursales.map((s) => (
          <div key={s.id} id={s.id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {s.ciudad}
                </h2>
                <Badge variant="outline" className="text-xs mt-0.5">
                  {s.descripcion}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mapa */}
              <div className="lg:col-span-2 rounded-xl overflow-hidden border border-border h-64 lg:h-auto">
                <iframe
                  src={s.embedSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "300px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa sucursal ${s.ciudad}`}
                />
              </div>

              {/* Info */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Dirección</p>
                      <p className="text-sm text-muted-foreground">{s.referencia}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">{s.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-1.5">Horarios</p>
                      <div className="space-y-1">
                        {s.horarios.map((h) => (
                          <div
                            key={h.dias}
                            className="flex justify-between gap-4 text-xs"
                          >
                            <span className="text-muted-foreground">{h.dias}</span>
                            <span
                              className={
                                h.horas === "Cerrado"
                                  ? "text-muted-foreground"
                                  : "font-medium"
                              }
                            >
                              {h.horas}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link href={s.maps} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full gap-2" variant="outline">
                      <Navigation className="w-4 h-4" />
                      Cómo llegar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
