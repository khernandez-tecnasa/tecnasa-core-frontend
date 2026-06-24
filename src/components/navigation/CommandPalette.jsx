import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building, Building2, Car, CalendarClock, Database, Factory, FileText,
  Flag, HelpCircle, Lock, Loader2, MapPin, Package, Route, SearchX, Settings,
  SquareParking, Ticket, Wallet,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { useAuth } from "@/context/AuthContext";
import { globalSearch } from "@/services/search.api";

/* ── Metadatos por tipo de resultado: ícono, color y etiqueta ──────────────
   Los colores de ruta (índigo) y peaje (ámbar) reutilizan los mismos tonos
   que ya usan esos módulos en sus propias pantallas. */
const KIND_META = [
  { match: (k) => k.includes("veh") || k.includes("car"), icon: Car, label: "Vehículo", classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { match: (k) => k.includes("activo") || k.includes("asset"), icon: Package, label: "Activo", classes: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { match: (k) => k.includes("cliente") || k.includes("compa") || k.includes("company"), icon: Building2, label: "Compañía", classes: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { match: (k) => k.includes("site"), icon: MapPin, label: "Site", classes: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { match: (k) => k.includes("city"), icon: Building, label: "Ciudad", classes: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  { match: (k) => k.includes("country") || k.includes("pais"), icon: Flag, label: "País", classes: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  { match: (k) => k.includes("parking"), icon: SquareParking, label: "Parqueo", classes: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400" },
  { match: (k) => k.includes("warehouse") || k.includes("bodega"), icon: Factory, label: "Bodega", classes: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { match: (k) => k.includes("reserva"), icon: CalendarClock, label: "Reserva", classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { match: (k) => k.includes("viatico"), icon: Wallet, label: "Viático", classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { match: (k) => k.includes("ruta"), icon: Route, label: "Ruta", classes: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { match: (k) => k.includes("peaje"), icon: Ticket, label: "Peaje", classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { match: (k) => k.includes("reporte") || k.includes("registro") || k.includes("record"), icon: FileText, label: "Registro", classes: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
  { match: (k) => k.startsWith("module-"), icon: Settings, label: "Módulo", classes: "bg-primary/10 text-primary" },
];

function getKindMeta(kind) {
  const k = String(kind || "").toLowerCase();
  return KIND_META.find((m) => m.match(k)) || {
    icon: Database,
    label: "Resultado",
    classes: "bg-muted text-muted-foreground",
  };
}

function ResultIcon({ kind, allowed }) {
  if (!allowed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted dark:bg-slate-800">
        <Lock className="h-4 w-4 text-muted-foreground/60" />
      </div>
    );
  }
  const { icon: Icon, classes } = getKindMeta(kind);
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${classes}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-border/60 bg-card dark:bg-slate-900 px-1.5 text-[10px] font-bold text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermiso, userData } = useAuth();

  const userRole = userData?.rol;
  const checkPerm = useCallback(
    (p) => userRole === "Admin" || !p || hasPermiso(p),
    [userRole, hasPermiso],
  );

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Ctrl/⌘ + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpen]);

  // Fetch on query change
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) { setResults([]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    globalSearch(term, { limit: 10 })
      .then((data) => { if (!cancelled) setResults(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query, open]);

  // Reset on close
  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setLoading(false); }
  }, [open]);

  const handleSelect = (url) => {
    if (!url) return;
    navigate(url);
    setOpen(false);
  };

  const term = query.trim();

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t("sidebar.busqueda", "Buscar módulos y datos…")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!loading && term.length >= 2 && results.length === 0 && (
          <CommandEmpty>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 dark:bg-slate-800/60">
              <SearchX className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {t("sidebar.sin_resultados", "Sin resultados")}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {t("sidebar.sin_resultados_desc", `No encontramos nada para "${term}"`)}
              </p>
            </div>
          </CommandEmpty>
        )}

        {loading && (
          <CommandGroup heading={t("sidebar.buscando", "Buscando")}>
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {t("sidebar.buscando_resultados", "Buscando resultados…")}
              </span>
            </div>
          </CommandGroup>
        )}

        {!loading && results.length > 0 && (
          <CommandGroup heading={t("sidebar.resultados", "Resultados")}>
            {results.map((r) => {
              const allowed = checkPerm(r.perm);
              const { label } = getKindMeta(r.kind);
              return (
                <CommandItem
                  key={r.id || r.url}
                  disabled={!allowed}
                  value={`${r.title || ""} ${r.subtitle || ""}`}
                  onSelect={() => allowed && r.url && handleSelect(r.url)}
                >
                  <ResultIcon kind={r.kind} allowed={allowed} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{r.title}</p>
                    {r.subtitle && (
                      <p className="truncate text-xs text-muted-foreground/70">{r.subtitle}</p>
                    )}
                  </div>
                  {!allowed ? (
                    <span className="shrink-0 rounded-full border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      {t("sidebar.sin_permiso", "Sin permiso")}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground/50">
                      {label}
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading={t("sidebar.atajos", "Atajos")}>
          <CommandItem onSelect={() => handleSelect("/admin/help")} value="Centro de ayuda">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-bold">{t("sidebar.centro_de_ayuda", "Centro de ayuda")}</span>
            <CommandShortcut>Ctrl+H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/admin/configuraciones")} value="Configuraciones">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-bold">{t("sidebar.configuraciones", "Configuraciones")}</span>
            <CommandShortcut>Ctrl+,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Barra de atajos de teclado, siempre visible al pie */}
      <div className="flex items-center justify-end gap-4 border-t border-border/60 bg-muted/30 dark:bg-slate-800/30 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70">
          <Kbd>↑</Kbd><Kbd>↓</Kbd> Navegar
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70">
          <Kbd>↵</Kbd> Abrir
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/70">
          <Kbd>Esc</Kbd> Cerrar
        </span>
      </div>
    </CommandDialog>
  );
}
