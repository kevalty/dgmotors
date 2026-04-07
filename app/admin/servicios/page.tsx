"use client";

import { useEffect, useState, useActionState } from "react";
import { Plus, Pencil, Settings, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { actualizarServicio } from "@/lib/actions/admin";
import { formatCurrency } from "@/lib/utils";

const initialState = {};

export default function AdminServiciosPage() {
  const [state, formAction, isPending] = useActionState(actualizarServicio, initialState);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const loadData = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categorias_servicio")
      .select("id, nombre, servicios(id, nombre, descripcion, precio_min, precio_max, activo)")
      .order("orden");
    setCategorias(data || []);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if ((state as any).success) {
      setDialogOpen(false);
      loadData();
    }
  }, [state]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditing(s); setDialogOpen(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Servicios y Precios
          </h1>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="w-3.5 h-3.5" />
          Nuevo Servicio
        </Button>
      </div>

      <div className="space-y-6">
        {categorias.map((cat) => (
          <div key={cat.id}>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              {cat.nombre}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(cat.servicios as any[]).map((s) => (
                <Card key={s.id} className={!s.activo ? "opacity-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{s.nombre}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{s.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">
                        {s.precio_min && s.precio_max
                          ? `${formatCurrency(s.precio_min)} – ${formatCurrency(s.precio_max)}`
                          : "Sin precio"}
                      </span>
                      <Badge variant={s.activo ? "secondary" : "outline"} className="text-xs">
                        {s.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing.id} />}

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            {!editing && (
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select name="categoria_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input name="nombre" defaultValue={editing?.nombre || ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea name="descripcion" defaultValue={editing?.descripcion || ""} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio mín (USD)</Label>
                <Input name="precio_min" type="number" step="0.01" defaultValue={editing?.precio_min || ""} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio máx (USD)</Label>
                <Input name="precio_max" type="number" step="0.01" defaultValue={editing?.precio_max || ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Duración estimada (min)</Label>
              <Input name="duracion_min" type="number" defaultValue={editing?.duracion_min || ""} />
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select name="activo" defaultValue={editing?.activo ? "true" : "false"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
