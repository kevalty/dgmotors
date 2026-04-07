import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronRight,
  Car,
  Zap,
  Settings,
  Gauge,
  Cpu,
  Wind,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const serviciosDestacados = [
  { icon: Gauge, nombre: "Cambio de Aceite", desc: "Aceite sintético o semisintético + filtro", precio: "Desde $35" },
  { icon: Cpu, nombre: "Diagnóstico Computarizado", desc: "Lectura de códigos de falla con scanner", precio: "Desde $25" },
  { icon: Settings, nombre: "Mantenimiento Preventivo", desc: "Paquetes completos 5k, 10k y 20k km", precio: "Desde $60" },
  { icon: Zap, nombre: "Electromecánica", desc: "Sistema eléctrico y diagnóstico eléctrico", precio: "Desde $40" },
  { icon: ShieldCheck, nombre: "Frenos y Suspensión", desc: "Pastillas, amortiguadores, alineación", precio: "Desde $25" },
  { icon: Wind, nombre: "Aire Acondicionado", desc: "Recarga de gas y servicio completo", precio: "Desde $45" },
];

const razones = [
  { icon: ShieldCheck, titulo: "Especialistas en Ford y americanos", desc: "Más de años de experiencia en vehículos americanos y motores diésel" },
  { icon: Cpu, titulo: "Diagnóstico computarizado", desc: "Tecnología de punta para identificar fallas con precisión" },
  { icon: CheckCircle2, titulo: "Transparencia total", desc: "Presupuesto aprobado antes de iniciar cualquier trabajo" },
  { icon: Clock, titulo: "Cumplimiento de tiempos", desc: "Respetamos los tiempos acordados para la entrega de tu vehículo" },
];

const reseñas = [
  { nombre: "Carlos M.", calificacion: 5, texto: "Excelente servicio. Llevé mi F-150 y quedé muy satisfecho. El diagnóstico fue preciso y el precio justo.", sucursal: "Quito" },
  { nombre: "María F.", calificacion: 5, texto: "Super profesionales. Mi camioneta estaba fallando y en un día la tenía lista. Muy recomendados.", sucursal: "Guayaquil" },
  { nombre: "Roberto L.", calificacion: 5, texto: "El mejor taller de Quito para vehículos diésel. Llevo 3 años con ellos y nunca me han fallado.", sucursal: "Quito" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: serviciosDB } = await supabase
    .from("servicios")
    .select("id, nombre")
    .eq("activo", true)
    .limit(1);

  const hayServicios = serviciosDB && serviciosDB.length > 0;

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
              Taller Automotriz en Ecuador
            </Badge>
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Tu taller de{" "}
              <span className="text-primary">confianza</span>{" "}
              en Ecuador
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Especialistas en vehículos americanos, Ford y multimarca. Diagnóstico
              computarizado, mantenimiento preventivo y mecánica diésel en Quito y Guayaquil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/cliente/citas/nueva">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Calendar className="w-4 h-4" />
                  Agendar Cita
                </Button>
              </Link>
              <Link href="/servicios">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver Servicios
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorativo */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* STATS */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "10+", label: "Años de experiencia" },
              { value: "5,000+", label: "Vehículos atendidos" },
              { value: "2", label: "Sucursales" },
              { value: "100%", label: "Satisfacción garantizada" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-3xl font-extrabold text-primary mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS DESTACADOS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Nuestros Servicios
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ofrecemos una gama completa de servicios automotrices con la más alta calidad
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {serviciosDestacados.map((s) => (
            <Card
              key={s.nombre}
              className="group hover:border-primary/40 transition-colors"
            >
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{s.nombre}</h3>
                <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                <span className="text-xs font-medium text-primary">{s.precio}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/servicios">
            <Button variant="outline" className="gap-2">
              Ver todos los servicios
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section className="bg-muted/30 border-y border-border/50">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              ¿Por qué elegirnos?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Más de una década de experiencia respaldan nuestra calidad
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {razones.map((r) => (
              <div key={r.titulo} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{r.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Lo que dicen nuestros clientes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reseñas.map((r) => (
            <Card key={r.nombre}>
              <CardContent className="p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.calificacion }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  &ldquo;{r.texto}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.nombre}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.sucursal}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SUCURSALES */}
      <section className="bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Nuestras Sucursales
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                ciudad: "Quito",
                referencia: "Quito, Ecuador",
                maps: "https://maps.app.goo.gl/y8gTFywEogqvDBM2A",
                horario: "Lun–Vie: 8:00–18:00 | Sáb: 8:00–13:00",
              },
              {
                ciudad: "Guayaquil",
                referencia: "Cdla. Guayacanes 3 Mz. 130 Solar #32",
                maps: "https://maps.app.goo.gl/eQ842Dow1e35st659",
                horario: "Lun–Vie: 8:00–17:00 | Sáb: 8:00–13:00",
              },
            ].map((s) => (
              <Card key={s.ciudad} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{s.ciudad}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{s.referencia}</p>
                  <p className="text-sm text-muted-foreground mb-4">{s.horario}</p>
                  <Link href={s.maps} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Ver en Maps
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Car className="w-7 h-7 text-primary" />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            ¿Listo para llevar tu vehículo?
          </h2>
          <p className="text-muted-foreground mb-8">
            Regístrate gratis y agenda tu cita en línea. Lleva el control total del
            mantenimiento de tu vehículo desde un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/registro">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4" />
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/contacto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contáctanos
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
