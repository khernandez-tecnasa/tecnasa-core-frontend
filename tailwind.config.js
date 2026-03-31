// tailwind.config.js
import { fontFamily } from "tailwindcss/defaultTheme";
import { theme } from "./src/constants/theme.js";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-left": "slideLeft 0.3s ease",
        "slide-right": "slideRight 0.3s ease",
        "ios-forward": "iosForward 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)",
        "ios-back": "iosBack 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)",
        "ios-sheet": "iosSheet 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideLeft: {
          "0%": { opacity: 0, transform: "translateX(40px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        slideRight: {
          "0%": { opacity: 0, transform: "translateX(-40px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        iosForward: {
          "0%": { transform: "translateX(30px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        iosBack: {
          "0%": { transform: "translateX(-30px)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        iosSheet: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      fontFamily: { sans: ["Poppins", ...fontFamily.sans] },
      colors: {
        bg: "oklch(var(--background))",
        fg: "oklch(var(--foreground))",
        muted: "oklch(var(--muted))",
        mutedFg: "oklch(var(--muted-foreground))",
        border: "oklch(var(--border))",
        primary: "hsl(var(--primary))",
      },
    },
  },
};
