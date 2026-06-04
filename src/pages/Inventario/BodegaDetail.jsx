// src/pages/Inventario/BodegaDetail.jsx
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import {
  Warehouse,
  Plus,
  Search,
  X,
  Pencil,
  ArrowLeftRight,
  History,
  QrCode,
  Download,
  Upload,
  Keyboard,
  ArrowLeft,
  MoreVertical,
  AlertCircle,
  RotateCcw,
  Lock,
  MonitorSmartphone,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";

// Services & Context
import { getBodegaById } from "../../services/BodegasServices";
import { getActivosByBodega } from "../../services/ActivosBodegaServices";
import { getPublicLinkForActivo } from "../../services/PublicLinksService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import useIsMobile from "../../hooks/useIsMobile";
import useRowFocusHighlight from "../../hooks/useRowFocusHighlight";
import logoTecnasa from "../../assets/newLogoTecnasaBlack.png";

// Componentes
import ActivoFormModal from "./ActivoFormModal";
import MoverActivoModal from "./MoverActivoModal";
import HistorialActivoModal from "./HistorialActivoModal";
import StyledQR from "../../components/QRCode/StyledQR";
import ModalImportarActivos from "./ModalImportarActivos";
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

export default function BodegaDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const qrRef = useRef();
  const searchInputRef = useRef(null);
  const { showToast } = useToast();
  const { userData, checkingSession, hasPermiso } = useAuth();

  // --- Permisos ---
  const isAdmin = userData?.rol?.toLowerCase() === "admin";
  const can = useCallback(
    (p) => isAdmin || hasPermiso(p),
    [isAdmin, hasPermiso]
  );

  const canViewDetail = can("ver_bodegas");
  const canCreateAsset = can("crear_activos");
  const canEditAsset = can("editar_activos");
  const canMoveAsset = can("mover_activos");
  const canViewHistory = can("ver_historial_activos");
  const canGenerateQR = can("crear_QR");

  // --- Estado ---
  const [bodega, setBodega] = useState(null);
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modales
  const [openNuevo, setOpenNuevo] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openMover, setOpenMover] = useState(false);
  const [openHist, setOpenHist] = useState(false);
  const [openQR, setOpenQR] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [openActionsMenu, setOpenActionsMenu] = useState(false);

  // Selección individual
  const [activoQR, setActivoQR] = useState(null);
  const [publicLink, setPublicLink] = useState("");
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);

  // Paginación y Orden
  const [sortKey, setSortKey] = useState("nombre");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // --- Carga ---
  const load = useCallback(async () => {
    if (checkingSession) {
      setLoading(true);
      return;
    }
    if (!canViewDetail) {
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [bod, acts] = await Promise.all([
        getBodegaById(id),
        getActivosByBodega(id),
      ]);
      setBodega(bod || null);
      setActivos(Array.isArray(acts) ? acts : []);
    } catch (err) {
      const msg = err?.message || "";
      setError(
        /failed to fetch|network/i.test(msg)
          ? "Error de conexión. Verifica tu red."
          : "No se pudieron cargar los activos de esta bodega."
      );
    } finally {
      setLoading(false);
    }
  }, [id, checkingSession, canViewDetail]);

  useEffect(() => {
    load();
  }, [load]);

  // --- Filtrado y Orden ---
  const filtered = useMemo(() => {
    const s = normalize(search);
    return (activos || []).filter((a) => {
      return (
        normalize(a.codigo).includes(s) ||
        normalize(a.nombre).includes(s) ||
        normalize(a.tipo).includes(s) ||
        normalize(a.modelo).includes(s) ||
        normalize(a.serial_number).includes(s)
      );
    });
  }, [activos, search]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedRows = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = (a?.[sortKey] ?? "").toString().toLowerCase();
      const vb = (b?.[sortKey] ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedRows.slice(start, start + perPage);
  }, [sortedRows, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [search, activos.length, perPage]);

  // --- Highlight ---
  const { highlightId, focusedRef, focusByToken } = useRowFocusHighlight({
    rows: sortedRows,
    perPage,
    setPage,
    matchRow: (a, token) => {
      const t = normalize(token);
      return (
        String(a.id) === token ||
        normalize(a.codigo) === t ||
        normalize(a.serial_number) === t
      );
    },
    getRowId: (a) => a.id,
    highlightMs: 4000,
  });

  useEffect(() => {
    const token = searchParams.get("focus");
    if (!token) return;
    const next = new URLSearchParams(searchParams);
    next.delete("focus");
    setSearchParams(next, { replace: true });
    setSearch("");
    focusByToken(token);
  }, [searchParams, setSearchParams, focusByToken]);

  // --- Acciones ---
  const onNew = () => {
    if (!canCreateAsset) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(null);
    setOpenNuevo(true);
  };

  const onEdit = (a) => {
    if (!canEditAsset) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(a);
    setOpenEdit(true);
  };

  const onMove = (a) => {
    if (!canMoveAsset) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(a);
    setOpenMover(true);
  };

  const onHist = (a) => {
    if (!canViewHistory) return showToast("Sin permiso", "warning");
    setActivoSeleccionado(a);
    setOpenHist(true);
  };

  const abrirQR = async (a) => {
    if (!canGenerateQR) return showToast("Sin permiso", "warning");
    setActivoQR(a);
    setPublicLink("");
    try {
      const { url } = await getPublicLinkForActivo(a.id);
      setPublicLink(url);
    } catch (e) {
      showToast(e?.message || "Error al generar QR", "danger");
      setPublicLink(
        `${window.location.origin}/public/activos/${encodeURIComponent(a.codigo)}`
      );
    } finally {
      setOpenQR(true);
    }
  };

  const descargarPNG = () => {
    if (!qrRef.current || !activoQR) return;
    qrRef.current.download("png", `QR_${activoQR.codigo}`);
  };

  // --- Atajos de Teclado ---
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
        if (canCreateAsset) onNew();
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
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [canCreateAsset]);

  // --- View State ---
  const viewState = getViewState({
    checkingSession,
    canView: canViewDetail,
    error,
    loading,
    hasData: sortedRows.length > 0,
  });

  // Export Columns
  const EXPORT_COLS = [
    { label: "Código", key: "codigo" },
    { label: "Nombre", key: "nombre" },
    { label: "Tipo", key: "tipo" },
    { label: "Modelo", key: "modelo", get: (r) => r.modelo || "" },
    { label: "Serial", key: "serial_number", get: (r) => r.serial_number || "" },
    { label: "Estatus", key: "estatus" },
  ];
  const filenameBase = `activos_bodega_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6 w-full max-w-[1400px] mx-auto">

      {/* ── BACK + HEADER ── */}
      <div className="flex flex-col gap-3">
        {/* Back link */}
        <Link
          to="/admin/inventario/bodegas"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition w-fit">
          <ArrowLeft className="w-4 h-4" />
          Volver a Bodegas
        </Link>

        {/* Title + toolbar row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {bodega?.nombre || (loading ? "Cargando..." : "Bodega")}
                </h1>
                {bodega?.ciudad && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <MapPin className="w-3 h-3" />
                    {bodega.ciudad}
                  </span>
                )}
              </div>
              {bodega?.descripcion && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {bodega.descripcion}
                </p>
              )}
              {!loading && !error && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {activos.length} activo{activos.length !== 1 ? "s" : ""} en esta bodega
                </p>
              )}
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
                className="pl-9 pr-8 py-2 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 w-[200px] sm:w-[260px] transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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
                      onClick={() => { setOpenExport(true); setOpenActionsMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                      <Download className="w-4 h-4" /> Exportar
                    </button>
                    <button
                      onClick={() => { setOpenImport(true); setOpenActionsMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                      <Upload className="w-4 h-4" /> Importar
                    </button>
                    <hr className="border-neutral-100 dark:border-neutral-700" />
                    <button
                      onClick={() => { setOpenShortcuts(true); setOpenActionsMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                      <Keyboard className="w-4 h-4" /> Atajos de teclado
                    </button>
                  </div>
                </>
              )}
            </div>

            {canCreateAsset && (
              <button
                onClick={onNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm">
                <Plus className="w-4 h-4" />
                Nuevo activo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW STATES ── */}
      {viewState === "checking" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}
      {viewState === "no-permission" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Lock className="w-10 h-10 text-rose-400" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">Sin permiso</p>
          <p className="text-sm text-neutral-500">Contacta al administrador.</p>
        </div>
      )}
      {viewState === "error" && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="font-semibold text-neutral-700 dark:text-neutral-200">Error al cargar</p>
          <p className="text-sm text-neutral-500">{error}</p>
          <button
            onClick={load}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-sm font-medium transition">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )}
      {viewState === "loading" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      )}
      {viewState === "empty" && !search && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-1">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <p className="font-semibold text-neutral-700 dark:text-neutral-300">Bodega vacía</p>
          <p className="text-sm text-neutral-500">Esta bodega aún no tiene activos registrados.</p>
          {canCreateAsset && (
            <button
              onClick={onNew}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition">
              <Plus className="w-4 h-4" /> Agregar primer activo
            </button>
          )}
        </div>
      )}

      {/* ── DATA VIEW (Table / Cards) ── */}
      {(viewState === "data" || (viewState === "empty" && search)) && (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-semibold text-neutral-700 dark:text-neutral-200">Sin resultados</p>
              <p className="text-sm text-neutral-500 mt-1">
                No hay activos que coincidan con tu búsqueda.
              </p>
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-sm text-amber-600 hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          ) : isMobile ? (
            /* 📱 MOBILE VIEW (CARDS) */
            <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {pageRows.map((a) => {
                const isHighlighted = a.id === highlightId;
                const badgeClass =
                  ESTATUS_BADGE[a.estatus] ||
                  "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
                return (
                  <div
                    key={a.id}
                    ref={isHighlighted ? focusedRef : null}
                    className={`p-4 transition-colors ${
                      isHighlighted
                        ? "bg-amber-50 dark:bg-amber-900/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                    }`}>
                    {/* Top row: code + status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {a.codigo}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                        {a.estatus}
                      </span>
                    </div>
                    {/* Name + type */}
                    <div className="mb-2">
                      <p className="font-bold text-sm text-neutral-800 dark:text-neutral-100 truncate" title={a.nombre}>
                        {a.nombre}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {a.tipo} · {a.modelo || "Sin modelo"}
                      </p>
                    </div>
                    {/* Serial */}
                    {a.serial_number && (
                      <span className="font-mono text-[11px] text-neutral-400 block mb-3">
                        SN: {a.serial_number}
                      </span>
                    )}
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {canEditAsset && (
                        <button
                          onClick={() => onEdit(a)}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canMoveAsset && (
                        <button
                          onClick={() => onMove(a)}
                          title="Mover activo"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                      )}
                      {canViewHistory && (
                        <button
                          onClick={() => onHist(a)}
                          title="Historial"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                          <History className="w-4 h-4" />
                        </button>
                      )}
                      {canGenerateQR && (
                        <button
                          onClick={() => abrirQR(a)}
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
                  {activos.length !== filtered.length &&
                    ` (${activos.length} total)`}
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
                      <th className="px-3 py-2.5 pr-5 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {pageRows.map((a) => {
                      const isHighlighted = a.id === highlightId;
                      const badgeClass =
                        ESTATUS_BADGE[a.estatus] ||
                        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400";
                      return (
                        <tr
                          key={a.id}
                          ref={isHighlighted ? focusedRef : null}
                          className={`group transition-colors ${
                            isHighlighted
                              ? "bg-amber-50 dark:bg-amber-900/20"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-750"
                          }`}>
                          <td className="px-3 py-3 pl-5">
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-300">
                              {a.codigo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="text-sm font-medium text-neutral-800 dark:text-neutral-100 max-w-[200px] truncate block"
                              title={a.nombre}>
                              {a.nombre}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[100px] truncate block">
                              {a.tipo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              {a.modelo || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                              {a.serial_number || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                              {a.estatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 pr-5">
                            <div className="flex items-center justify-end gap-1">
                              {canEditAsset && (
                                <button
                                  onClick={() => onEdit(a)}
                                  title="Editar"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {canMoveAsset && (
                                <button
                                  onClick={() => onMove(a)}
                                  title="Mover activo"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <ArrowLeftRight className="w-4 h-4" />
                                </button>
                              )}
                              {canViewHistory && (
                                <button
                                  onClick={() => onHist(a)}
                                  title="Historial"
                                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400">
                                  <History className="w-4 h-4" />
                                </button>
                              )}
                              {canGenerateQR && (
                                <button
                                  onClick={() => abrirQR(a)}
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
                    {activos.length !== filtered.length &&
                      ` (${activos.length} total)`}
                  </span>
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500">
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
          QR MODAL (Responsive)
      ══════════════════════════════════════════ */}
      {openQR && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => { setOpenQR(false); setPublicLink(""); }}
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
                <QrCode className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Código QR</h2>
              </div>
              <button
                onClick={() => { setOpenQR(false); setPublicLink(""); }}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {activoQR && (
                <div className="flex flex-col items-center gap-3 px-6 py-6">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 text-center">
                    {activoQR.nombre}
                    <span className="ml-2 font-mono text-xs text-neutral-500">({activoQR.codigo})</span>
                  </p>
                  <StyledQR
                    ref={qrRef}
                    text={
                      publicLink ||
                      `${window.location.origin}/public/activos/${encodeURIComponent(activoQR.codigo)}`
                    }
                    logoUrl={logoTecnasa}
                    size={isMobile ? 200 : 220}
                  />
                </div>
              )}
            </div>
            <div className="flex-none flex items-center justify-center gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => { setOpenQR(false); setPublicLink(""); }}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
                Cerrar
              </button>
              <button
                onClick={descargarPNG}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition">
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
                <Keyboard className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Atajos de teclado</h2>
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
              ].map(({ keys, desc }) => (
                <div key={desc} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{desc}</span>
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
          CHILD MODALS (archivos separados)
      ══════════════════════════════════════════ */}
      {openNuevo && (
        <ActivoFormModal
          open={openNuevo}
          onClose={() => setOpenNuevo(false)}
          idBodega={id}
          onSaved={load}
        />
      )}
      {openEdit && (
        <ActivoFormModal
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          editing={activoSeleccionado}
          onSaved={load}
        />
      )}
      {openMover && (
        <MoverActivoModal
          open={openMover}
          onClose={() => setOpenMover(false)}
          activo={activoSeleccionado}
          onSaved={load}
        />
      )}
      {openHist && (
        <HistorialActivoModal
          open={openHist}
          onClose={() => setOpenHist(false)}
          activo={activoSeleccionado}
        />
      )}
      {openImport && (
        <ModalImportarActivos
          open={openImport}
          onClose={() => setOpenImport(false)}
          idBodega={id}
          onSaved={load}
        />
      )}
      <ExportDialog
        open={openExport}
        onClose={() => setOpenExport(false)}
        rows={sortedRows}
        columns={EXPORT_COLS}
        defaultTitle={`Activos - ${bodega?.nombre || "Bodega"}`}
        defaultFilenameBase={filenameBase}
      />
    </div>
  );
}
