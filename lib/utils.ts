import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy") {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatKm(km: number) {
  return new Intl.NumberFormat("es-EC").format(km) + " km";
}

export const SUCURSALES = {
  quito: {
    nombre: "Quito",
    coordenadas: { lat: -0.1832186, lng: -78.5108469 },
    maps: "https://maps.app.goo.gl/y8gTFywEogqvDBM2A",
  },
  guayaquil: {
    nombre: "Guayaquil",
    direccion: "Cdla. Guayacanes 3 Mz. 130 Solar #32",
    coordenadas: { lat: -2.1894, lng: -79.8891 },
    maps: "https://maps.app.goo.gl/eQ842Dow1e35st659",
  },
} as const;

export const ESTADO_CITA_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_proceso: "En Proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const ESTADO_CITA_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  confirmada: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  en_proceso: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  completada: "bg-green-500/20 text-green-600 dark:text-green-400",
  cancelada: "bg-red-500/20 text-red-600 dark:text-red-400",
};

// ─── ERP: Órdenes de Trabajo ───────────────────────────────────────────────

export const ESTADO_OT_LABELS: Record<string, string> = {
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  en_proceso: "En Proceso",
  pausado: "Pausado",
  completado: "Completado",
  facturado: "Facturado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ESTADO_OT_COLORS: Record<string, string> = {
  presupuesto: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  aprobado: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  en_proceso: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  pausado: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  completado: "bg-green-500/20 text-green-600 dark:text-green-400",
  facturado: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  entregado: "bg-teal-500/20 text-teal-600 dark:text-teal-400",
  cancelado: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export const TIPO_OT_LABELS: Record<string, string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
  revision: "Revisión",
  otro: "Otro",
};

// ─── ERP: Facturación ─────────────────────────────────────────────────────

export const ESTADO_FACTURA_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  parcial: "Parcial",
  anulada: "Anulada",
  vencida: "Vencida",
};

export const ESTADO_FACTURA_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  pagada: "bg-green-500/20 text-green-600 dark:text-green-400",
  parcial: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  anulada: "bg-red-500/20 text-red-600 dark:text-red-400",
  vencida: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
};

export const METODO_PAGO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta_credito: "Tarjeta Crédito",
  tarjeta_debito: "Tarjeta Débito",
  transferencia: "Transferencia",
  cheque: "Cheque",
  otro: "Otro",
};

// ─── ERP: Inventario ──────────────────────────────────────────────────────

export const UNIDAD_LABELS: Record<string, string> = {
  unidad: "Unidad",
  litro: "Litro",
  kg: "Kg",
  metro: "Metro",
  par: "Par",
  juego: "Juego",
};
