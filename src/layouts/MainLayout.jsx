// src/layouts/MainLayout.jsx
import { useEffect } from "react"; // 👈 importa useEffect
import Box from "@mui/joy/Box";
import Breadcrumbs from "@mui/joy/Breadcrumbs";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import Sidebar from "../context/SideBar";
import Header from "../components/Header/Header";
import { useSoftRefresh } from "@/context/SoftRefreshContext"; // 👈 importa el hook

function capitalizeNice(s = "") {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).replaceAll("-", " ");
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { key: refreshKey, trigger } = useSoftRefresh(); // 👈 obtén key/trigger

  // Mapeo base de segmentos -> etiqueta
  const LABELS = {
    // Raíces
    home: "Inicio",
    dashboard: "Dashboard",
    search: "Búsqueda",
    // Vehículos / registros / reportes
    vehiculos: "Vehículos",
    "panel-vehiculos": "Registros",
    reservas: "Reservas",
    reports: "Reportes",
    // Gestión
    clientes: "Compañías",
    countries: "Países",
    cities: "Ciudades",
    parkings: "Estacionamientos",
    sites: "Sites",
    // Inventario
    inventario: null,
    bodegas: "Bodegas",
    activos: "Activos",
    // Sistema
    usuarios: "Gestionar Usuarios",
    permissions: "Roles",
    // Soporte & ayuda (admin)
    support: "Soporte y Ayuda",
    faqs: "Gestionar FAQs",
    tutorials: "Gestionar Tutoriales",
    changelogs: "Gestionar Novedades",
    services: "Estados de Servicio",
    // Centro de ayuda (usuario)
    help: "Centro de Ayuda",
    status: "Estado del sistema",
    changelog: "Novedades",
    // Otros
    "mi-cuenta": "Mi Perfil",
    configuraciones: "Configuraciones",
    // Vista previa especial
    preview: "Vista previa",
    info: "Info",
    // Subpáginas comunes
    registrar: "Registrar",
    salida: "Salida",
    entrada: "Entrada",
  };

  // Soft refresh con F5 / Ctrl(Cmd)+R (sin recargar toda la app)
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        document.activeElement?.isContentEditable;

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const isRefreshKey =
        e.key === "F5" || (ctrlOrCmd && e.key.toLowerCase() === "r");

      if (!isRefreshKey || isTyping) return;

      e.preventDefault();
      e.stopPropagation();
      trigger(); // 👈 fuerza remount de la vista actual
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trigger]);

  // Construye segmentos del path después de /admin
  const pathnames = location.pathname
    .replace(/^\/admin\/?/, "")
    .split("/")
    .filter(Boolean);

  const buildPath = (idx) => "/admin/" + pathnames.slice(0, idx + 1).join("/");

  // Reglas especiales por ruta
  const getLabelForSegment = (seg, index) => {
    if (/^\d+$/.test(seg)) return `#${seg}`;

    if (pathnames[0] === "preview") {
      if (index === 0) return LABELS.preview;
      if (index === 1) {
        const kind = String(seg || "").toLowerCase();
        const friendly =
          {
            asset: "Activo",
            company: "Compañía",
            site: "Site",
            warehouse: "Bodega",
            vehicle: "Vehículo",
            city: "Ciudad",
            country: "País",
            parking: "Estacionamiento",
            record: "Registro",
            so: "Sales Order",
            faq: "FAQ",
            tutorial: "Tutorial",
          }[kind] || capitalizeNice(kind);
        return friendly;
      }
      if (index === 2 && /^\d+$/.test(seg)) return `#${seg}`;
      return capitalizeNice(seg);
    }

    if (pathnames[0] === "clientes") {
      if (index === 0) return LABELS.clientes;
      if (index === 1 && /^\d+$/.test(seg)) return `Compañía #${seg}`;
      if (index >= 2 && LABELS[seg] !== undefined) return LABELS[seg] || null;
      if (index >= 2) return capitalizeNice(seg);
    }

    if (seg === "inventario") return LABELS.inventario;

    if (pathnames[0] === "support") {
      if (index === 0) return LABELS.support;
      return LABELS[seg] ?? capitalizeNice(seg);
    }

    if (pathnames[0] === "help") {
      if (index === 0) return LABELS.help;
      return LABELS[seg] ?? capitalizeNice(seg);
    }

    if (LABELS[seg] !== undefined) return LABELS[seg] || null;
    return capitalizeNice(seg);
  };

  const crumbs = pathnames
    .map((seg, idx) => {
      const label = getLabelForSegment(seg, idx);
      if (!label) return null;
      const to = buildPath(idx);
      const isLast = idx === pathnames.length - 1;
      return { label, to, isLast };
    })
    .filter(Boolean);

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        className="MainContent"
        sx={{
          px: { xs: 2, md: 6 },
          pt: {
            xs: "calc(12px + var(--Header-height))",
            sm: "calc(12px + var(--Header-height))",
            md: 3,
          },
          pb: { xs: 2, sm: 2, md: 3 },
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100dvh",
          overflowY: "auto",
          gap: 1,
        }}>
        {/* Breadcrumbs */}
        {/* <Box sx={{ display: "flex", alignItems: "center" }}>
          <Breadcrumbs
            size="sm"
            aria-label="breadcrumbs"
            separator={<ChevronRightRoundedIcon fontSize="sm" />}
            sx={{ pl: 0 }}>
            <Link
              underline="none"
              color="neutral"
              onClick={() => navigate("/admin/home")}
              sx={{ cursor: "pointer" }}>
              <HomeRoundedIcon />
            </Link>

            {crumbs.map(({ label, to, isLast }) =>
              isLast ? (
                <Typography
                  key={to}
                  color="primary"
                  sx={{ fontWeight: 500, fontSize: 12 }}>
                  {label}
                </Typography>
              ) : (
                <Link
                  key={to}
                  underline="hover"
                  color="neutral"
                  onClick={() => navigate(to)}
                  sx={{ cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                  {label}
                </Link>
              )
            )}
          </Breadcrumbs>
        </Box> */}

        {/* 👇 clave: forzar remount cuando trigger() incrementa refreshKey */}
        <div key={refreshKey}>
          <Outlet />
        </div>
      </Box>
    </Box>
  );
}
