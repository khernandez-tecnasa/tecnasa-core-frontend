export default function SystemPreviewReal({ mode, brandHex, font }) {
  const isDark = mode === "dark";

  return (
    <div
      className="
        w-full h-52 rounded-2xl overflow-hidden border
        bg-[var(--background)]
        text-[var(--foreground)]
      "
      style={{ fontFamily: font }}>
      <div className="flex h-full">
        {/* SIDEBAR */}
        <div
          className="
          w-[30%] min-w-[90px]
          border-r border-[var(--border)]
          p-2 space-y-2
          bg-[var(--sidebar)]
        ">
          {/* logo */}
          <div className="h-4 w-16 rounded bg-[var(--muted)]" />

          {/* menu */}
          <div className="space-y-1 mt-2">
            <div className="h-5 rounded bg-[var(--muted)]" />

            <div
              className="h-5 rounded flex items-center px-2 text-[10px]"
              style={{
                background: "var(--joy-palette-primary-softBg)",
                color: "hsl(var(--primary))",
              }}>
              Registros
            </div>

            <div className="h-5 rounded bg-[var(--muted)]" />
            <div className="h-5 rounded bg-[var(--muted)]" />
          </div>

          {/* user */}
          <div className="mt-auto">
            <div className="h-4 w-12 rounded bg-[var(--muted)]" />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-3 space-y-3">
          {/* HEADER */}
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-[var(--muted)]" />

            <div className="flex gap-2">
              <div className="h-6 flex-1 rounded bg-[var(--muted)]" />

              <div
                className="h-6 w-16 rounded"
                style={{ background: brandHex }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div
            className="
            rounded-lg border border-[var(--border)]
            overflow-hidden
          ">
            {/* header */}
            <div
              className="
              grid grid-cols-4 gap-2
              px-2 py-1 text-[9px]
              bg-[var(--muted)]
            ">
              <div className="h-2 bg-[var(--muted-foreground)]/40 rounded" />
              <div className="h-2 bg-[var(--muted-foreground)]/40 rounded" />
              <div className="h-2 bg-[var(--muted-foreground)]/40 rounded" />
              <div className="h-2 bg-[var(--muted-foreground)]/40 rounded" />
            </div>

            {/* rows */}
            <div className="divide-y divide-[var(--border)]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-4 gap-2 px-2 py-1">
                  <div className="h-2 bg-[var(--muted)] rounded" />
                  <div className="h-2 bg-[var(--muted)] rounded" />
                  <div className="h-2 bg-[var(--muted)] rounded" />

                  {/* status */}
                  <div className="flex items-center">
                    <div className="h-3 w-8 rounded-full bg-green-500/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
