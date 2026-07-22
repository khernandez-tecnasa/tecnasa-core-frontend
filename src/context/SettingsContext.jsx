// src/context/SettingsContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import SettingsService from "../services/SettingsServices.js";
import { useToast } from "../context/ToastContext.jsx"; // ajusta la ruta si es distinta
import i18n from "../config/i18n.js";

const SettingsContext = createContext(null);

// merge profundo simple (no muta los inputs)
function deepMerge(target = {}, patch = {}) {
  if (!patch) return target;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const tv = target ? target[key] : undefined;
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = deepMerge(tv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null); // { perfil: {...}, seguridad: {...}, ... }
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({}); // { perfil: false, seguridad: true }
  const toast = useToast();

  // Carga inicial de settings
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await SettingsService.getAllSettings();

        if (!mounted) return;

        const idiomaSection = data.idioma || data.region || {};

        const normalizedData = {
          ...data,
          timeFormat: idiomaSection.timeFormat || data.timeFormat || "12h",
          dateFormat:
            idiomaSection.dateFormat || data.dateFormat || "DD/MM/YYYY",
          language: idiomaSection.language || data.language || "es-HN",
          timezone:
            idiomaSection.timezone || data.timezone || "America/Tegucigalpa",
        };

        setSettings(normalizedData);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // saveSection: optimistic update + rollback
  const saveSection = useCallback(
    async (sectionKey, partialPayload = {}) => {
      if (!sectionKey) throw new Error("sectionKey es requerido");
      if (!partialPayload || typeof partialPayload !== "object")
        throw new Error("partialPayload debe ser un objeto");

      // snapshot para rollback
      const prev = settings ? settings[sectionKey] || {} : {};
      const optimistic = deepMerge(prev, partialPayload);

      // Si el payload corresponde a una acción de 2FA (keys que empiezan con 'tfa_'),
      // evitamos aplicar el 'optimistic update' y no tocamos `settings` antes de la respuesta.
      const isTfaAction = Object.keys(partialPayload || {}).some((k) =>
        String(k).startsWith("tfa_"),
      );

      if (isTfaAction) {
        // Marcamos savingMap solo para visibilidad, pero evitamos tocar settings
        setSavingMap((m) => ({ ...(m || {}), [sectionKey]: true }));
        try {
          const res = await SettingsService.patchSection(
            sectionKey,
            partialPayload,
          );

          if (res && res.action) {
            // toast.showToast("Acción iniciada", "info");
            return res?.data || res;
          }

          const serverPayload = res && res.data ? res.data : prev;
          // Actualizamos settings solo si el servidor devuelve datos definitivos
          setSettings((s) => ({ ...(s || {}), [sectionKey]: serverPayload }));
          toast.showToast("Guardado", "success");
          return serverPayload;
        } catch (err) {
          toast.showToast(err?.message || "Error al guardar", "danger");
          throw err;
        } finally {
          setSavingMap((m) => ({ ...(m || {}), [sectionKey]: false }));
        }
      }

      // set optimistic + mark saving (caso normal)
      setSettings((s) => {
        const updated = { ...(s || {}), [sectionKey]: optimistic };
        if (sectionKey === "idioma") {
          if (partialPayload.dateFormat !== undefined) updated.dateFormat = partialPayload.dateFormat;
          if (partialPayload.timeFormat !== undefined) updated.timeFormat = partialPayload.timeFormat;
          if (partialPayload.language !== undefined) updated.language = partialPayload.language;
          if (partialPayload.timezone !== undefined) updated.timezone = partialPayload.timezone;
        }
        return updated;
      });
      if (sectionKey === "idioma" && partialPayload.language) {
        i18n.changeLanguage(partialPayload.language);
      }
      setSavingMap((m) => ({ ...(m || {}), [sectionKey]: true }));

      try {
        const res = await SettingsService.patchSection(
          sectionKey,
          partialPayload,
        );

        // Si el backend indica que la operación es una acción (por ejemplo: iniciar enroll 2FA),
        // no sobrescribimos la sección de settings con la carga parcial devuelta. Esto evita que
        // el componente que muestra la sección (p. ej. `Seguridad`) se remonte y pierda su estado local.
        if (res && res.action) {
          toast.showToast("Acción iniciada", "info");
          return res?.data || res;
        }

        const serverPayload = res && res.data ? res.data : optimistic;
        setSettings((s) => {
          const updated = { ...(s || {}), [sectionKey]: serverPayload };
          if (sectionKey === "idioma") {
            const p = serverPayload || {};
            if (p.dateFormat !== undefined) updated.dateFormat = p.dateFormat;
            if (p.timeFormat !== undefined) updated.timeFormat = p.timeFormat;
            if (p.language !== undefined) updated.language = p.language;
            if (p.timezone !== undefined) updated.timezone = p.timezone;
          }
          return updated;
        });

        toast.showToast("Guardado", "success");
        return serverPayload;
      } catch (err) {
        // rollback
        setSettings((s) => ({ ...(s || {}), [sectionKey]: prev }));
        toast.showToast(err?.message || "Error al guardar", "danger");
        throw err;
      } finally {
        setSavingMap((m) => ({ ...(m || {}), [sectionKey]: false }));
      }
    },
    [settings, toast],
  );

  // opción: función pública para forzar recarga desde server (por ejemplo después de reset global)
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SettingsService.getAllSettings();
      setSettings(data || {});
    } catch (err) {
      toast.showToast("No se pudo recargar configuraciones", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const value = React.useMemo(
    () => ({
      settings,
      loading,
      saveSection,
      savingMap,
      reload,
    }),
    [settings, loading, saveSection, savingMap, reload],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings debe usarse dentro de SettingsProvider");
  return ctx;
}
