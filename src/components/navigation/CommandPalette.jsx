import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building, Building2, Car, Database, Factory, FileText,
  Flag, HelpCircle, Lock, LogOut, MapPin, Package, Settings,
  SquareParking,
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

function KindIcon({ kind }) {
  const k = String(kind || "").toLowerCase();
  const cls = "w-4 h-4 shrink-0";
  if (k.includes("veh") || k.includes("car")) return <Car className={cls} />;
  if (k.includes("activo") || k.includes("asset")) return <Package className={cls} />;
  if (k.includes("cliente") || k.includes("compa") || k.includes("company")) return <Building2 className={cls} />;
  if (k.includes("site")) return <MapPin className={cls} />;
  if (k.includes("city")) return <Building className={cls} />;
  if (k.includes("country") || k.includes("pais")) return <Flag className={cls} />;
  if (k.includes("parking")) return <SquareParking className={cls} />;
  if (k.includes("warehouse") || k.includes("bodega")) return <Factory className={cls} />;
  if (k.includes("reporte") || k.includes("registro") || k.includes("record")) return <FileText className={cls} />;
  return <Database className={cls} />;
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={t("sidebar.busqueda", "Buscar módulos y datos…")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!loading && results.length === 0 && (
          <CommandEmpty>{t("sidebar.sin_resultados", "Sin resultados")}</CommandEmpty>
        )}

        {loading && (
          <CommandGroup heading={t("sidebar.buscando", "Buscando")}>
            <CommandItem disabled>{t("sidebar.buscando_resultados", "Buscando resultados…")}</CommandItem>
          </CommandGroup>
        )}

        {!loading && results.length > 0 && (
          <CommandGroup heading={t("sidebar.resultados", "Resultados")}>
            {results.map((r) => {
              const allowed = checkPerm(r.perm);
              return (
                <CommandItem
                  key={r.id || r.url}
                  disabled={!allowed}
                  value={`${r.title || ""} ${r.subtitle || ""}`}
                  onSelect={() => allowed && r.url && handleSelect(r.url)}
                >
                  {allowed ? <KindIcon kind={r.kind} /> : <Lock className="w-4 h-4 shrink-0" />}
                  <span className="ml-2 truncate">{r.title}</span>
                  {r.subtitle && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">{r.subtitle}</span>
                  )}
                  {!allowed && (
                    <span className="ml-auto text-[11px] text-red-500">
                      {t("sidebar.sin_permiso", "Sin permiso")}
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
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>{t("sidebar.centro_de_ayuda", "Centro de ayuda")}</span>
            <CommandShortcut>Ctrl+H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/admin/configuraciones")} value="Configuraciones">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("sidebar.configuraciones", "Configuraciones")}</span>
            <CommandShortcut>Ctrl+,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
