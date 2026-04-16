import { useEffect } from "react";
import { useColorScheme, useTheme } from "@mui/joy/styles";

// Helper: Hex a HSL (Para Tailwind)
const hexToHSL = (hex) => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};

// Helper: Hex a RGB Channel (string: "R G B")
const hexToChannel = (hex) => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return `${r} ${g} ${b}`; // Importante: espacios, no comas
};

export default function TailwindDarkSync() {
  const { mode, systemMode } = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    const resolved = mode === "system" ? systemMode || "light" : mode;

    // 🔥 LIMPIEZA TOTAL (CLAVE)
    root.classList.remove("light", "dark");

    // 🔥 SOLO UNA CLASE
    root.classList.add(resolved);

    // 2. Sincronizar Color
    const primaryColor = theme.palette.primary.main;

    if (primaryColor && primaryColor.startsWith("#")) {
      // A. Tailwind
      const hsl = hexToHSL(primaryColor);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);

      // B. JOY UI (Inyección Instantánea)
      const channel = hexToChannel(primaryColor);

      // Variables Base
      root.style.setProperty("--joy-palette-primary-main", primaryColor);
      root.style.setProperty("--joy-palette-primary-500", primaryColor);
      root.style.setProperty("--joy-palette-primary-mainChannel", channel);

      // 🟢 CORRECCIÓN DE SINTAXIS: Usamos barra '/' para la opacidad
      // Sólidos
      root.style.setProperty("--joy-palette-primary-solidBg", primaryColor);
      root.style.setProperty(
        "--joy-palette-primary-solidHoverBg",
        primaryColor,
      );

      // Suaves (La clave de la transparencia)
      root.style.setProperty(
        "--joy-palette-primary-softBg",
        `rgba(${channel} / 0.15)`,
      ); // ✅ Correcto
      root.style.setProperty(
        "--joy-palette-primary-softHoverBg",
        `rgba(${channel} / 0.25)`,
      );

      // Bordes
      root.style.setProperty(
        "--joy-palette-primary-outlinedBorder",
        `rgba(${channel} / 0.50)`,
      );
      root.style.setProperty(
        "--joy-palette-primary-outlinedColor",
        primaryColor,
      );

      // Textos
      root.style.setProperty("--joy-palette-primary-plainColor", primaryColor);
      root.style.setProperty("--joy-palette-primary", "0 0 0");

      root.style.setProperty("--primary-foreground", "255 255 255");
    }
  }, [mode, systemMode]);

  return null;
}
