export function waLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const SUCURSAL_MAPS: Record<string, string> = {
  quito: "https://maps.app.goo.gl/y8gTFywEogqvDBM2A",
  guayaquil: "https://maps.app.goo.gl/eQ842Dow1e35st659",
};

export interface CitaWAData {
  clienteNombre: string;
  vehiculo: string;
  servicio: string;
  sucursal: string;
  fecha: string;
  mapsLink: string;
  nota: string;
}

export const WA_CONFIG: Record<string, { boton: string; buildMensaje: (p: CitaWAData) => string }> = {
  confirmada: {
    boton: "Confirmar cita por WhatsApp ✅",
    buildMensaje: ({ clienteNombre, vehiculo, servicio, sucursal, fecha, mapsLink, nota }) =>
      `¡Hola ${clienteNombre}! 👋\n\n` +
      `Tu cita en *DG Motors* ha sido *confirmada* ✅\n\n` +
      `📅 *Fecha y hora:* ${fecha}\n` +
      `🏢 *Sucursal:* ${sucursal}\n` +
      `🚗 *Vehículo:* ${vehiculo}\n` +
      `🔧 *Servicio:* ${servicio}\n` +
      (nota ? `📝 *Nota:* ${nota}\n` : "") +
      `\n📍 *Ubicación:* ${mapsLink}\n\n` +
      `Te esperamos puntual. ¡Gracias por confiar en DG Motors! 🏁`,
  },
  en_proceso: {
    boton: "Notificar vehículo en taller 🔧",
    buildMensaje: ({ clienteNombre, vehiculo, nota }) =>
      `¡Hola ${clienteNombre}! 🔧\n\n` +
      `Tu vehículo *${vehiculo}* ya se encuentra en nuestro taller y el equipo de *DG Motors* ha comenzado a trabajar en él.\n\n` +
      (nota ? `📝 *Nota del técnico:* ${nota}\n\n` : "") +
      `Te avisaremos cuando el trabajo esté listo. ¡Gracias por tu paciencia!`,
  },
  completada: {
    boton: "Notificar trabajo completo 🏁",
    buildMensaje: ({ clienteNombre, vehiculo, nota }) =>
      `¡Hola ${clienteNombre}! 🎉\n\n` +
      `El trabajo en tu vehículo *${vehiculo}* ha sido *completado* con éxito.\n\n` +
      (nota ? `📝 *Resumen:* ${nota}\n\n` : "") +
      `Puedes pasar a recogerlo cuando gustes. ¡Gracias por elegir *DG Motors*! 🚗💨`,
  },
  cancelada: {
    boton: "Confirmar cancelación por WhatsApp ❌",
    buildMensaje: ({ clienteNombre, vehiculo, fecha, nota }) =>
      `¡Hola ${clienteNombre}!\n\n` +
      `Tu cita del *${fecha}* para el vehículo *${vehiculo}* ha sido *cancelada*.\n\n` +
      (nota ? `📝 *Motivo:* ${nota}\n\n` : "") +
      `Puedes agendar una nueva cita cuando lo desees. ¡Hasta pronto! 👋`,
  },
};

export function buildCitaWALink(cita: any, estado: string, notasAdmin: string): string {
  const config = WA_CONFIG[estado];
  if (!config) return "";
  const telefono = (cita.perfiles?.telefono || "").replace(/\D/g, "");
  if (!telefono) return "";

  const params: CitaWAData = {
    clienteNombre: `${cita.perfiles?.nombre || ""} ${cita.perfiles?.apellido || ""}`.trim(),
    vehiculo: `${cita.vehiculos?.marca || ""} ${cita.vehiculos?.modelo || ""} ${cita.vehiculos?.anio || ""} (${cita.vehiculos?.placa || ""})`.trim(),
    servicio: cita.servicios?.nombre || "Servicio general",
    sucursal: cita.sucursal === "quito" ? "Quito" : "Guayaquil",
    fecha: cita.fecha_hora_fmt || cita.fecha_hora || "",
    mapsLink: SUCURSAL_MAPS[cita.sucursal] || "",
    nota: notasAdmin || "",
  };

  return waLink(telefono, config.buildMensaje(params));
}
