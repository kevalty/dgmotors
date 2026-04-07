import Link from "next/link";
import { Car, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Car className="w-8 h-8 text-primary" />
      </div>
      <h1
        className="text-4xl font-bold mb-3"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        404
      </h1>
      <p className="text-xl font-semibold mb-2">Página no encontrada</p>
      <p className="text-muted-foreground mb-8 max-w-sm">
        La página que buscas no existe o fue movida. Regresa al inicio para continuar.
      </p>
      <Link href="/">
        <Button className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Button>
      </Link>
    </div>
  );
}
