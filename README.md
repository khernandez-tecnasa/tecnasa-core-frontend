# Tecnasa Core - Frontend (UI)

Interfaz administrativa de alta disponibilidad para Tecnasa Honduras. Este frontend gestiona la visualización de activos, logística de vehículos, facturación y control de infraestructura mediante una experiencia de usuario moderna y segura.

## 🛠️ Stack Tecnológico
- Framework: React + Vite
- Estilos: Tailwind CSS
- Componentes: Joy UI (MUI) & shadcn/ui
- Internacionalización: i18next (Soporte nativo Español / Inglés)
- Gestión de Estado: AuthContext (Implementación manual personalizada)

---

## 🔐 Seguridad y Acceso
El sistema prioriza la integridad de la información corporativa mediante:
- Autenticación 2FA: Segundo factor de autenticación obligatorio compatible con Microsoft / Windows Authenticator.
- Contexto de Autenticación: Manejo manual de estados globales mediante AuthContext para una gestión ligera y segura de la sesión.
- RBAC (Role-Based Access Control): Sistema de permisos detallado que habilita módulos específicos según el perfil del colaborador.

---

## ✨ Características Principales
- Dashboard Operativo: Resumen de métricas y estados del sistema.
- Soporte Multiidioma: Cambio dinámico de idioma (ES/EN) con persistencia.
- Centro de Ayuda: Acceso directo a soporte vía WhatsApp y correo institucional.
- Módulos de Gestión: Control de vehículos, activos, usuarios y permisos.

---

## ⚙️ Configuración del Entorno
Crea un archivo .env en la raíz del proyecto con las siguientes variables:

# Identidad de la App
VITE_APP_TITLE="Tecnasa Core"

# Conexión con la API
VITE_API_BASE_URL=http://localhost:4000
VITE_API_BASE_URL_QR=http://localhost:4000/qr
VITE_API_URL=http://localhost:4000/api

# Soporte y Contacto
VITE_SUPPORT_EMAIL=micros.teh@tecnasadesk.com
VITE_SUPPORT_WHATSAPP=https://wa.me/50495989756

# Claves Externas
VITE_OWM_KEY=tu_clave_de_open_weather_map

---

## 🚀 Instalación y Desarrollo

1. Instalar dependencias:
   npm install

2. Iniciar servidor de desarrollo (Vite):
   npm run dev

3. Generar build de producción:
   npm run build

---

## 📁 Estructura del Proyecto
- /src/context: Implementación manual de AuthContext y gestión de sesión.
- /src/locales: Archivos de traducción i18n para soporte bilingüe.
- /src/components: Componentes de Joy UI y shadcn/ui personalizados.
- /src/pages: Vistas de Dashboard, Ayuda y Gestión de Módulos.
- /src/hooks: Lógica de permisos y validación de tokens.

---

## 📦 Releases y Versionado (SemVer)
Este proyecto utiliza Semantic Versioning (MAJOR.MINOR.PATCH) para mantener un historial de cambios coherente.

### Automatización con PowerShell
Para generar un nuevo release, utilizamos el script .\release.ps1 que automatiza:
- Actualización de package.json.
- Generación de Git Tags.
- Creación de logs en el historial (CHANGELOG).
- Push automático a la Organización en GitHub.

Comandos rápidos:
# Para correcciones de errores (1.0.0 -> 1.0.1)
.\release.ps1 -Bump patch

# Para nuevas funcionalidades (1.0.1 -> 1.1.0)
.\release.ps1 -Bump minor

# Para cambios importantes e incompatibles (1.1.0 -> 2.0.0)
.\release.ps1 -Bump major

---
© 2026 Tecnasa-Dev-HN - Desarrollado por el equipo de Ingeniería de Software.
