import { z } from "zod";

export const mantenimientoSchema = z.object({
  vehiculo_id: z.string().uuid("Vehículo inválido"),
  cita_id: z.string().uuid().optional(),
  tipo: z.string().min(1, "El tipo es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  kilometraje: z.number().int().min(0).optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  costo: z.number().min(0).optional(),
  proxima_fecha: z.string().optional(),
  proximo_km: z.number().int().min(0).optional(),
  observaciones: z.string().optional(),
});

export type MantenimientoInput = z.infer<typeof mantenimientoSchema>;

export const cambioAceiteSchema = z.object({
  vehiculo_id: z.string().uuid("Vehículo inválido"),
  mantenimiento_id: z.string().uuid().optional(),
  fecha: z.string().min(1, "La fecha es requerida"),
  kilometraje: z.number().int().min(0, "Kilometraje requerido"),
  tipo_aceite: z.string().optional(),
  marca_aceite: z.string().optional(),
  viscosidad: z.string().optional(),
  cantidad_litros: z.number().min(0).optional(),
  proxima_fecha: z.string().optional(),
  proximo_km: z.number().int().min(0).optional(),
});

export type CambioAceiteInput = z.infer<typeof cambioAceiteSchema>;
