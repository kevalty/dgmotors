import { z } from "zod";

export const vehiculoSchema = z.object({
  placa: z.string().min(1, "La placa es requerida").max(10, "Placa muy larga"),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  anio: z
    .number({ error: "El año debe ser un número" })
    .int()
    .min(1980, "Año mínimo: 1980")
    .max(new Date().getFullYear() + 1, "Año inválido"),
  color: z.string().optional(),
  kilometraje: z.number().int().min(0).optional().default(0),
  tipo: z
    .enum(["sedan", "camioneta", "suv", "pickup", "furgoneta", "otro"])
    .optional(),
  combustible: z
    .enum(["gasolina", "diesel", "hibrido", "electrico"])
    .optional(),
  vin: z.string().optional(),
  notas: z.string().optional(),
});

export type VehiculoInput = z.infer<typeof vehiculoSchema>;
