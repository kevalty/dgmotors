import type { Metadata } from "next";
import { MessageSquare, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { marcarContactoLeido } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Mensajes de Contacto" };

export default async function ContactoAdminPage() {
  const supabase = await createClient();

  const { data: mensajes } = await supabase
    .from("contactos")
    .select("id, nombre, email, telefono, sucursal, mensaje, leido, created_at")
    .order("created_at", { ascending: false });

  const noLeidos = (mensajes || []).filter((m) => !m.leido).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Mensajes de Contacto
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {noLeidos > 0 ? `${noLeidos} sin leer · ` : ""}{mensajes?.length ?? 0} mensajes en total
        </p>
      </div>

      {!mensajes || mensajes.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin mensajes de contacto aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mensajes.map((m) => (
            <Card
              key={m.id}
              className={m.leido ? "opacity-70" : "border-primary/30"}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{m.nombre}</p>
                      {!m.leido && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">
                          Nuevo
                        </Badge>
                      )}
                      {m.sucursal && m.sucursal !== "cualquiera" && (
                        <Badge variant="outline" className="text-xs capitalize py-0">
                          {m.sucursal}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <a
                        href={`mailto:${m.email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {m.email}
                      </a>
                      {m.telefono && (
                        <a
                          href={`https://wa.me/${m.telefono.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline"
                        >
                          {m.telefono}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("es-EC", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    {!m.leido && (
                      <form action={marcarContactoLeido.bind(null, m.id)}>
                        <button
                          type="submit"
                          title="Marcar como leído"
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {m.mensaje}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
