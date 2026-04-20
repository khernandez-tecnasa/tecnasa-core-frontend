// Catálogos de Inventario (única fuente de verdad)
export const ESTATUS_ACTIVO = [
  "Activo",
  "Arrendado",
  "Backup",
  "Inactivo",
  "En Mantenimiento",
  "Reciclado",
  "Propiedad del Cliente",
];

export const TIPOS_ACTIVO = [
  "Impresora",
  "ATM",
  "Escáner",
  "Ploter",
  "UPS",
  "Silla",
  "Mueble",
  "Laptop",
  "Desktop",
  "Mesa",
  "Audifonos",
  "Monitor",
  "Mochila",
  "Escritorio",
  "Celular",
  "Otro",
];

// Mapeo útil para chips/colores
export const ESTATUS_COLOR = {
  Activo: "success",
  Arrendado: "primary",
  "En Mantenimiento": "warning",
  Inactivo: "danger",
  Reciclado: "neutral",
};

// -------- Productos (por cantidad) --------
export const PRODUCTO_UNIDADES = ["pieza", "unidad", "paquete", "caja"];
export const PRODUCTO_TIPOS = ["Equipo", "Parte", "Consumible"];

// -------- Usuarios (roles / puestos) --------
export const ROLES_USUARIO = [
  "Empleado",
  "Supervisor",
  "Tecnico",
  "Finanzas",
  // si quieres agregar "Admin" como seleccionable, lo añades aquí
];

export const PUESTOS_USUARIO = [
  "Gerente de Ingeniería",
  "Gerente de Finanzas",
  "Oficial de servicios",
  "Supervisor Tecnico - ATM",
  "Supervisor Tecnico - Microsistemas",
  "Técnico de ATM",
  "Técnico de Microsistemas",
  "Técnico de Alta Disponibilidad",
  "Técnico de Soporte",
  "Técnico de Inventario",
  "Asistente de Contabilidad",
  "Asistente de Cuentas por Cobrar",
  "Especialista de Soluciones",
];

// Helper para Select/Autocomplete
export const toOptions = (arr) => arr.map((v) => ({ label: v, value: v }));
