// src/pages/HelpPage/HelpManualPage.jsx
import { useState } from "react";
import { BookOpen, Download, ExternalLink } from "lucide-react";

export default function HelpManualPage() {
  const [loaded, setLoaded] = useState(false);
  const manualUrl = "/manual/index.html";

  const handleDownload = () => {
    // Abre el manual con ?print=1 → el HTML auto-dispara window.print()
    // El usuario elige "Guardar como PDF" en el diálogo del navegador
    window.open(`${manualUrl}?print=1`, "_blank", "noopener,noreferrer");
  };

  const handleOpenTab = () => {
    window.open(manualUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-full">

      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/60 bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/15">
            <BookOpen size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-black text-sm leading-none">Manual de Usuario</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tecnasa Core — v2.9.1</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenTab}
            aria-label="Abrir en pestaña nueva"
            title="Abrir en pestaña nueva"
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all">
            <ExternalLink size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-muted/60 dark:bg-slate-800 border border-border/60 text-sm font-bold hover:bg-muted dark:hover:bg-slate-700 transition-all">
            <Download size={13} /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Consejo (visible cuando el iframe está cargado) */}
      {loaded && (
        <div className="px-4 md:px-6 py-2 bg-primary/5 border-b border-primary/10 shrink-0">
          <p className="text-xs text-primary">
            <strong>Consejo:</strong> El botón <strong>Descargar PDF</strong> abre el diálogo de impresión.
            Selecciona <strong>"Guardar como PDF"</strong> y activa <strong>"Gráficos de fondo"</strong> para conservar los colores.
          </p>
        </div>
      )}

      {/* iframe */}
      <div className="flex-1 relative min-h-0">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <p className="text-sm text-muted-foreground animate-pulse">Cargando manual…</p>
          </div>
        )}
        <iframe
          src={manualUrl}
          title="Manual de Usuario — Tecnasa Core"
          onLoad={() => setLoaded(true)}
          className="w-full h-full border-0 block transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>
    </div>
  );
}
