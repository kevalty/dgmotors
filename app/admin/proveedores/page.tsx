"use client";

import { useActionState, useState, useEffect } from "react";
import { Truck, Plus, ChevronRight, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { crearProveedor } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";

export default function ProveedoresPage() {
  const [state, action, pending] = useActionState(crearProveedor, {});
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const cargar = () => {
    const supabase = createClient();
    supabase
      .from("proveedores")
      .select("*")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setProveedores(data || []));
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => {
    if (state.success) { setOpen(false); cargar(); }
  }, [state.success]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Proveedores
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {proveedores.length} proveedores activos
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Nuevo proveedor
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <form action={action} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Nombre *</Label>
                  <Input name="nombre" required placeholder="Nombre del proveedor" />
                </div>
                <div className="space-y-1">
                  <Label>RUC</Label>
                  <Input name="ruc" placeholder="1234567890001" />
                </div>
                <div className="space-y-1">
                  <Label>Teléfono</Label>
                  <Input name="telefono" placeholder="+593..." />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="proveedor@email.com" />
                </div>
                <div className="space-y-1">
                  <Label>Contacto</Label>
                  <Input name="contacto" placeholder="Nombre del contacto" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Dirección</Label>
                  <Input name="direccion" placeholder="Dirección" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Notas</Label>
                  <Textarea name="notas" rows={2} placeholder="Notas adicionales..." />
                </div>
              </div>
              {state.error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  {state.error}
                </p>
              )}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Guardando..." : "Crear proveedor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin proveedores registrados
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell>
                      <p className="text-sm font-medium">{p.nombre}</p>
                      {p.direccion && (
                        <p className="text-xs text-muted-foreground">{p.direccion}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {p.ruc || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{p.contacto || "—"}</TableCell>
                    <TableCell>
                      {p.telefono ? (
                        <a
                          href={`tel:${p.telefono}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {p.telefono}
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {p.email ? (
                        <a
                          href={`mailto:${p.email}`}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          {p.email}
                        </a>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
