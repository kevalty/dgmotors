import Link from "next/link";
import { Car, ExternalLink, MapPin, Phone, Mail, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="w-4.5 h-4.5 text-primary-foreground" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                DG Motors
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Especialistas en vehículos americanos, Ford y multimarca. Mecánica
              diésel, diagnóstico computarizado y mantenimiento preventivo.
            </p>
            <div className="flex gap-3">
              <Link
                href={process.env.NEXT_PUBLIC_INSTAGRAM || "https://www.instagram.com/dgmotorstaller/"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <span className="text-[10px] font-bold">IG</span>
              </Link>
              <Link
                href={process.env.NEXT_PUBLIC_FACEBOOK || "https://www.facebook.com/DGMotorsFORD/"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <span className="text-[10px] font-bold">FB</span>
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3
              className="font-semibold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Navegación
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/servicios", label: "Servicios" },
                { href: "/precios", label: "Precios" },
                { href: "/sucursales", label: "Sucursales" },
                { href: "/nosotros", label: "Nosotros" },
                { href: "/contacto", label: "Contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sucursal Quito */}
          <div>
            <h3
              className="font-semibold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Sucursal Quito
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <Link
                  href="https://maps.app.goo.gl/y8gTFywEogqvDBM2A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Quito, Ecuador
                </Link>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>{process.env.NEXT_PUBLIC_TELEFONO_QUITO || "+593 99 XXX XXXX"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <div>Lun–Vie: 08:00 – 18:00</div>
                  <div>Sáb: 08:00 – 13:00</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Sucursal Guayaquil */}
          <div>
            <h3
              className="font-semibold mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Sucursal Guayaquil
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <Link
                  href="https://maps.app.goo.gl/eQ842Dow1e35st659"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Cdla. Guayacanes 3 Mz. 130 Solar #32
                </Link>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>{process.env.NEXT_PUBLIC_TELEFONO_GUAYAQUIL || "+593 99 XXX XXXX"}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <div>
                  <div>Lun–Vie: 08:00 – 17:00</div>
                  <div>Sáb: 08:00 – 13:00</div>
                </div>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <Link
                  href={`mailto:${process.env.NEXT_PUBLIC_EMAIL_CONTACTO || "info@dgmotors.com.ec"}`}
                  className="hover:text-primary transition-colors"
                >
                  {process.env.NEXT_PUBLIC_EMAIL_CONTACTO || "info@dgmotors.com.ec"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DG Motors. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary transition-colors">
              Portal Clientes
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
