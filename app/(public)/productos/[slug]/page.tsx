import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, MessageCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("productos")
    .select("nombre, descripcion")
    .eq("slug", slug)
    .single();
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: `${p.nombre} — DG Motors`,
    description:
      p.descripcion || `${p.nombre} disponible en DG Motors Ecuador`,
  };
}

export default async function ProductoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: producto } = await supabase
    .from("productos")
    .select("*, categorias_producto(nombre, slug)")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!producto) notFound();

  const whatsappPhone =
    process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "593995220931";
  const quoteMsg = `Hola DG Motors! Me interesa el producto: ${producto.nombre} (ref: ${producto.slug}). Quisiera una cotización.`;
  const quoteHref = waLink(whatsappPhone, quoteMsg);

  const variantes: Array<{ clave: string; valor: string }> =
    producto.variantes || [];
  const compatibleCon: string[] = producto.compatible_con || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap">
        <Link href="/productos" className="hover:text-primary transition-colors">
          Productos
        </Link>
        {(producto.categorias_producto as any)?.nombre && (
          <>
            <span>/</span>
            <span>{(producto.categorias_producto as any).nombre}</span>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{producto.nombre}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-muted">
          {producto.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-20 h-20 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {(producto.categorias_producto as any)?.nombre && (
            <Badge variant="secondary" className="mb-2 text-xs">
              {(producto.categorias_producto as any).nombre}
            </Badge>
          )}
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {producto.nombre}
          </h1>
          {producto.marca && (
            <p className="text-muted-foreground text-sm mb-3">
              Marca: {producto.marca}
            </p>
          )}

          {producto.precio_referencial && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Precio referencial
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(producto.precio_referencial)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                * Precio sujeto a disponibilidad. Cotizar para precio final.
              </p>
            </div>
          )}

          {producto.descripcion && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {producto.descripcion}
            </p>
          )}

          {/* Variantes */}
          {variantes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Especificaciones</p>
              <div className="space-y-1">
                {variantes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-28 shrink-0">
                      {v.clave}:
                    </span>
                    <span className="font-medium">{v.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatible con */}
          {compatibleCon.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Compatible con</p>
              <div className="flex flex-wrap gap-1.5">
                {compatibleCon.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href={quoteHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full gap-2" size="lg">
              <MessageCircle className="w-4 h-4" />
              Solicitar Cotización por WhatsApp
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/productos">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver todos los productos
          </Button>
        </Link>
      </div>
    </div>
  );
}
