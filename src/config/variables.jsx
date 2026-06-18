const DEV = import.meta.env.DEV === true;

export const API_BASE_URL = DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "";

export const endpoints = {
  searchGlobal: `${API_BASE_URL}/search`,

  login: `${API_BASE_URL}/auth/login`,
  addVehiculo: `${API_BASE_URL}/vehiculos/`,
  getVehiculos: `${API_BASE_URL}/vehiculos/`,
  getVehiculosDisponibles: `${API_BASE_URL}/vehiculos/disponibles`,
  deleteVehiculo: `${API_BASE_URL}/vehiculos/`,
  restoreVehiculo: `${API_BASE_URL}/vehiculos/`,
  getRegistros: `${API_BASE_URL}/registros/`,
  getRegistroactivo: `${API_BASE_URL}/registros/empleados/`,
  registrarSalida: `${API_BASE_URL}/registros/salida`,
  registrarRegreso: `${API_BASE_URL}/registros/regreso`,
  resgistrarImagenes: `${API_BASE_URL}/registros/`,
  getCiudades: `${API_BASE_URL}/registros/ciudades`,
  dashboard: `${API_BASE_URL}/dashboard`,
  registerUsers: `${API_BASE_URL}/auth/register`,
  getUsers: `${API_BASE_URL}/auth/usuarios`,
  getEmailSupervisor: `${API_BASE_URL}/auth/email-supervisor`,
  updateUser: `${API_BASE_URL}/auth/usuarios/`,
  getUsersById: `${API_BASE_URL}/auth/usuarios/`,
  deleteUser: `${API_BASE_URL}/auth/usuarios/`,
  restoreUser: `${API_BASE_URL}/auth/usuarios/`,
  updateMyAccount: `${API_BASE_URL}/auth/usuarios/perfil/`,
  resetPassword: `${API_BASE_URL}/auth/reset-password`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  getUbicaciones: `${API_BASE_URL}/vehiculos/ubicaciones`,
  getEmpleados: `${API_BASE_URL}/empleados/`,
  // Reservas: `${API_BASE_URL}/reservas`,
  getCountries: `${API_BASE_URL}/countries/`,
  addCountry: `${API_BASE_URL}/countries/`,
  updateCountry: `${API_BASE_URL}/countries/`,
  deleteCountry: `${API_BASE_URL}/countries/`,
  getCities: `${API_BASE_URL}/cities/`,
  addCity: `${API_BASE_URL}/cities/`,
  updateCity: `${API_BASE_URL}/cities/`,
  deleteCity: `${API_BASE_URL}/cities/`,
  getParkings: `${API_BASE_URL}/parkings/`,
  addParking: `${API_BASE_URL}/parkings/`,
  updateParking: `${API_BASE_URL}/parkings/`,
  deleteParking: `${API_BASE_URL}/parkings/`,
  getUserPermissions: `${API_BASE_URL}/permisos/`,
  updateUserPermissions: `${API_BASE_URL}/permisos/asignar`,
  getUserPermissionsList: `${API_BASE_URL}/permisos/usuarios`,
  getPermisos: `${API_BASE_URL}/permisos`,

  // Roles
  getRoles: `${API_BASE_URL}/roles`,
  getRoleById: `${API_BASE_URL}/roles/`,
  createRole: `${API_BASE_URL}/roles`,
  updateRole: `${API_BASE_URL}/roles/`,
  deleteRole: `${API_BASE_URL}/roles/`,
  updateRolePermisos: `${API_BASE_URL}/roles/`,

  // NOTIFICACIONES
  sendMail: `${API_BASE_URL}/mail/`,
  sendNotificacionSalida: `${API_BASE_URL}/mail/notification-salida`,
  sendNotificacionEntrada: `${API_BASE_URL}/mail/notification-regreso`,

  // GRUPOS DE NOTIFICACIÓN
  getGroups: `${API_BASE_URL}/grupos/`,
  getGroup: `${API_BASE_URL}/grupos/`,
  addGroup: `${API_BASE_URL}/grupos/`,
  updateGroup: `${API_BASE_URL}/grupos/`,
  deleteGroup: `${API_BASE_URL}/grupos/`,

  // USUARIOS DE GRUPOS DE NOTIFICACIÓN
  getGroupUsers: `${API_BASE_URL}/grupo-usuarios/`,
  getGroupUser: `${API_BASE_URL}/grupo-usuarios/`,
  addGroupUser: `${API_BASE_URL}/grupo-usuarios/`,
  updateGroupUser: `${API_BASE_URL}/grupo-usuarios/`,
  deleteGroupUser: `${API_BASE_URL}/grupo-usuarios/`,

  // REPORTES — Existentes
  getRegisterReport: `${API_BASE_URL}/reports/registros/`,
  getEmpleadosMasSalidas: `${API_BASE_URL}/reports/reportes/empleados-mas-salidas`,
  getKilometrajePorEmpleado: `${API_BASE_URL}/reports/reportes/kilometraje-por-empleado`,
  getVehiculosMasUtilizados: `${API_BASE_URL}/reports/reportes/vehiculos-mas-utilizados`,
  getRegistrosPorUbicacion: `${API_BASE_URL}/reports/reportes/registros-por-ubicacion`,
  getConsumoCombustibleVehiculo: `${API_BASE_URL}/reports/reportes/consumo-combustible-vehiculo`,

  // REPORTES — Nuevos
  getViajesDuracion: `${API_BASE_URL}/reports/reportes/viajes-duracion`,
  getActividadSemanal: `${API_BASE_URL}/reports/reportes/actividad-semanal`,
  getReservasEstado: `${API_BASE_URL}/reports/reportes/reservas-estado`,
  getReservasPorEmpleado: `${API_BASE_URL}/reports/reportes/reservas-empleado`,
  getViaticosEstado: `${API_BASE_URL}/reports/reportes/viaticos-estado`,
  getViaticosEmpleados: `${API_BASE_URL}/reports/reportes/viaticos-empleados`,
  getViaticosporTipo: `${API_BASE_URL}/reports/reportes/viaticos-tipo`,
  getActivosEstado: `${API_BASE_URL}/reports/reportes/activos-estado`,
  getBodegasOcupacion: `${API_BASE_URL}/reports/reportes/bodegas-ocupacion`,

  // Home / Dashboard legacy
  getTotalEmpleados: `${API_BASE_URL}/reports/reportes/total-empleados`,
  getTotalVehiculos: `${API_BASE_URL}/reports/reportes/total-vehiculos`,
  getVehiculosEnUso: `${API_BASE_URL}/reports/reportes/vehiculos-en-uso`,
  getVehiculosEnMantenimiento: `${API_BASE_URL}/reports/reportes/vehiculos-en-mantenimiento`,

  // Dashboard nuevos
  getDashboardKpis:  `${API_BASE_URL}/reports/reportes/dashboard-kpis`,
  getActividad7Dias: `${API_BASE_URL}/reports/reportes/actividad-7dias`,

  // HELP (PUBLIC)
  helpFaqs: `${API_BASE_URL}/help/faqs`,
  helpFaqBySlug: (slug) => `${API_BASE_URL}/help/faqs/${slug}`,
  helpFaqHelpful: (id) => `${API_BASE_URL}/help/faqs/${id}/helpful`,

  helpTutorials: `${API_BASE_URL}/help/tutorials`,
  helpTutorialBySlug: (s) => `${API_BASE_URL}/help/tutorials/${s}`,

  // HELP (admin)
  adminFaqs: `${API_BASE_URL}/admin/help/faqs`, // POST (crear), GET si quisieras un endpoint admin
  adminFaqById: `${API_BASE_URL}/admin/help/faqs/`, // + :id  (PUT/DELETE)
  adminTutorials: `${API_BASE_URL}/admin/help/tutorials`, // POST
  adminTutorialById: `${API_BASE_URL}/admin/help/tutorials/`, // + :id (PUT/DELETE)
  adminTutorialSteps: `${API_BASE_URL}/admin/help/tutorials/`, // + :id/steps (POST replace)
  adminTutorialAttachments: `${API_BASE_URL}/admin/help/tutorials/`, // + :id/attachments (POST replace)
  adminChangelogs: `${API_BASE_URL}/admin/help/changelogs`, // POST
  adminChangelogById: `${API_BASE_URL}/admin/help/changelogs/`, // + :id (PUT/DELETE)
  adminStatusOverall: `${API_BASE_URL}/admin/help/status/overall`, // POST
  adminStatusServices: `${API_BASE_URL}/admin/help/status/services`, // POST

  // INVENTARIO
  getClientes: `${API_BASE_URL}/clientes/`,
  addCliente: `${API_BASE_URL}/clientes/`,
  updateCliente: `${API_BASE_URL}/clientes/`,

  getSites: `${API_BASE_URL}/sites/`,
  addSite: `${API_BASE_URL}/sites/`,
  updateSite: `${API_BASE_URL}/sites/`,

  // Bodegas
  getBodegas: `${API_BASE_URL}/inventario/bodegas/`,
  addBodega: `${API_BASE_URL}/inventario/bodegas/`,
  updateBodega: `${API_BASE_URL}/inventario/bodegas/`,

  // Activos
  getActivos: `${API_BASE_URL}/inventario/activos/`,
  getActivoById: `${API_BASE_URL}/inventario/activos/`,
  addActivo: `${API_BASE_URL}/inventario/activos/`,
  updateActivo: `${API_BASE_URL}/inventario/activos/`,
  getActivosByCliente: `${API_BASE_URL}/inventario/activos/cliente/`,

  // Activos por bodega
  getActivosByBodega: `${API_BASE_URL}/inventario/activos/bodega/`,
  // getActivosEnBodegas: `${API_BASE_URL}/inventario/activos/bodegas/all`,
  getActivosGlobal: `${API_BASE_URL}/inventario/activos/all`,

  // Ubicaciones
  moverActivo: `${API_BASE_URL}/inventario/ubicaciones/mover`,
  movimientosByActivo: `${API_BASE_URL}/inventario/ubicaciones/movimientos/`,

  // Notificaciones
  notifEventos: `${API_BASE_URL}/notificaciones/eventos/`, // lista, create, get/:id, put/:id, delete/:id
  notifEventosEstado: `${API_BASE_URL}/notificaciones/eventos/`, // patch :id/estado
  notifEventosGrupos: `${API_BASE_URL}/notificaciones/eventos/`, // get/put :id/grupos

  notifGrupos: `${API_BASE_URL}/notificaciones/grupos/`, // lista, create, get/:id, put/:id, delete/:id
  notifGruposUsuarios: `${API_BASE_URL}/notificaciones/grupos/`, // GET/POST :id/usuarios
  notifGruposUsuarioDel: `${API_BASE_URL}/notificaciones/grupos/`, // DELETE :id/usuarios/:id_usuario
  notifGruposCanales: `${API_BASE_URL}/notificaciones/grupos/`, // GET/PUT :id/canales

  notifPlantillas: `${API_BASE_URL}/notificaciones/plantillas/`, // lista, create, get? (no usamos), put/:id, delete/:id
  notifPlantillasPreview: `${API_BASE_URL}/notificaciones/plantillas/preview`, // POST
  notifPlantillasPublish: `${API_BASE_URL}/notificaciones/plantillas/`, // POST :id/publicar
  notifPlantillasTest: `${API_BASE_URL}/notificaciones/plantillas/`, // POST :id/test

  notifConfig: `${API_BASE_URL}/notificaciones/config/`,

  //viaticos
  // viaticos: `${API_BASE_URL}/viaticos`,
  // viaticosCiudades: `${API_BASE_URL}/viaticos/ciudades`,
  // viaticosLiquidaciones: `${API_BASE_URL}/viaticos/liquidaciones`,
  // viaticosComprobantes: `${API_BASE_URL}/viaticos/comprobantes`,

  // VIATICOS
  getViaticos: `${API_BASE_URL}/viaticos`,
  getViatico: `${API_BASE_URL}/viaticos/`,
  createViatico: `${API_BASE_URL}/viaticos`,
  updateViatico: `${API_BASE_URL}/viaticos/`,
  deleteViatico: `${API_BASE_URL}/viaticos/`,
  aprobarViatico: `${API_BASE_URL}/viaticos/`,
  cancelarViatico: `${API_BASE_URL}/viaticos/`,
  enviarRevisionViatico: `${API_BASE_URL}/viaticos/`,

  // RUTAS
  getRutas: `${API_BASE_URL}/rutas`,
  getRuta: `${API_BASE_URL}/rutas/`,
  createRuta: `${API_BASE_URL}/rutas`,
  updateRuta: `${API_BASE_URL}/rutas/`,
  deleteRuta: `${API_BASE_URL}/rutas/`,

  // PEAJES
  getPeajes: `${API_BASE_URL}/peajes`,
  getPeaje: `${API_BASE_URL}/peajes/`,
  getPeajesByRuta: `${API_BASE_URL}/peajes/rutas/`,
  createPeaje: `${API_BASE_URL}/peajes`,
  updatePeaje: `${API_BASE_URL}/peajes/`,
  deletePeaje: `${API_BASE_URL}/peajes/`,

  // RESERVAS (Corregidas todas)
  getReservas: `${API_BASE_URL}/reservas/`,
  getReserva: `${API_BASE_URL}/reservas/`,
  createReserva: `${API_BASE_URL}/reservas/`,
  updateReserva: `${API_BASE_URL}/reservas/`,
  iniciarReserva: `${API_BASE_URL}/reservas/`,
  finalizarReserva: `${API_BASE_URL}/reservas/`,
  cancelarReserva: `${API_BASE_URL}/reservas/`,
  deleteReserva: `${API_BASE_URL}/reservas/`,
  extenderReserva: `${API_BASE_URL}/reservas/`,

  // OPERACIONES
  operacionesSalida: `${API_BASE_URL}/operaciones/salida`,
  operacionesRegreso: `${API_BASE_URL}/operaciones/regreso`,
  getOperacionActiva: `${API_BASE_URL}/operaciones/activa/`,

  // BACKUP
  backupManual: `${API_BASE_URL}/backup/manual`,
  backupDownload: `${API_BASE_URL}/backup/download`,
  backupList: `${API_BASE_URL}/backup/list`,
  backupRestoreInit: `${API_BASE_URL}/backup/restore/init`,
  backupRestoreExecute: `${API_BASE_URL}/backup/restore/execute`,

  // ajustes / settings
  getSettings: `${API_BASE_URL}/settings/`,
  getSection: `${API_BASE_URL}/settings/`,
  patchSection: `${API_BASE_URL}/settings/`,
  getSectionHistory: `${API_BASE_URL}/settings/`,

  // sesiones
  sessions: `${API_BASE_URL}/auth/sessions`,
  activityLogs: `${API_BASE_URL}/auth/activity-logs`,
  revokeSessions: `${API_BASE_URL}/auth/sessions/revoke`,

  webauthnRegisterOptions: `${API_BASE_URL}/webauthn/register/options`,
  webauthnRegisterVerify: `${API_BASE_URL}/webauthn/register/verify`,
  webauthnLoginOptions: `${API_BASE_URL}/webauthn/login/options`,
  webauthnLoginVerify: `${API_BASE_URL}/webauthn/login/verify`,

  webauthnStatus: `${API_BASE_URL}/webauthn/status`,
  webauthnList: `${API_BASE_URL}/webauthn/passkeys`,
  webauthnDelete: `${API_BASE_URL}/webauthn/passkeys`,
  webauthnUpdateName: `${API_BASE_URL}/webauthn/passkeys`,
};

// src/js/config/variables.js
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
};
