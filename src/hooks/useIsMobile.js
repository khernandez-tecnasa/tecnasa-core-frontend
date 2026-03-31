import { useEffect, useState } from "react";

// Hook de responsive que ya usabas, pero reutilizable
export default function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width:${breakpointPx}px)`).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width:${breakpointPx}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener?.("change", handler);
    mql.addListener?.(handler);
    return () => {
      mql.removeEventListener?.("change", handler);
      mql.removeListener?.(handler);
    };
  }, [breakpointPx]);

  return isMobile;
}
