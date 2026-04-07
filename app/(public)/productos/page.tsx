import Link from "next/link";
import { Package, Star, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Productos — DG Motors",
  description:
    "Catálogo de productos y repuestos para vehículos americanos, Ford y multimarca.",
};

export default async function ProductosPage() {
  const supabase = await createClient();

  const [{ data: categorias }, { data: destacados }] = await Promise.all([
    supabase
      .from("categorias_producto")
      .select(
        "id, nombre, slug, productos(id, nombre, slug, marca, precio_referencial, imagen_url, activo)"
      )
      .order("orden"),
    supabase
      .from("productos")
      .select(
        "id, nombre, slug, marca, precio_referencial, imagen_url, categorias_producto(nombre)"
      )
      .eq("activo", true)
      .eq("destacado", true)
      .limit(6),
  ]);

  const whatsappAdmin =
    process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Catálogo de Productos
        </h1>
        <p className="text-muted-foreground">
          Repuestos y accesorios para vehículos americanos, Ford y multimarca.
          Solicita tu cotización directamente por WhatsApp.
        </p>
      </div>

      {/* Destacados */}
      {destacados && destacados.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" />
            Productos Destacados
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {destacados.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                whatsappPhone={whatsappAdmin}
              />
            ))}
          </div>
        </section>
      )}

      {/* Por categoría */}
      <div className="space-y-10">
        {categorias?.map((cat) => {
          const prods =
            (cat.productos as any[])?.filter(
              (p: any) => p.activo !== false
            ) || [];
          if (!prods.length) return null;
          return (
            <section key={cat.id}>
              <h2 className="text-lg font-semibold mb-4 border-b border-border/50 pb-2">
                {cat.nombre}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {prods.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    whatsappPhone={whatsappAdmin}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Empty state */}
      {(!categorias || categorias.every((c) => !(c.productos as any[])?.length)) && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium mb-1">Catálogo en preparación</p>
          <p className="text-sm">
            Pronto dispondremos de nuestro catálogo completo de productos.
          </p>
          <Link
            href={`https://wa.me/${whatsappAdmin}?text=${encodeURIComponent("Hola DG Motors, quisiera información sobre productos disponibles.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Consultar disponibilidad
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  producto,
  whatsappPhone,
}: {
  producto: any;
  whatsappPhone: string;
}) {
  const quoteMsg = `Hola DG Motors! Me interesa el producto: ${producto.nombre}. Quisiera una cotización.`;
  const quoteHref = waLink(whatsappPhone, quoteMsg);

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/productos/${producto.slug}`}>
        <div className="aspect-square bg-muted overflow-hidden">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3">
        <Link href={`/productos/${producto.slug}`}>
          <p className="font-medium text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
            {producto.nombre}
          </p>
        </Link>
        {producto.marca && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {producto.marca}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 gap-1">
          <span className="text-xs font-medium text-primary">
            {producto.precio_referencial
              ? `Ref. ${formatCurrency(producto.precio_referencial)}`
              : "Consultar"}
          </span>
          <Link href={quoteHref} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-6 text-xs px-2">
              Cotizar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
