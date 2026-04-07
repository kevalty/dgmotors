import { z } from "zod";

export const citaSchema = z.object({
  vehiculo_id: z.string().uuid("Vehículo inválido"),
  servicio_id: z.string().uuid("Servicio inválido").optional(),
  sucursal: z.enum(["quito", "guayaquil"], {
    error: "Selecciona una sucursal",
  }),
  fecha_hora: z.string().min(1, "La fecha y hora son requeridas"),
  notas_cliente: z.string().max(500).optional(),
});

export type CitaInput = z.infer<typeof citaSchema>;
