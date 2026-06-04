// src/pages/Inventario/ActivosList.jsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  X,
  Filter,
  Download,
  Upload,
  Keyboard,
  Pencil,
  ArrowLeftRight,
  History,
  QrCode,
  Loader2,
  Lock,
  AlertCircle,
  RotateCcw,
  MonitorSmartphone,
  MoreVertical,
} from "lucide-react";

// Services & Context
import { getActivosGlobal } from "../../services/ActivosServices";
import { getPublicLinkForActivo } from "../../services/PublicLinksService";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import useIsMobile from "../../hooks/useIsMobile";
import useRowFocusHighlight from "../../hooks/useRowFocusHighlight";
import logoTecnasa from "../../assets/newLogoTecnasaBlack.png";

// Componentes
import ActivoFormModal from "./ActivoFormModal";
import MoverActivoModal from "./MoverActivoModal";
import HistorialActivoModal from "./HistorialActivoModal";
import ModalImportarActivos from "./ModalImportarActivos";
import StyledQR from "../../components/QRCode/StyledQR";
import ExportDialog from "@/components/Exports/ExportDialog";
import PaginationLite from "@/components/common/PaginationLite";
import { getViewState } from "@/utils/viewState";

// Tailwind badge classes por estatus
const ESTATUS_BADGE = {
  Activo:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Arrendado:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Backup:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Inactivo:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "En Mantenimiento":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Reciclado:
    "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  "Propiedad del Cliente":
    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
};

// Normalizador
const normalize = (val) =>
  (val || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

function SortTh({ label, sortKey: key, current, dir, onSort, className = "" }) {
  const active = current === key;
  return (
    <th
      onClick={() => onSort(key)}
      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 cursor-pointer select-none whitespace-nowrap hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors ${className}`}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (dir === "asc" ? " ↑" : " ↓") : ""}
      </span>
    </th>
  );
}

export default function ActivosList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile(768);
  const qrRef = useRef(null);
  const searchInputRef = useRef(null);
  const { showToast } = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();

  const isAdmin = userData?.rol?.toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso]
  );

  const canView = can("ver_activos");
  const canCreate = can("crear_activos");
  const canEdit = can("editar_activos");
  const canMove = can("mover_activos");
  const canViewHistory = can("ver_historial_activos");
  const canQR = can("crear_QR");

  // Data State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [ubicacionFilter, setUbicacionFilter] = useState("");

  // Drawer Filtros (Draft)
  const [statusDraft, setStatusDraft] = useState([]);
  const [typeDraft, setTypeDraft] = useState([]);
  const [ubicacionDraft, setUbicacionDraft] = useState("");

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [openMover, setOpenMover] = useState(false);
  const [openHistorial, setOpenHistorial] = useState(false);
  const [openQR, setOpenQR] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [openActionsMenu, setOpenActionsMenu] = useState(false);

  // Selection
  const [editing, setEditing] = useState(null);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [activoQR, setActivoQR] = useState(null);
  const [publicLink, setPublicLink] = useState("");

  // Pagination & Sort
  const [sortKey, setSortKey] = useState("nombre");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // --- Carga ---
  const loadActivos = useCallback(async () => {
    if (checkingSession) {
      setLoading(true);
      return;
    }
    if (!canView) {
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const activos = await getActivosGlobal();
      setRows(Array.isArray(activos) ? activos : []);
    } catch (err) {
      const msg = err?.message || "";
      setError(
        /failed to fetch|network/i.test(msg)
          ? "Error de conexión. Verifica tu red."
          : "No se pudieron cargar los activos."
      );
    } finally {
      setLoading(false);
    }
  }, [checkingSession, canView]);

  useEffect(() => {
    loadActivos();
  }, [loadActivos]);

  // Reset page
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, ubicacionFilter, rows.length, perPage]);

  // --- Filtrado ---
  const filtered = useMemo(() => {
    const s = normalize(search);
    return rows.filter((r) => {
      const matchSearch =
        normalize(r.codigo).includes(s) ||
        normalize(r.nombre).includes(s) ||
        normalize(r.modelo).includes(s) ||
        normalize(r.serial_number).includes(s);
      const matchStatus =
        statusFilter.length === 0 || statusFilter.includes(r.estatus);
      const matchType =
        typeFilter.length === 0 || typeFilter.includes(r.tipo);
      const matchUbicacion =
        !ubicacionFilter ||
        (ubicacionFilter === "Cliente" && r.tipo_destino === "Cliente") ||
        (ubicacionFilter === "Bodega" && r.tipo_destino === "Bodega") ||
        (ubicacionFilter === "Empleado" && r.tipo_destino === "Empleado") ||
        (ubicacionFilter === "SinUbicacion" && !r.tipo_destino);
      return matchSearch && matchStatus && matchType && matchUbicacion;
    });
  }, [rows, search, statusFilter, typeFilter, ubicacionFilter]);

  // --- Opciones Filtros ---
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.estatus).filter(Boolean))),
    [rows]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.tipo).filter(Boolean))),
    [rows]
  );

  // --- Ordenamiento ---
  function getDestinoText(r) {
    if (r.tipo_destino === "Cliente")
      return `${r.cliente_nombre || ""} / ${r.site_nombre || ""}`.trim();
    if (r.tipo_destino === "Bodega") return r.bodega_nombre || "";
    if (r.tipo_destino === "Empleado") return r.empleado_nombre || "";
    return "";
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedRows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va =
        (sortKey === "_destino" ? getDestinoText(a) : a?.[sortKey]) ?? "";
      const vb =
        (sortKey === "_destino" ? getDestinoText(b) : b?.[sortKey]) ?? "";
      if (va.toString().toLowerCase() < vb.toString().toLowerCase())
        return sortDir === "asc" ? -1 : 1;
      if (va.toString().toLowerCase() > vb.toString().toLowerCase())
        return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // --- Paginación ---
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedRows.slice(start, start + perPage);
  }, [sortedRows, page, perPage]);

  // --- Highlight ---
  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: sortedRows,
    perPage,
    setPage,
    matchRow: (r, token) => {
      const t = normalize(token);
      return (
        String(r.id) === token ||
        normalize(r.codigo) === t ||
        normalize(r.serial_number) === t
      );
    },
    getRowId: (r) => r.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearch("");
    setStatusFilter([]);
    setTypeFilter([]);
    setUbicacionFilter("");
    focusByToken(token);
  }, [searchParams, setSearchParams, focusByToken]);

  // --- Acciones ---
  const onNew = () => {
    if (!canCreate) return showToast("Sin permiso", "warning");
    setEditing(null);
    setOpenForm(true);
  };

  const onEdit = (r) => {
    if (!canEdit) return showToast("Sin permiso", "warning");
    setEditing(r);
    setOpenForm(true);
  };

  const abrirMover = (r) => {
    if (!canMove) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(r);
    setOpenMover(true);
  };

  const abrirHistorial = (r) => {
    if (!canViewHistory) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(r);
    setOpenHistorial(true);
  };

  const abrirQR = async (r) => {
    if (!canQR) return showToast("Sin permiso", "warning");
    setActivoQR(r);
    setPublicLink("");
    try {
      const { url } = await getPublicLinkForActivo(r.id);
      setPublicLink(url);
    } catch (e) {
      showToast(e?.message || "Error al generar QR", "danger");
      setPublicLink(
        `${window.location.origin}/public/activos/${encodeURIComponent(
          r.codigo
        )}`
      );
    } finally {
      setOpenQR(true);
    }
  };

  // --- Atajos ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || e.target.isContentEditable;
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      if (!isTyping && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (isTyping) return;
      if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate) onNew();
        return;
      }
      if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setOpenExport(true);
        return;
      }
      if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setOpenImport(true);
        return;
      }
      if (ctrlOrMeta && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setStatusDraft(statusFilter);
        setTypeDraft(typeFilter);
        setUbicacionDraft(ubicacionFilter);
        setOpenFilters(true);
        return;
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [canCreate]);

  // View State
  const viewState = getViewState({
    checkingSession,
    canView,
    error,
    loading,
    hasData: sortedRows.length > 0,
  });

  const activeFiltersCount =
    (statusFilter.length ? 1 : 0) +
    (typeFilter.length ? 1 : 0) +
    (ubicacionFilter ? 1 : 0);

  // Export Columns
  const EXPORT_COLS = [
    { label: "Código", key: "codigo" },
    { label: "Nombre", key: "nombre" },
    { label: "Tipo", key: "tipo" },
    { label: "Modelo", key: "modelo", get: (r) => r.modelo || "" },
    {
      label: "Serial",
      key: "serial_number",
      get: (r) => r.serial_number || "",
    },
    { label: "Estatus", key: "estatus" },
    { label: "Destino", key: "tipo_destino", get: getDestinoText },
  ];
  const filenameBase = `activos_globales_${new Date()
    .toISOString()
    .slice(0, 10)}`;

  // Helper para toggle de arrays en filtros
  function toggleArr(arr, val) {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Activos Globales
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Inventario general de equipos y dispositivos
            </p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar... (o presiona /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-[220px] sm:w-[280px] transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters button */}
          <button
            onClick={() => {
              setStatusDraft(statusFilter);
              setTypeDraft(typeFilter);
              setUbicacionDraft(ubicacionFilter);
              setOpenFilters(true);
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ${
              activeFiltersCount > 0
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750"
            }`}>
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Options dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenActionsMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition">
              <MoreVertical className="w-4 h-4" />
              Opciones
            </button>
            {openActionsMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenActionsMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setOpenExport(true);
                      setOpenActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  <button
                    onClick={() => {
                      setOpenImport(true);
                      setOpenActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <Upload className="w-4 h-4" />
                    Importar
                  </button>
                  <hr className="border-neutral-100 dark:border-neutral-700" />
                  <button
                    onClick={() => {
                      setOpenShortcuts(true);
                      setOpenActionsMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                    <Keyboard className="w-4 h-4" />
                    Atajos de teclado
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW STATES ── */}
      {viewState === "checking" && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Verificando sesión...</span>
          </div>
        </div>
      )}
      {viewState === "no-permission" && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <Lock className="w-10 h-10 text-rose-400" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">
              Sin permiso
            </p>
            <p className="text-sm text-neutral-500">
              Contacta al administrador para solicitar acceso.
            </p>
          </div>
        </div>
      )}
      {viewState === "error" && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-200">
              Error al cargar
            </p>
            <p className="text-sm text-neutral-500">{error}</p>
            <button
              onClick={loadActivos}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium transition">
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      )}
      {viewState === "loading" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
      {viewState === "empty" && !search && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <MonitorSmartphone className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
            <p className="font-semibold text-neutral-700 dark:text-neutral-300">
              Sin activos registrados
            </p>
            <p className="text-sm text-neutral-500">
              Aún no hay activos en el sistema.
            </p>
          </div>
        </div>
      )}

      {/* ── DATA VIEW (Table / Cards) ── */}
      {(viewState === "data" || (viewState === "empty" && search)) && (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-semibold text-neutral-700 dark:text-neutral-200">
                Sin resultados
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                No hay activos que coincidan con tu búsqueda.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter([]);
                  setTypeFilter([]);
                  setUbicacionFilter("");
                }}
                className="mt-3 text-sm text-blue-600 hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : isMobile ? (
            /* 📱 MOBILE VIEW (CARDS) */
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {pageRows.map((r) => {
                const isHighlighted = r.id === highlightId;
                const destino = getDestinoText(r);
                const badgeClass =
                  ESTATUS_BADGE[r.estatus] ||
                  "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
                return (
                  <div
                    key={r.id}
                    ref={isHighlighted ? focusedRef : null}
                    className={`p-4 transition-colors ${
                      isHighlighted
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                    }`}>
                    {/* Top row: code + status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {r.codigo}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                        {r.estatus}
                      </span>
                    </div>
                    {/* Name + type */}
                    <div className="mb-2">
                      <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100 truncate" title={r.nombre}>
                        {r.nombre}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {r.tipo} · {r.modelo || "Sin modelo"}
                      </p>
                    </div>
                    {/* Serial + Destino */}
                    <div className="flex flex-col gap-1 mb-3">
                      {r.serial_number && (
                        <span className="font-mono text-[11px] text-neutral-400">
                          SN: {r.serial_number}
                        </span>
                      )}
                      {destino && (
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate" title={destino}>
                          📍 {destino}
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <button
                          onClick={() => onEdit(r)}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canMove && (
                        <button
                          onClick={() => abrirMover(r)}
                          title="Mover activo"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                      )}
                      {canViewHistory && (
                        <button
                          onClick={() => abrirHistorial(r)}
                          title="Historial"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <History className="w-4 h-4" />
                        </button>
                      )}
                      {canQR && (
                        <button
                          onClick={() => abrirQR(r)}
                          title="Generar QR"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Footer */}
              <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {sortedRows.length === 0
                    ? "Sin resultados"
                    : `${(page - 1) * perPage + 1}–${Math.min(
                        page * perPage,
                        sortedRows.length
                      )} de ${sortedRows.length}`}
                  {rows.length !== filtered.length &&
                    ` (${rows.length} total)`}
                </span>
                <PaginationLite
                  page={page}
                  count={totalPages}
                  onChange={setPage}
                />
              </div>
            </div>
          ) : (
            /* 💻 DESKTOP VIEW (TABLE) */
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
                      <SortTh
                        label="Código"
                        sortKey="codigo"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                        className="pl-5"
                      />
                      <SortTh
                        label="Nombre"
                        sortKey="nombre"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortTh
                        label="Tipo"
                        sortKey="tipo"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortTh
                        label="Modelo"
                        sortKey="modelo"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                      />
                      <SortTh
                        label="Serial"
                        sortKey="serial_number"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Estatus
                      </th>
                      <SortTh
                        label="Destino"
                        sortKey="_destino"
                        current={sortKey}
                        dir={sortDir}
                        onSort={toggleSort}
                      />
                      <th className="px-3 py-2.5 pr-5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {pageRows.map((r) => {
                      const isHighlighted = r.id === highlightId;
                      const destino = getDestinoText(r);
                      const badgeClass =
                        ESTATUS_BADGE[r.estatus] ||
                        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
                      return (
                        <tr
                          key={r.id}
                          ref={isHighlighted ? focusedRef : null}
                          className={`group transition-colors ${
                            isHighlighted
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                          }`}>
                          <td className="px-3 py-3 pl-5">
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-300">
                              {r.codigo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="text-sm font-medium text-neutral-800 dark:text-neutral-100 max-w-[180px] truncate block"
                              title={r.nombre}>
                              {r.nombre}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[100px] truncate block">
                              {r.tipo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {r.modelo || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                              {r.serial_number || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                              {r.estatus}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {destino ? (
                              <span
                                className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[180px] truncate block"
                                title={destino}>
                                {destino}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 pr-5">
                            <div className="flex items-center justify-end gap-1">
                              {canEdit && (
                                <button
                                  onClick={() => onEdit(r)}
                                  title="Editar"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {canMove && (
                                <button
                                  onClick={() => abrirMover(r)}
                                  title="Mover activo"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <ArrowLeftRight className="w-4 h-4" />
                                </button>
                              )}
                              {canViewHistory && (
                                <button
                                  onClick={() => abrirHistorial(r)}
                                  title="Historial"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <History className="w-4 h-4" />
                                </button>
                              )}
                              {canQR && (
                                <button
                                  onClick={() => abrirQR(r)}
                                  title="Generar QR"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {sortedRows.length === 0
                      ? "Sin resultados"
                      : `${(page - 1) * perPage + 1}–${Math.min(
                          page * perPage,
                          sortedRows.length
                        )} de ${sortedRows.length}`}
                    {rows.length !== filtered.length &&
                      ` (${rows.length} total)`}
                  </span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <PaginationLite
                  page={page}
                  count={totalPages}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          FILTER PANEL (right-side drawer)
      ══════════════════════════════════════════ */}
      {openFilters && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpenFilters(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:max-w-sm bg-white dark:bg-neutral-900 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Filtros
                </h2>
              </div>
              <button
                onClick={() => setOpenFilters(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              {/* Estatus */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 block">
                  Estatus
                </label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setStatusDraft((prev) => toggleArr(prev, s))
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                        statusDraft.includes(s)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      }`}>
                      {s}
                    </button>
                  ))}
                  {statusOptions.length === 0 && (
                    <span className="text-xs text-neutral-400">
                      Sin opciones disponibles
                    </span>
                  )}
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 block">
                  Tipo de activo
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setTypeDraft((prev) => toggleArr(prev, t))
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                        typeDraft.includes(t)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      }`}>
                      {t}
                    </button>
                  ))}
                  {typeOptions.length === 0 && (
                    <span className="text-xs text-neutral-400">
                      Sin opciones disponibles
                    </span>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2.5 block">
                  Ubicación
                </label>
                <select
                  value={ubicacionDraft}
                  onChange={(e) => setUbicacionDraft(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas</option>
                  <option value="Cliente">Clientes</option>
                  <option value="Bodega">Bodegas</option>
                  <option value="Empleado">Empleados</option>
                  <option value="SinUbicacion">Sin ubicación</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => {
                  setStatusDraft([]);
                  setTypeDraft([]);
                  setUbicacionDraft("");
                  setStatusFilter([]);
                  setTypeFilter([]);
                  setUbicacionFilter("");
                  setOpenFilters(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                Limpiar todo
              </button>
              <button
                onClick={() => {
                  setStatusFilter(statusDraft);
                  setTypeFilter(typeDraft);
                  setUbicacionFilter(ubicacionDraft);
                  setOpenFilters(false);
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          QR MODAL (Responsive)
      ══════════════════════════════════════════ */}
      {openQR && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              setOpenQR(false);
              setPublicLink("");
            }}
          />
          <div
            className={[
              "absolute z-50 bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col animate-in duration-300",
              isMobile
                ? "inset-x-0 bottom-0 h-[92vh] rounded-t-3xl border-b-0 slide-in-from-bottom"
                : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl zoom-in-95",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Código QR
                </h2>
              </div>
              <button
                onClick={() => {
                  setOpenQR(false);
                  setPublicLink("");
                }}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {activoQR && (
                <div className="flex flex-col items-center gap-3 px-6 py-6">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 text-center">
                    {activoQR.nombre}
                    <span className="ml-2 font-mono text-xs text-neutral-500">
                      ({activoQR.codigo})
                    </span>
                  </p>
                  <StyledQR
                    ref={qrRef}
                    text={
                      publicLink ||
                      `${
                        window.location.origin
                      }/public/activos/${encodeURIComponent(activoQR.codigo)}`
                    }
                    logoUrl={logoTecnasa}
                    size={isMobile ? 200 : 220}
                  />
                </div>
              )}
            </div>
            <div className="flex-none flex items-center justify-center gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => {
                  setOpenQR(false);
                  setPublicLink("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                Cerrar
              </button>
              <button
                onClick={() =>
                  qrRef.current?.download("png", `QR_${activoQR?.codigo}`)
                }
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
                Descargar PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SHORTCUTS MODAL (Responsive)
      ══════════════════════════════════════════ */}
      {openShortcuts && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpenShortcuts(false)}
          />
          <div
            className={[
              "absolute z-50 bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col animate-in duration-300",
              isMobile
                ? "inset-x-0 bottom-0 h-[92vh] rounded-t-3xl border-b-0 slide-in-from-bottom"
                : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-3xl zoom-in-95",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Atajos de teclado
                </h2>
              </div>
              <button
                onClick={() => setOpenShortcuts(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 flex flex-col gap-3">
              {[
                { keys: ["/"], desc: "Enfocar buscador" },
                { keys: ["Ctrl", "Shift", "F"], desc: "Enfocar buscador" },
                { keys: ["Ctrl", "Shift", "N"], desc: "Nuevo activo" },
                { keys: ["Ctrl", "Shift", "E"], desc: "Exportar" },
                { keys: ["Ctrl", "Shift", "I"], desc: "Importar" },
                { keys: ["Ctrl", "Shift", "L"], desc: "Abrir filtros" },
              ].map(({ keys, desc }) => (
                <div
                  key={desc}
                  className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {desc}
                  </span>
                  <div className="flex items-center gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono border border-neutral-200 dark:border-neutral-700">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-none px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setOpenShortcuts(false)}
                className="w-full py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CHILD MODALS (separate files — unchanged)
      ══════════════════════════════════════════ */}
      {openForm && (
        <ActivoFormModal
          open={openForm}
          onClose={() => setOpenForm(false)}
          editing={editing}
          onSaved={loadActivos}
        />
      )}
      {openMover && (
        <MoverActivoModal
          open={openMover}
          onClose={() => setOpenMover(false)}
          activo={activoSeleccionado}
          onSaved={loadActivos}
        />
      )}
      {openHistorial && (
        <HistorialActivoModal
          open={openHistorial}
          onClose={() => setOpenHistorial(false)}
          activo={activoSeleccionado}
        />
      )}
      {openImport && (
        <ModalImportarActivos
          open={openImport}
          onClose={() => setOpenImport(false)}
          onSaved={loadActivos}
        />
      )}
      <ExportDialog
        open={openExport}
        onClose={() => setOpenExport(false)}
        rows={sortedRows}
        columns={EXPORT_COLS}
        defaultTitle="Activos Globales"
        defaultFilenameBase={filenameBase}
      />
    </div>
  );
}
