import Link from "next/link";
import { Plus, Pencil, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductosPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select(
      "id, nombre, slug, marca, precio_referencial, destacado, activo, imagen_url, categorias_producto(nombre)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productos?.length || 0} productos registrados
          </p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {!productos?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="w-10 h-10 mb-3 opacity-30" />
          <p>No hay productos aún</p>
          <Link href="/admin/productos/nuevo" className="mt-3">
            <Button size="sm" variant="outline">
              Agregar primero
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Precio ref.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id} className={!p.activo ? "opacity-50" : ""}>
                  <TableCell>
                    {p.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="w-9 h-9 object-cover rounded"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{p.nombre}</div>
                    {p.destacado && (
                      <Badge
                        variant="outline"
                        className="text-xs mt-0.5 border-primary/40 text-primary"
                      >
                        Destacado
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(p.categorias_producto as any)?.nombre || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.marca || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.precio_referencial
                      ? formatCurrency(p.precio_referencial)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={p.activo ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/productos/${p.id}/editar`}>
                      <Button variant="ghost" size="icon" className="w-7 h-7">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
