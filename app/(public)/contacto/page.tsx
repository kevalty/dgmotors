"use client";

import type { Metadata } from "next";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { enviarContacto } from "@/lib/actions/contacto";

type ContactoState = { error?: string; success?: string };
const initialState: ContactoState = {};

export default function ContactoPage() {
  const [state, formAction, isPending] = useActionState(enviarContacto, initialState);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Contáctanos
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          ¿Tienes alguna consulta? Escríbenos y te responderemos a la brevedad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Info */}
        <div className="space-y-4">
          {[
            {
              icon: Phone,
              titulo: "Teléfono Quito",
              valor: process.env.NEXT_PUBLIC_TELEFONO_QUITO || "+593 99 XXX XXXX",
            },
            {
              icon: Phone,
              titulo: "Teléfono Guayaquil",
              valor: process.env.NEXT_PUBLIC_TELEFONO_GUAYAQUIL || "+593 99 XXX XXXX",
            },
            {
              icon: Mail,
              titulo: "Email",
              valor: process.env.NEXT_PUBLIC_EMAIL_CONTACTO || "info@dgmotors.com.ec",
            },
          ].map((item) => (
            <Card key={item.titulo}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.titulo}</p>
                  <p className="text-sm font-medium">{item.valor}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <form action={formAction} className="space-y-4">
                {state.error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {state.error}
                  </div>
                )}
                {state.success && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {state.success}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input id="nombre" name="nombre" placeholder="Juan Pérez" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      placeholder="+593 99 XXX XXXX"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sucursal">Sucursal de interés</Label>
                    <Select name="sucursal">
                      <SelectTrigger id="sucursal">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quito">Quito</SelectItem>
                        <SelectItem value="guayaquil">Guayaquil</SelectItem>
                        <SelectItem value="cualquiera">Cualquiera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    placeholder="¿En qué te podemos ayudar?"
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isPending ? "Enviando..." : "Enviar Mensaje"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
