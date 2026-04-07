import type { Metadata } from "next";
import Link from "next/link";
import {
  Car,
  Award,
  Users,
  MapPin,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce a DG Motors, taller automotriz especializado en Ecuador.",
};

const valores = [
  {
    icon: ShieldCheck,
    titulo: "Honestidad",
    desc: "Diagnósticos claros y presupuestos transparentes antes de iniciar cualquier trabajo.",
  },
  {
    icon: Award,
    titulo: "Calidad",
    desc: "Usamos repuestos originales y de calidad. Nuestro trabajo tiene garantía.",
  },
  {
    icon: Users,
    titulo: "Atención personalizada",
    desc: "Cada cliente recibe atención dedicada. Te explicamos qué se hizo y por qué.",
  },
  {
    icon: Cpu,
    titulo: "Tecnología",
    desc: "Equipos de diagnóstico computarizado de última generación para mayor precisión.",
  },
];

const especialidades = [
  "Vehículos Ford y americanos",
  "Motores diésel",
  "Diagnóstico computarizado",
  "Analizador de opacidad",
  "Mantenimiento preventivo",
  "Mecánica correctiva",
  "Electromecánica automotriz",
  "Frenos y suspensión",
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-muted/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Sobre DG Motors</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Más de una década cuidando
              <span className="text-primary"> tu vehículo</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              DG Motors es un taller automotriz ecuatoriano con presencia en Quito y
              Guayaquil. Nos especializamos en vehículos americanos, Ford y multimarca,
              con enfoque en mecánica diésel, diagnóstico computarizado y mantenimiento
              preventivo y correctivo.
            </p>
            <Link href="/contacto">
              <Button className="gap-2">
                Contáctanos
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <div>
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Nuestra Misión
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Brindar servicios automotrices de alta calidad con honestidad, transparencia
              y tecnología de punta, para que nuestros clientes conduzcan con total
              seguridad y confianza.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Cada vehículo que entra a nuestro taller recibe el mismo cuidado y atención
              que daríamos al nuestro propio.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Gauge, label: "Diagnóstico preciso" },
              { icon: Wrench, label: "Mecánica especializada" },
              { icon: ShieldCheck, label: "Trabajo garantizado" },
              { icon: Award, label: "10+ años de experiencia" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Especialidades */}
      <section className="bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 py-16">
          <h2
            className="text-3xl font-bold text-center mb-10"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nuestras Especialidades
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {especialidades.map((e) => (
              <div
                key={e}
                className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-card text-sm"
              >
                <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
                {e}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="container mx-auto px-4 py-16">
        <h2
          className="text-3xl font-bold text-center mb-10"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Nuestros Valores
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {valores.map((v) => (
            <Card key={v.titulo}>
              <CardContent className="p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{v.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sucursales */}
      <section className="bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4 py-16 text-center">
          <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            2 Sucursales en Ecuador
          </h2>
          <p className="text-muted-foreground mb-6">
            Quito y Guayaquil — Tu taller está más cerca de lo que piensas
          </p>
          <Link href="/sucursales">
            <Button className="gap-2">
              <MapPin className="w-4 h-4" />
              Ver Sucursales
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
