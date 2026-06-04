# Manual de Usuario — Tecnasa Core

**Versión:** 2.9.1  
**Última actualización:** Junio 2026

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
   - [Inicio de Sesión](#21-inicio-de-sesión)
   - [Recuperación de Contraseña](#22-recuperación-de-contraseña)
   - [Autenticación en Dos Pasos (2FA)](#23-autenticación-en-dos-pasos-2fa)
3. [Navegación General](#3-navegación-general)
   - [Barra lateral](#31-barra-lateral)
   - [Búsqueda Global](#32-búsqueda-global-ctrlk)
   - [Notificaciones](#33-notificaciones)
4. [Módulo: Inicio y Dashboard](#4-módulo-inicio-y-dashboard)
5. [Módulo: Vehículos](#5-módulo-vehículos)
   - [Lista de Vehículos](#51-lista-de-vehículos)
   - [Crear / Editar Vehículo](#52-crear--editar-vehículo)
   - [Código QR del Vehículo](#53-código-qr-del-vehículo)
   - [Historial del Vehículo](#54-historial-del-vehículo)
6. [Módulo: Panel de Operaciones](#6-módulo-panel-de-operaciones)
7. [Módulo: Rutas](#7-módulo-rutas)
8. [Módulo: Reservas de Vehículos](#8-módulo-reservas-de-vehículos)
9. [Módulo: Viáticos](#9-módulo-viáticos)
10. [Módulo: Peajes](#10-módulo-peajes)
11. [Módulo: Clientes / Compañías](#11-módulo-clientes--compañías)
12. [Módulo: Inventario](#12-módulo-inventario)
    - [Bodegas](#121-bodegas)
    - [Activos](#122-activos)
13. [Módulo: Reportes](#13-módulo-reportes)
14. [Módulo: Usuarios](#14-módulo-usuarios)
15. [Módulo: Roles y Permisos](#15-módulo-roles-y-permisos)
16. [Módulo: Ubicaciones](#16-módulo-ubicaciones)
17. [Módulo: Estacionamientos](#17-módulo-estacionamientos)
18. [Módulo: Grupos de Notificación](#18-módulo-grupos-de-notificación)
19. [Módulo: Centro de Ayuda](#19-módulo-centro-de-ayuda)
20. [Mi Cuenta](#20-mi-cuenta)
21. [Configuración](#21-configuración)
22. [Sistema de Permisos](#22-sistema-de-permisos)
23. [Preguntas Frecuentes](#23-preguntas-frecuentes)

---

## 1. Introducción

**Tecnasa Core** es un sistema de gestión empresarial que centraliza el control de vehículos, operaciones de campo, viáticos, inventario y logística. Está diseñado para organizaciones que necesitan llevar un registro detallado del uso de su flota vehicular, los gastos de sus colaboradores, y el movimiento de sus activos.

### ¿Qué puedo hacer con Tecnasa Core?

- Registrar la salida y regreso de vehículos mediante códigos QR
- Gestionar reservas de vehículos con un calendario interactivo
- Controlar gastos y viáticos de empleados
- Administrar rutas y peajes asociados
- Llevar un inventario de activos por bodega
- Gestionar información de clientes y sus sitios
- Visualizar reportes y estadísticas de uso
- Administrar usuarios, roles y permisos del sistema

> **Nota sobre permisos:** No todas las funciones están disponibles para todos los usuarios. A lo largo de este manual se indica cuando una acción requiere un permiso especial. Si no ve un botón o sección que se describe aquí, es posible que su rol no tenga acceso a esa función. Contacte al administrador del sistema para solicitar acceso.

---

## 2. Acceso al Sistema

### 2.1 Inicio de Sesión

Para ingresar al sistema:

1. Abra el navegador y acceda a la URL de la aplicación.
2. Se mostrará la pantalla de inicio de sesión.
3. Ingrese su **correo electrónico** en el campo correspondiente.
4. Ingrese su **contraseña**.
5. Haga clic en el botón **Iniciar sesión**.

Si las credenciales son correctas, será redirigido automáticamente a la página de inicio.

> Si su cuenta tiene la **autenticación en dos pasos (2FA)** activada, se le pedirá un código adicional antes de ingresar. Ver sección [2.3](#23-autenticación-en-dos-pasos-2fa).

### 2.2 Recuperación de Contraseña

Si olvidó su contraseña:

1. En la pantalla de inicio de sesión, haga clic en **"¿Olvidó su contraseña?"**.
2. Ingrese su correo electrónico registrado.
3. Haga clic en **Enviar enlace**.
4. Revise su bandeja de entrada (y la carpeta de spam).
5. Abra el correo recibido y haga clic en el enlace de recuperación.
6. En la nueva pantalla, ingrese su **nueva contraseña** y confírmela.
7. Haga clic en **Restablecer contraseña**.
8. Será redirigido al inicio de sesión con su nueva contraseña activa.

> El enlace de recuperación tiene una validez limitada. Si expiró, repita el proceso desde el paso 1.

### 2.3 Autenticación en Dos Pasos (2FA)

Si el administrador habilitó la autenticación en dos pasos para su cuenta:

1. Después de ingresar sus credenciales, aparecerá un campo adicional solicitando un **código de verificación**.
2. Abra su aplicación de autenticación (Google Authenticator, Authy, etc.) o revise su correo/SMS.
3. Ingrese el código de 6 dígitos mostrado.
4. Haga clic en **Verificar**.

> Puede configurar o deshabilitar el 2FA desde **Mi Cuenta > Seguridad** si tiene los permisos necesarios.

---

## 3. Navegación General

### 3.1 Barra lateral

La barra lateral izquierda es el menú principal del sistema. Está organizada en secciones:

| Sección | Módulos incluidos |
|---------|-------------------|
| **General** | Inicio, Dashboard, Vehículos, Panel de operaciones, Reportes |
| **Logística** | Rutas, Reservas, Viáticos, Peajes |
| **Gestión** | Clientes, Países, Ciudades, Estacionamientos |
| **Inventario** | Bodegas, Activos |
| **Sistema** | Usuarios, Roles, Notificaciones, Grupos |
| **Soporte** | Centro de ayuda, FAQs, Tutoriales, Novedades, Estado de servicios |
| **Configuración** | Configuraciones generales, Mi cuenta |

> Solo verá en el menú las secciones y módulos para los que tiene permiso de acceso.

Para colapsar o expandir la barra lateral, haga clic en el ícono de menú (☰) en la parte superior.

En dispositivos móviles, la navegación principal se mueve a una barra inferior.

### 3.2 Búsqueda Global (Ctrl+K)

Puede buscar cualquier elemento del sistema de forma rápida:

1. Presione **Ctrl + K** (o haga clic en el ícono de búsqueda en el encabezado).
2. Escriba el término que desea buscar (nombre de vehículo, usuario, ruta, etc.).
3. Los resultados aparecerán agrupados por tipo de entidad.
4. Haga clic en un resultado para navegar directamente a ese registro.

### 3.3 Notificaciones

El ícono de campana en el encabezado muestra sus notificaciones activas. Haga clic en él para ver el listado. Las notificaciones le informan sobre eventos importantes como aprobaciones de viáticos, reservas confirmadas, entre otros.

---

## 4. Módulo: Inicio y Dashboard

**Ruta:** `/admin/home` y `/admin/dashboard`

### Inicio (Home)

La página de inicio muestra:

- **Widget de clima:** Temperatura y condición climática actual de la ubicación configurada.
- **Reloj en vivo:** Hora actual según la zona horaria configurada en su cuenta.
- **Novedades:** Últimas actualizaciones y cambios publicados por el equipo de soporte.

### Dashboard

El dashboard presenta estadísticas generales del sistema en forma de tarjetas y gráficos, como:

- Cantidad de vehículos activos
- Operaciones recientes
- Reservas vigentes
- Actividad general

> **Permiso requerido:** `ver_dashboard`

---

## 5. Módulo: Vehículos

**Ruta:** `/admin/vehiculos`  
**Permiso para ver:** `ver_vehiculos` o `gestionar_vehiculos`

Este módulo permite administrar toda la flota vehicular de la organización.

### 5.1 Lista de Vehículos

Al ingresar al módulo verá una tabla con todos los vehículos registrados. La tabla incluye:

- Placa del vehículo
- Marca y modelo
- Año
- Estado (Activo / Inactivo)
- Ubicación actual (si está registrada)
- Acciones disponibles

**Opciones de búsqueda y filtro:**

- **Buscador:** Filtra vehículos por placa, marca o modelo en tiempo real.
- **Filtro de estado:** Puede ver solo vehículos activos, inactivos, o todos.

**Botones y acciones en la tabla:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo vehículo** | Abre el formulario para registrar un vehículo | `crear_vehiculo` |
| **Ver** (ícono ojo) | Abre los detalles del vehículo | `ver_vehiculos` |
| **Editar** (ícono lápiz) | Abre el formulario de edición | `editar_vehiculo` |
| **Generar QR** | Genera el código QR del vehículo | `crear_QR` |
| **Inactivar** | Desactiva el vehículo del sistema | `eliminar_vehiculo` |
| **Restaurar** | Reactiva un vehículo inactivo | `restaurar_usuario` |
| **Ver historial** | Muestra el historial de cambios del vehículo | `ver_vehiculos` |

> Si un vehículo tiene un registro de salida pendiente (sin regreso registrado), el sistema mostrará una alerta al intentar inactivarlo.

### 5.2 Crear / Editar Vehículo

Al hacer clic en **Nuevo vehículo** o **Editar**, se abre un formulario con los siguientes campos:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Placa** | Sí | Identificador único del vehículo. Ej: `ABC-123` |
| **Marca** | Sí | Fabricante del vehículo. Ej: `Toyota` |
| **Modelo** | Sí | Nombre del modelo. Ej: `Corolla 2022` |
| **Estado** | Sí | Estado actual: `Disponible`, `En Uso`, `En Mantenimiento`, `Reservado` o `Inactivo` |
| **Ubicación actual** | Sí | Selección de la lista de ubicaciones registradas en el sistema |

Para guardar:

1. Complete los cinco campos obligatorios.
2. Haga clic en **Crear vehículo** (o **Guardar cambios** si está editando).
3. Si algún campo obligatorio está vacío, el formulario marcará el error sin permitir el envío.
4. Al guardar correctamente, el sistema regresa a la lista de vehículos.

### 5.3 Código QR del Vehículo

Cada vehículo tiene un código QR único que permite registrar salidas y regresos sin necesidad de buscar el vehículo manualmente.

Para generar y usar el QR:

1. En la lista de vehículos, haga clic en el ícono de **QR** del vehículo deseado.
2. Aparecerá un modal con el código QR generado.
3. Puede:
   - **Descargar** el QR como imagen PNG.
   - **Copiar el enlace** directo del QR.
   - **Probar el enlace** para verificar que funciona correctamente.
4. Imprima el QR y colóquelo en el vehículo (tablero, llave, etc.).
5. Al escanear el QR con un dispositivo móvil, se abrirá directamente el formulario de registro de uso de ese vehículo.

> **Permiso requerido para generar QR:** `crear_QR`

### 5.4 Historial del Vehículo

Permite ver todos los cambios realizados al registro de un vehículo a lo largo del tiempo. Muestra:

- Fecha y hora del cambio
- Usuario que realizó el cambio
- Campos modificados (valor anterior y valor nuevo)

---

## 6. Módulo: Operaciones de Flota (Registro de Uso)

**Ruta:** `/admin/panel-vehiculos`  
**Permiso para ver:** `ver_vehiculos`  
**Permiso para registrar:** `registrar_uso`

Este es el módulo central del sistema. Permite registrar la **salida** y el **regreso** de los vehículos de la flota. Cada vez que un empleado saca o devuelve un vehículo, debe registrarlo aquí.

### ¿Cómo funciona?

El módulo detecta automáticamente si el usuario tiene una salida activa (vehículo que salió y aún no ha regresado):

| Indicador | Estado | Qué muestra |
|-----------|--------|-------------|
| Verde — "Sistema Disponible" | Sin salida activa | Formulario de **Registro de Salida** |
| Azul — "Sistema En Uso" | Con salida activa | Formulario de **Registro de Regreso** |

> **Importante:** Cada usuario solo puede tener una salida activa a la vez. Primero debe registrar el regreso del vehículo actual antes de poder sacar otro.

---

### 6.1 Registrar Salida de Vehículo

Cuando el indicador está en **verde**, el sistema está listo para registrar una nueva salida.

**Paso 1 — Seleccionar la unidad**

Se muestra un selector con los vehículos disponibles para el usuario. Cada opción indica el estado del vehículo:

- `ABC-123 — Disponible` → puede seleccionarlo
- `XYZ-789 — Reservado para ti` → tiene una reserva activa a su nombre, puede usarlo
- Vehículos en uso o reservados para otro empleado **no aparecen** en la lista

> Al seleccionar el vehículo, si tiene una reserva activa, aparece una alerta naranja indicando el motivo y fechas de la reserva.

**Paso 2 — Revisar datos del último registro (autorrelleno)**

Si el vehículo tiene registros anteriores, el sistema carga automáticamente el último kilómetro, nivel de combustible y punto de control registrados. Estos campos aparecen bloqueados (solo lectura) para que el nuevo registro parta desde ese punto.

**Paso 3 — Estado Técnico**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Odómetro (KM)** | Sí | Lectura actual del cuentakilómetros. Si hay registro anterior, se llena automáticamente |
| **Punto de Control** | Sí | Ubicación desde donde sale el vehículo. Se selecciona de la lista de estacionamientos |
| **Combustible (%)** | No | Nivel de combustible actual (0 a 100%). Si hay registro anterior, se llena automáticamente |
| **Observaciones** | No | Novedades técnicas o estéticas del vehículo antes de salir |

> **Permiso requerido para ver el Punto de Control:** `ver_estacionamientos`. Sin este permiso la lista de puntos aparece vacía.

**Paso 4 — Evidencia fotográfica**

Es obligatorio subir **al menos 1 foto** del vehículo antes de salir (máximo 4 fotos, hasta 6 MB cada una). En dispositivos móviles puede usar directamente la cámara.

**Paso 5 — Confirmar**

Haga clic en **Confirmar Salida**. El sistema registra la fecha y hora exacta del momento del envío.

**Validaciones al registrar salida:**

- El vehículo debe estar disponible (no en uso ni reservado para otro).
- El odómetro no puede ser menor al último registrado para ese vehículo.
- Se requiere al menos una foto.
- El punto de control es obligatorio.

---

### 6.2 Registrar Regreso de Vehículo

Cuando el indicador está en **azul**, significa que el usuario tiene un vehículo en uso. El formulario cambia automáticamente al modo de regreso.

En la parte superior se muestran los **datos de la salida** como referencia:
- KM registrado al salir
- Combustible al salir
- Punto de control de salida

**Campos del regreso:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| **Odómetro (KM)** | Sí | Lectura actual al regresar. Debe ser igual o mayor al KM de salida |
| **Punto de Control** | Sí | Ubicación a donde regresa el vehículo |
| **Combustible (%)** | No | Nivel de combustible al regresar |
| **Observaciones** | No | Novedades técnicas o incidencias del viaje |

Debajo del campo de KM el sistema muestra el **recorrido estimado** (diferencia entre KM de regreso y de salida) en tiempo real.

**Paso final:** Suba las fotos del vehículo al regreso y haga clic en **Confirmar Retorno**.

**Validaciones al registrar regreso:**

- El KM de regreso no puede ser menor al KM de salida.
- Si la diferencia supera 1,000 km, el sistema muestra una advertencia para verificar los datos.
- Se requiere al menos una foto.

---

### 6.3 Acceso por código QR

Cada vehículo tiene un código QR único (generado desde el módulo de Vehículos). Al escanear el QR con un dispositivo móvil, el sistema abre directamente el formulario de operaciones preseleccionando ese vehículo, sin necesidad de buscarlo manualmente.

Esta es la forma más rápida de registrar una salida o regreso en campo.

---

### 6.4 Permisos del módulo

| Acción | Permiso requerido |
|--------|-------------------|
| Ver el módulo | `ver_vehiculos` |
| Ver la lista de puntos de control | `ver_estacionamientos` |
| Registrar salida o regreso | `registrar_uso` |

---

## 7. Módulo: Rutas

**Ruta:** `/admin/rutas`  
**Permiso para ver:** `read_ruta` o `gestionar_rutas`

Permite gestionar las rutas que utilizan los vehículos, incluyendo la visualización en mapa y los peajes asociados.

**Vista principal:**

La lista de rutas muestra el nombre, descripción, cantidad de peajes asociados y el estado de cada ruta.

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nueva ruta** | Abre el formulario de creación | `create_ruta` |
| **Ver en mapa** | Muestra la ruta en el mapa interactivo | `read_ruta` |
| **Ver peajes** | Lista los peajes de esa ruta | `read_ruta` |
| **Editar** | Abre el formulario de edición | `update_ruta` |
| **Eliminar** | Elimina la ruta | `delete_ruta` |
| **Ver historial** | Muestra los cambios históricos de la ruta | `read_ruta` |

**Para crear una ruta:**

1. Haga clic en **Nueva ruta**.
2. Ingrese el **nombre** de la ruta.
3. Añada una **descripción** opcional.
4. En el mapa interactivo, coloque los marcadores de inicio y fin de la ruta.
5. Asocie los **peajes** que correspondan a esta ruta.
6. Haga clic en **Guardar**.

**Vista de mapa:**

El mapa utiliza OpenStreetMap y permite:
- Ver la trayectoria de la ruta
- Identificar los puntos de peaje
- Calcular distancias aproximadas

---

## 8. Módulo: Reservas de Vehículos

**Ruta:** `/admin/reservas-vehiculos`  
**Permiso para ver:** `read_reserva` o `gestionar_reservas`

Permite a los usuarios reservar vehículos para fechas específicas, evitando conflictos de disponibilidad.

**Vistas disponibles:**

- **Vista de tabla:** Lista todas las reservas con filtros y búsqueda.
- **Vista de calendario:** Muestra las reservas en un calendario mensual/semanal.

Puede alternar entre vistas con los botones en la parte superior derecha.

**Estados de una reserva:**

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | La reserva fue creada pero aún no aprobada |
| **Aprobada** | La reserva fue confirmada por un responsable |
| **Cancelada** | La reserva fue cancelada |

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nueva reserva** | Abre el formulario de creación | `create_reserva` |
| **Editar** | Modifica los datos de la reserva | `update_reserva` |
| **Iniciar** | Marca la reserva como en uso | `update_reserva` |
| **Finalizar** | Cierra la reserva activa | `update_reserva` |
| **Cancelar** | Cancela la reserva | `delete_reserva` |
| **Ver historial** | Muestra el historial de cambios | `read_reserva` |

**Para crear una reserva:**

1. Haga clic en **Nueva reserva**.
2. Seleccione el **vehículo** deseado.
3. Ingrese la **fecha y hora de inicio** de la reserva.
4. Ingrese la **fecha y hora de fin** estimada.
5. Añada el **propósito** o motivo de la reserva.
6. Haga clic en **Guardar**.
7. La reserva quedará en estado **Pendiente** hasta ser aprobada.

> Si el vehículo ya tiene una reserva activa en el rango de fechas seleccionado, el sistema mostrará una advertencia de conflicto.

---

## 9. Módulo: Viáticos

**Ruta:** `/admin/viaticos`  
**Permiso para ver:** `read_viatico` o `gestionar_viaticos`

El módulo de viáticos permite registrar, gestionar y liquidar los gastos de viaje de los colaboradores.

**Flujo de un viático:**

```
Borrador → Pendiente (enviado a revisión) → Aprobado / Rechazado → Liquidado
```

**Estados de un viático:**

| Estado | Descripción |
|--------|-------------|
| **Borrador** | Creado pero no enviado a revisión |
| **Pendiente** | Enviado para aprobación |
| **Aprobado** | Aprobado por el responsable |
| **Rechazado** | Rechazado; puede editarse y re-enviarse |
| **Cancelado** | Cancelado por el creador o un administrador |
| **Finalizado** | El viático fue completado |
| **Liquidado** | Los gastos fueron formalmente liquidados |

**Filtros disponibles:**

- **Activos:** Muestra los viáticos en proceso (Borrador, Pendiente, Aprobado).
- **Liquidados:** Muestra los viáticos en estado Liquidado.
- **Todos:** Muestra todos los registros sin importar el estado.

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo viático** | Crea un nuevo viático | `create_viatico` |
| **Editar** | Modifica el viático (solo en Borrador) | `update_viatico` |
| **Enviar a revisión** | Cambia el estado a Pendiente | `enviar_revision_viatico` |
| **Aprobar** | Aprueba el viático en revisión | `aprobar_viatico` |
| **Rechazar** | Rechaza el viático con un motivo | `rechazar_viatico` |
| **Liquidar** | Registra la liquidación del viático | `liquidar_viatico` |
| **Cancelar** | Cancela el viático | `delete_viatico` |
| **Exportar a Excel** | Descarga los viáticos filtrados en Excel | `read_viatico` |
| **Ver historial** | Muestra el historial de cambios | `read_viatico` |

**Para crear un viático:**

1. Haga clic en **Nuevo viático**.
2. Complete los datos generales:
   - **Título** o descripción del viático
   - **Fecha de inicio y fin** del período
   - **Destino** del viaje
   - **Moneda**
3. Añada los **gastos** individuales (hospedaje, alimentación, transporte, etc.) con sus montos y comprobantes.
4. Haga clic en **Guardar** para crear el viático en estado Borrador.
5. Cuando esté listo, haga clic en **Enviar a revisión**.

**Para liquidar un viático aprobado:**

> **Permiso requerido:** `liquidar_viatico`

1. Localice el viático con estado Aprobado.
2. Haga clic en **Liquidar**.
3. Complete el formulario de liquidación con el detalle de pagos.
4. Haga clic en **Confirmar liquidación**.

---

## 10. Módulo: Peajes

**Ruta:** `/admin/peajes`  
**Permiso para ver:** `read_peaje` o `gestionar_peajes`

Gestiona los puntos de peaje asociados a las rutas de la organización.

**Información de un peaje:**

- Nombre del peaje
- Ubicación
- Tarifa
- Rutas a las que pertenece

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo peaje** | Crea un nuevo punto de peaje | `create_peaje` |
| **Editar** | Modifica los datos del peaje | `update_peaje` |
| **Eliminar** | Elimina el peaje | `delete_peaje` |
| **Ver historial** | Muestra el historial de cambios | `read_peaje` |

---

## 11. Módulo: Clientes / Compañías

**Ruta:** `/admin/clientes`  
**Permiso para ver:** `ver_companias` o `gestionar_companias`

Permite gestionar la información de los clientes o compañías que trabajan con la organización.

**Vista principal:**

La tabla muestra el logo, nombre, estado (Activo/Inactivo) y acciones disponibles de cada cliente.

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo cliente** | Crea una nueva compañía | `crear_companias` |
| **Ver detalle** | Abre la vista detallada del cliente | `ver_companias` |
| **Editar** | Modifica los datos del cliente | `crear_companias` |
| **Inactivar** | Desactiva al cliente | `crear_companias` |

**Detalle de un cliente:**

Al hacer clic en **Ver detalle**, se abre una vista con pestañas:

- **Información general:** Datos básicos (nombre, RUC/NIT, dirección, contacto, logo).
- **Contratos:** Contratos asociados al cliente y sus fechas de vigencia.
- **Sitios:** Sucursales o ubicaciones del cliente.
- **Activos:** Activos del inventario asignados a este cliente.

---

## 12. Módulo: Inventario

### 12.1 Bodegas

**Ruta:** `/admin/inventario/bodegas`  
**Permiso para ver:** `ver_bodegas` o `gestionar_bodegas`

Las bodegas son los contenedores físicos donde se almacenan los activos.

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nueva bodega** | Crea una nueva bodega | `crear_bodegas` |
| **Editar** | Modifica los datos de la bodega | `editar_bodegas` |
| **Ver detalle** | Abre la bodega con sus activos y movimientos | `ver_bodegas` |

**Detalle de una bodega:**

- Lista de activos dentro de la bodega
- Historial de movimientos (entradas y salidas)
- Estadísticas de ocupación

**Filtros:** Puede filtrar bodegas por ciudad.

### 12.2 Activos

**Ruta:** `/admin/inventario/activos`  
**Permiso para ver:** `gestionar_activos`

Gestiona todos los activos físicos de la organización (equipos, herramientas, mobiliario, etc.).

**Opciones de búsqueda y filtro:**

- Búsqueda por nombre o código del activo
- Filtro por bodega
- Filtro por cliente
- Filtro por estado del activo

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo activo** | Crea un nuevo activo | `crear_activos` |
| **Importar activos** | Carga masiva desde archivo | `crear_activos` |
| **Editar** | Modifica los datos del activo | `gestionar_activos` |
| **Mover activo** | Transfiere el activo a otra bodega | `gestionar_activos` |
| **Ver historial** | Muestra el historial de movimientos | `gestionar_activos` |

**Para mover un activo:**

1. Haga clic en **Mover activo** (ícono de transferencia).
2. Seleccione la **bodega destino**.
3. Ingrese la **fecha del movimiento**.
4. Añada **notas** u observaciones del traslado.
5. Haga clic en **Confirmar movimiento**.

**Para importar activos masivamente:**

1. Haga clic en **Importar activos**.
2. Descargue la plantilla de Excel disponible.
3. Complete la plantilla con los datos de los activos.
4. Cargue el archivo completado.
5. Revise la vista previa del import.
6. Confirme la importación.

---

## 13. Módulo: Reportes

**Ruta:** `/admin/reports`  
**Permiso para ver:** `ver_reportes`

Este módulo centraliza los reportes estadísticos del uso del sistema.

**Reportes disponibles:**

| Reporte | Descripción |
|---------|-------------|
| **Registros de entrada/salida** | Historial completo de operaciones de vehículos en un período |
| **Empleados con más salidas** | Ranking de usuarios con mayor cantidad de viajes |
| **Kilometraje por empleado** | Distancia total recorrida por cada usuario |
| **Vehículos más utilizados** | Ranking de vehículos por frecuencia de uso |
| **Registros por ubicación** | Operaciones agrupadas por lugar de salida/llegada |
| **Consumo de combustible** | Consumo por vehículo en el período seleccionado |

**Para generar un reporte:**

1. Seleccione el **tipo de reporte** deseado.
2. Configure los **filtros**:
   - Rango de fechas (inicio y fin)
   - Vehículos específicos (opcional)
   - Usuarios específicos (opcional)
3. Haga clic en **Generar reporte**.
4. El sistema mostrará los resultados en una tabla con gráficos.
5. Haga clic en **Exportar a Excel** para descargar los datos.

---

## 14. Módulo: Usuarios

**Ruta:** `/admin/usuarios`  
**Permiso para ver:** `ver_usuarios` o `gestionar_usuarios`

Permite administrar las cuentas de los colaboradores que tienen acceso al sistema.

**Información mostrada en la tabla:**

- Nombre completo
- Correo electrónico
- Rol asignado
- Estado (Activo / Inactivo)
- Fecha de creación

**Botones y acciones:**

| Botón / Acción | Descripción | Permiso requerido |
|----------------|-------------|-------------------|
| **Nuevo usuario** | Crea una nueva cuenta de usuario | `crear_usuario` |
| **Editar** | Modifica los datos del usuario | `editar_usuario` |
| **Ver historial** | Muestra el historial de auditoría | `ver_usuarios` |
| **Inactivar** | Deshabilita el acceso del usuario | `eliminar_usuario` |
| **Restaurar** | Reactiva un usuario inactivo | `restaurar_usuario` |
| **Asignar permisos** | Abre el panel de permisos del usuario | `asignar_permisos` |

**Para crear un usuario:**

1. Haga clic en **Nuevo usuario**.
2. Complete los datos:
   - **Nombre** y **apellido** (requeridos)
   - **Correo electrónico** (requerido, debe ser único)
   - **Contraseña** temporal (requerida)
   - **Rol** (requerido)
   - **Teléfono** (opcional)
   - **Foto de perfil** (opcional)
3. Haga clic en **Guardar**.
4. El sistema enviará un correo de bienvenida con las credenciales al nuevo usuario.

> **Nota:** Solo los usuarios con el permiso `asignar_permisos` pueden asignar roles y permisos individualmente.

---

## 15. Módulo: Roles y Permisos

**Ruta:** `/admin/roles`  
**Permiso requerido:** `asignar_permisos` (solo administradores)

Este módulo permite definir los roles del sistema y los permisos que tiene cada rol. Es fundamental para controlar qué puede hacer cada usuario.

**Vista principal:**

La tabla muestra los roles disponibles con la cantidad de permisos asignados a cada uno.

**Botones y acciones:**

| Botón / Acción | Descripción |
|----------------|-------------|
| **Nuevo rol** | Crea un nuevo rol |
| **Editar** | Modifica el nombre del rol |
| **Asignar permisos** | Abre el panel de configuración de permisos del rol |
| **Eliminar** | Elimina el rol (si no tiene usuarios asignados) |
| **Ver historial** | Muestra los cambios históricos del rol |

**Para asignar permisos a un rol:**

1. Haga clic en el ícono de permisos del rol deseado.
2. Se mostrará la lista de permisos agrupados por módulo (Usuarios, Vehículos, Rutas, etc.).
3. Active o desactive los permisos usando los toggles o checkboxes.
4. Los cambios se aplican automáticamente.

> **Precaución:** Modificar los permisos de un rol afecta a todos los usuarios que tienen ese rol asignado. Proceda con cuidado.

---

## 16. Módulo: Ubicaciones

### Países

**Ruta:** `/admin/countries`  
**Permiso para ver:** `ver_paises` o `gestionar_paises`

| Acción | Permiso requerido |
|--------|-------------------|
| Ver países | `ver_paises` |
| Crear país | `crear_paises` |
| Editar país | `editar_paises` |
| Eliminar país | `eliminar_paises` |

### Ciudades

**Ruta:** `/admin/cities`  
**Permiso requerido:** `gestionar_ciudades`

Las ciudades están asociadas a un país. Al crear una ciudad debe seleccionar el país al que pertenece.

---

## 17. Módulo: Estacionamientos

**Ruta:** `/admin/parkings`  
**Permiso para ver:** `gestionar_estacionamientos` o `ver_estacionamientos`

Permite registrar los estacionamientos disponibles para los vehículos de la flota.

**Información de un estacionamiento:**

- Nombre
- Dirección
- Ciudad
- Capacidad (cantidad de espacios)
- Estado (Activo / Inactivo)

| Acción | Permiso requerido |
|--------|-------------------|
| Crear estacionamiento | `crear_estacionamientos` |
| Editar estacionamiento | `gestionar_estacionamientos` |

---

## 18. Módulo: Grupos de Notificación

**Ruta:** `/admin/notificacion-grupos`

Permite crear grupos de usuarios para enviarles notificaciones conjuntas sobre eventos del sistema.

**Botones y acciones:**

| Botón / Acción | Descripción |
|----------------|-------------|
| **Nuevo grupo** | Crea un nuevo grupo de notificación |
| **Editar** | Modifica el nombre o descripción del grupo |
| **Agregar usuarios** | Incorpora usuarios al grupo |
| **Remover usuario** | Elimina un usuario del grupo |
| **Eliminar grupo** | Elimina el grupo completo |

**Para crear un grupo:**

1. Haga clic en **Nuevo grupo**.
2. Ingrese el **nombre** del grupo.
3. Añada una **descripción** opcional.
4. Seleccione los **usuarios** que pertenecerán al grupo.
5. Haga clic en **Guardar**.

---

## 19. Módulo: Centro de Ayuda

**Ruta:** `/admin/help`

El Centro de Ayuda está disponible para todos los usuarios y contiene recursos de soporte.

**Secciones disponibles:**

| Sección | Descripción |
|---------|-------------|
| **FAQs** | Preguntas frecuentes con respuestas detalladas |
| **Tutoriales** | Guías paso a paso de procesos del sistema |
| **Novedades** | Historial de actualizaciones y nuevas funciones |
| **Estado de servicios** | Disponibilidad actual del sistema y sus componentes |

**Para buscar en el centro de ayuda:**

1. En la barra de búsqueda del Centro de Ayuda, escriba su consulta.
2. Los resultados se mostrarán agrupados por tipo (FAQ, Tutorial, Novedad).
3. Haga clic en el resultado para leer el contenido completo.

**Contacto con soporte:**

Desde el Centro de Ayuda puede contactar al equipo de soporte directamente mediante:
- **WhatsApp:** Enlace directo a un chat de WhatsApp
- **Correo electrónico:** Enlace para enviar un correo al equipo de soporte

### Gestión del Centro de Ayuda (Solo administradores)

> **Permiso requerido:** `help_manage`

Los administradores pueden acceder a la gestión del soporte desde las rutas:

- `/admin/support/faqs` — Gestión de FAQs
- `/admin/support/tutorials` — Gestión de tutoriales
- `/admin/support/changelogs` — Gestión de novedades
- `/admin/support/services` — Estado de servicios

Desde estas secciones pueden:

- Crear, editar y eliminar FAQs con etiquetas y categorías
- Publicar o despublicar contenido
- Crear tutoriales con pasos detallados y archivos adjuntos
- Publicar novedades y marcarlas como destacadas
- Actualizar el estado general del sistema y de cada servicio individual

---

## 20. Mi Cuenta

**Ruta:** `/admin/mi-cuenta`

Cada usuario puede gestionar su propia cuenta desde esta sección.

**Opciones disponibles:**

| Sección | Descripción |
|---------|-------------|
| **Información personal** | Nombre, apellido, correo, teléfono, foto de perfil |
| **Cambiar contraseña** | Actualización de la contraseña de acceso |
| **Autenticación en dos pasos** | Activar/desactivar 2FA |
| **WebAuthn / Passkeys** | Configurar acceso por huella digital o llave de seguridad |
| **Sesiones activas** | Ver y cerrar sesiones en otros dispositivos |

**Para cambiar su foto de perfil:**

1. Vaya a **Mi Cuenta > Información personal**.
2. Haga clic en la foto de perfil actual.
3. Seleccione una nueva imagen desde su dispositivo.
4. Haga clic en **Guardar cambios**.

**Para cerrar sesiones en otros dispositivos:**

1. Vaya a **Mi Cuenta > Sesiones activas**.
2. Verá la lista de dispositivos con sesión activa.
3. Haga clic en **Cerrar sesión** junto al dispositivo que desea desconectar.
4. Confirme la acción.

---

## 21. Configuración

**Ruta:** `/admin/configuraciones`

La sección de configuración permite personalizar la experiencia de uso del sistema.

**Secciones disponibles:**

| Sección | Descripción |
|---------|-------------|
| **Inicio** | Configuración del widget de inicio (clima, noticias, etc.) |
| **Apariencia** | Tema claro u oscuro; color primario de la interfaz |
| **Idioma y región** | Idioma del sistema, zona horaria y formato de fecha/hora |
| **Notificaciones** | Tipos de notificaciones que desea recibir y por qué medio |
| **Seguridad** | Opciones avanzadas de seguridad de la cuenta |
| **Accesibilidad** | Opciones para adaptar la interfaz a necesidades especiales |
| **Integraciones** | Conexiones con servicios externos |
| **Copias de seguridad** | Opciones de respaldo de datos |
| **Acerca de** | Información de la versión de la aplicación |

**Para cambiar el idioma:**

1. Vaya a **Configuración > Idioma y región**.
2. Seleccione el idioma deseado (Español / Inglés).
3. El cambio se aplica inmediatamente sin necesidad de recargar.

**Para activar el modo oscuro:**

1. Vaya a **Configuración > Apariencia**.
2. Seleccione **Oscuro** en la opción de tema.
3. La interfaz cambiará de inmediato.

---

## 22. Sistema de Permisos

Tecnasa Core utiliza un sistema de control de acceso basado en roles (RBAC — Role-Based Access Control). Esto significa que cada usuario tiene un rol asignado, y cada rol tiene un conjunto específico de permisos.

### ¿Qué es un rol?

Un rol es una categoría de usuario (por ejemplo: "Administrador", "Conductor", "Supervisor", "Contador"). Cada rol tiene permisos específicos que determinan qué puede ver y hacer el usuario.

### ¿Qué es un permiso?

Un permiso es una autorización específica para realizar una acción (por ejemplo: `crear_vehiculo`, `aprobar_viatico`, `ver_reportes`).

### Niveles de acceso típicos

| Tipo de usuario | Acceso |
|-----------------|--------|
| **Administrador** | Acceso total a todas las funciones del sistema |
| **Supervisor** | Puede ver y aprobar operaciones; acceso limitado a configuración |
| **Operativo/Conductor** | Puede registrar salidas/regresos; acceso básico |
| **Contador/Finanzas** | Acceso a viáticos, liquidaciones y reportes |
| **Solo lectura** | Puede ver información pero no modificarla |

> Los roles y sus permisos exactos dependen de la configuración de su organización. Contacte al administrador si necesita acceso adicional.

### ¿Qué hago si no tengo acceso a una función?

1. Verifique si el botón o la sección está visible en su menú.
2. Si no está visible, su rol no tiene el permiso necesario.
3. Contacte al administrador del sistema indicando:
   - Qué función necesita
   - Por qué la necesita
4. El administrador puede asignarle el permiso correspondiente o ajustar su rol desde **Roles y Permisos**.

---

## 23. Preguntas Frecuentes

**¿Por qué no veo algunos módulos en el menú?**

Los módulos del menú se muestran según los permisos de su rol. Si no ve un módulo que necesita, contacte al administrador.

**¿Puedo tener múltiples sesiones activas?**

Sí, puede estar conectado desde varios dispositivos simultáneamente. Puede revisar y cerrar las sesiones desde **Mi Cuenta > Sesiones activas**.

**¿Qué pasa si escaneo el QR de un vehículo que ya tiene una salida registrada?**

El sistema detectará que el vehículo ya tiene un registro de salida activo y le mostrará una alerta. Deberá registrar el regreso antes de iniciar una nueva operación.

**¿Puedo editar un viático que ya envié a revisión?**

No. Una vez que el viático pasa al estado **Pendiente**, no puede editarse. Si necesita hacer cambios, solicite al revisor que lo rechace. Al ser rechazado, vuelve a un estado editable.

**¿Cómo sé si un vehículo está disponible para reservar?**

En el módulo de **Reservas**, use la vista de **calendario** para ver visualmente qué vehículos están ocupados en las fechas deseadas. Al crear una nueva reserva, el sistema también alertará si hay un conflicto.

**¿Cómo puedo contactar al equipo de soporte?**

Desde el **Centro de Ayuda** (`/admin/help`) encontrará los canales de contacto disponibles (WhatsApp, correo electrónico). También puede consultar la sección de **Tutoriales** y **FAQs** para resolver dudas comunes.

**¿Con qué frecuencia se actualiza el sistema?**

Puede revisar el historial de actualizaciones en **Centro de Ayuda > Novedades**, donde se publican todas las versiones con sus cambios y mejoras.

---

*Este manual es una guía de referencia general. Para información específica sobre los procesos de su organización, consulte con el administrador del sistema.*

*Tecnasa Core — Todos los derechos reservados.*
