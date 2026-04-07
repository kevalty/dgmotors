"use client";

import { useActionState, useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { actualizarProducto } from "@/lib/actions/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const initialState = {};

export default function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [state, formAction, isPending] = useActionState(
    actualizarProducto,
    initialState
  );
  const [categorias, setCategorias] = useState<any[]>([]);
  const [producto, setProducto] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("categorias_producto")
        .select("id, nombre")
        .order("orden"),
      supabase.from("productos").select("*").eq("id", id).single(),
    ]).then(([{ data: cats }, { data: prod }]) => {
      setCategorias(cats || []);
      setProducto(prod);
    });
  }, [id]);

  if (!producto) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/productos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Editar Producto
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">{producto.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={producto.id} />

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={producto.nombre}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={producto.slug}
              />
              <p className="text-xs text-muted-foreground">
                URL: /productos/{producto.slug}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  name="categoria_id"
                  defaultValue={producto.categoria_id || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marca">Marca</Label>
                <Input
                  id="marca"
                  name="marca"
                  defaultValue={producto.marca || ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                defaultValue={producto.descripcion || ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="precio_referencial">
                  Precio referencial (USD)
                </Label>
                <Input
                  id="precio_referencial"
                  name="precio_referencial"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={producto.precio_referencial || ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imagen_url">URL de imagen</Label>
                <Input
                  id="imagen_url"
                  name="imagen_url"
                  type="url"
                  defaultValue={producto.imagen_url || ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="compatible_con">
                Compatible con (separar con comas)
              </Label>
              <Input
                id="compatible_con"
                name="compatible_con"
                defaultValue={(producto.compatible_con || []).join(", ")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destacado</Label>
                <Select
                  name="destacado"
                  defaultValue={producto.destacado ? "true" : "false"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  name="activo"
                  defaultValue={producto.activo ? "true" : "false"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/productos" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
