import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().min(2, { error: "Nombre mínimo 2 caracteres" }),
  slug: z
    .string()
    .min(2, { error: "Slug requerido" })
    .regex(/^[a-z0-9-]+$/, { error: "Slug solo letras minúsculas, números y guiones" }),
  categoria_id: z.string().uuid({ error: "Categoría inválida" }).optional().nullable(),
  descripcion: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  precio_referencial: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive({ error: "Precio debe ser positivo" }).nullable().optional()
  ),
  imagen_url: z
    .string()
    .url({ error: "URL de imagen inválida" })
    .optional()
    .nullable()
    .or(z.literal("")),
  destacado: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true),
});

export type ProductoInput = z.infer<typeof productoSchema>;
