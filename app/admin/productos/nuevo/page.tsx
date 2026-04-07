"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { crearProducto } from "@/lib/actions/productos";
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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function NuevoProductoPage() {
  const [state, formAction, isPending] = useActionState(crearProducto, initialState);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categorias_producto")
      .select("id, nombre")
      .order("orden")
      .then(({ data }) => setCategorias(data || []));
  }, []);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(nombre));
  }, [nombre, slugTouched]);

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
          Nuevo Producto
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
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
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="mi-producto"
              />
              <p className="text-xs text-muted-foreground">
                Se usa en la URL: /productos/{slug || "..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select name="categoria_id">
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
                  placeholder="Mobil, Bosch..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                placeholder="Describe el producto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="precio_referencial">Precio referencial (USD)</Label>
                <Input
                  id="precio_referencial"
                  name="precio_referencial"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imagen_url">URL de imagen</Label>
                <Input
                  id="imagen_url"
                  name="imagen_url"
                  type="url"
                  placeholder="https://..."
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
                placeholder="Ford F-150 2018, Toyota Hilux 2020..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Destacado</Label>
                <Select name="destacado" defaultValue="false">
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
                <Select name="activo" defaultValue="true">
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
                {isPending ? "Guardando..." : "Crear Producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
