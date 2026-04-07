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
