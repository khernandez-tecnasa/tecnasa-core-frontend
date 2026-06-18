// src/components/RegisterForm/UploadImages.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  Sheet,
  Alert,
} from "@mui/joy";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import { useTranslation } from "react-i18next";

/**
 * UploadImages mejorado
 *
 * Props:
 *  - value?: File[]                  (lista controlada opcional)
 *  - onChange?: (files: File[]) => void
 *  - maxCount?: number               (por defecto 6)
 *  - maxSizeMB?: number              (por defecto 6MB por archivo)
 *  - accept?: string                 (por defecto imágenes comunes incl. png/svg/webp)
 *  - capture?: string                ("environment" p/ móvil, opcional)
 *  - targetDpi?: number              (opcional: ej. 300 para pre-escalar canvas y mejorar nitidez)
 *  - dnd?: boolean                   (arrastrar/soltar; default true)
 *  - disabled?: boolean
 */
export default function UploadImages({
  value,
  onChange,
  maxCount = 6,
  maxSizeMB = 6,
  accept = "image/*,.png,.jpg,.jpeg,.webp,.svg",
  capture,
  targetDpi,
  dnd = true,
  disabled = false,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  // internal file list (fallback to controlled via `value`)
  const [files, setFiles] = useState(Array.isArray(value) ? value : []);
  // previews: [{ url, name, size }]
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const [isOver, setIsOver] = useState(false);

  // keep controlled -> internal sync
  useEffect(() => {
    if (Array.isArray(value)) {
      setFiles(value);
    }
  }, [value]);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // util: parse accept string into matchers
  const parseAccept = useCallback((acceptStr) => {
    if (!acceptStr) return { mime: [], exts: [] };
    const parts = acceptStr
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    const mime = parts.filter((p) => p.includes("/"));
    const exts = parts
      .filter((p) => p.startsWith("."))
      .map((e) => e.replace(/^\./, ""));
    return { mime, exts };
  }, []);

  const acceptMatchers = parseAccept(accept);

  const matchesAccept = useCallback(
    (file) => {
      if (!file) return false;
      const ft = (file.type || "").toLowerCase();
      if (acceptMatchers.mime.includes("image/*") && ft.startsWith("image/"))
        return true;
      if (acceptMatchers.mime.some((m) => m === ft)) return true;
      const name = (file.name || "").toLowerCase();
      const ext = name.split(".").pop();
      if (ext && acceptMatchers.exts.includes(ext)) return true;
      // MIME vacío o genérico (frecuente en cámaras Android): aceptar si accept
      // incluye image/* y la extensión es una imagen conocida
      if (acceptMatchers.mime.includes("image/*") && (!ft || ft === "application/octet-stream")) {
        const imgExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "heic", "heif", "avif"];
        if (imgExts.includes(ext)) return true;
      }
      return false;
    },
    [acceptMatchers]
  );

  const showError = (msg) => {
    setError(msg);
    // auto clear after 5s
    window.clearTimeout(showError._t);
    showError._t = window.setTimeout(() => setError(null), 5000);
  };

  const validateFile = useCallback(
    (f) => {
      if (!f) return false;
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (f.size > maxBytes) {
        showError(
          t("register.uploads.error_too_big", "Archivo demasiado grande") +
            `: ${f.name}`
        );
        return false;
      }
      if (!matchesAccept(f)) {
        showError(
          t("register.uploads.error_bad_type", "Tipo de archivo no permitido") +
            `: ${f.name}`
        );
        return false;
      }
      return true;
    },
    [maxSizeMB, matchesAccept, t]
  );

  // optional DPI resample (returns File)
  const resampleForDpi = useCallback(
    async (file) => {
      if (!targetDpi) return file;
      if (file.type === "image/svg+xml") return file; // keep svg
      try {
        const img = document.createElement("img");
        const src = URL.createObjectURL(file);
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = src;
        });
        // scale heuristic
        const scale = targetDpi >= 240 ? 2 : 1.5;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(256, Math.floor(img.naturalWidth * scale));
        canvas.height = Math.max(256, Math.floor(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((res) =>
          canvas.toBlob(res, "image/png", 0.95)
        );
        URL.revokeObjectURL(src);
        return new File([blob], file.name.replace(/\.\w+$/, ".png"), {
          type: "image/png",
        });
      } catch (err) {
        // fallback to original file on error
        console.warn("resampleForDpi failed:", err);
        return file;
      }
    },
    [targetDpi]
  );

  const buildPreviews = useCallback(
    (fileList) => {
      // revoke previous
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      const next = fileList.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
        file: f,
      }));
      setPreviews(next);
    },
    [previews]
  );

  const notify = useCallback(
    (nextFiles) => {
      setFiles(nextFiles);
      onChange?.(nextFiles);
      buildPreviews(nextFiles);
    },
    [onChange, buildPreviews]
  );

  const pickFiles = useCallback(
    async (list) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list);
      const room = Math.max(0, maxCount - files.length);
      if (room <= 0) {
        showError(
          t("register.uploads.error_max_files", "Límite de archivos alcanzado")
        );
        return;
      }
      const selected = incoming.slice(0, room);
      const filtered = [];
      for (const f of selected) {
        if (!validateFile(f)) continue;
        const maybe = await resampleForDpi(f);
        filtered.push(maybe);
      }
      if (filtered.length) notify([...files, ...filtered]);
    },
    [files, maxCount, notify, resampleForDpi, validateFile, t]
  );

  const onInputChange = async (e) => {
    await pickFiles(e.target.files);
    // reset to allow same file selection later
    e.target.value = "";
  };

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    notify(next);
  };

  // drag & drop handlers
  const onDrag = (e) => {
    if (!dnd || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(true);
  };
  const onDragLeave = (e) => {
    if (!dnd || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };
  const onDrop = async (e) => {
    if (!dnd || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    await pickFiles(e.dataTransfer.files);
  };

  return (
    <Box>
      {error && (
        <Alert color="danger" variant="soft" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      <Sheet
        role="region"
        aria-label={t(
          "register.uploads.region_label",
          "Área de subir imágenes"
        )}
        variant={isOver ? "outlined" : "soft"}
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        sx={{
          p: 1.5,
          borderRadius: "md",
          borderStyle: "dashed",
          borderColor: isOver
            ? "primary.outlinedColor"
            : "neutral.outlinedColor",
          bgcolor: isOver ? "background.level1" : "background.body",
          transition: "background-color .15s ease",
        }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="sm"
            variant="soft"
            startDecorator={<UploadRoundedIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={disabled || files.length >= maxCount}
            aria-disabled={disabled || files.length >= maxCount}>
            {t("register.uploads.add_images", "Agregar imágenes")}
          </Button>

          <Typography
            level="body-sm"
            color="neutral"
            sx={{ userSelect: "none" }}>
            {files.length}/{maxCount} •{" "}
            {t("register.uploads.max_size_each", "máx {{mb}}MB c/u", {
              mb: maxSizeMB,
            })}
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Typography level="body-xs" color="neutral" sx={{ opacity: 0.85 }}>
            {t("register.uploads.drag_hint", "Arrastra y suelta aquí")}
          </Typography>
        </Stack>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          capture={capture}
          onChange={onInputChange}
          style={{ display: "none" }}
          disabled={disabled || files.length >= maxCount}
          aria-hidden
        />

        {previews.length > 0 && (
          <Stack direction="row" spacing={1} mt={1} sx={{ flexWrap: "wrap" }}>
            {previews.map((p, i) => (
              <Sheet
                key={p.url}
                variant="outlined"
                sx={{
                  p: 0.5,
                  borderRadius: "sm",
                  position: "relative",
                  width: 104,
                  bg: "background.surface",
                }}>
                <img
                  src={p.url}
                  alt={p.name}
                  style={{
                    display: "block",
                    width: "100%",
                    height: 88,
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
                <IconButton
                  size="sm"
                  variant="soft"
                  color="neutral"
                  onClick={() => removeAt(i)}
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    bgcolor: "rgba(255,255,255,0.85)",
                  }}
                  aria-label={
                    t("register.uploads.remove_label", "Eliminar imagen") +
                    ` ${p.name}`
                  }>
                  <ClearRoundedIcon />
                </IconButton>

                <Typography
                  level="body-xs"
                  sx={{ mt: 0.5, px: 0.5, textAlign: "center" }}
                  noWrap>
                  {p.name}
                </Typography>
              </Sheet>
            ))}
          </Stack>
        )}
      </Sheet>
    </Box>
  );
}
