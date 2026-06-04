import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react";

function range(start, end) {
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export default function PaginationLite({
  page = 1,
  count = 1,
  onChange,
  boundaryCount = 1,
  siblingCount = 1,
  showFirstLast = true,
}) {
  const clampPage = (p) => Math.min(Math.max(1, p), Math.max(1, count));
  const go = (p) => onChange?.(clampPage(p));

  if (count <= 1) return null;

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(
    Math.max(count - boundaryCount + 1, boundaryCount + 1),
    count
  );

  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages.length ? endPages[0] - 2 : count - 1
  );

  const itemList = [
    ...startPages,
    ...(siblingsStart > boundaryCount + 2
      ? ["ellipsis"]
      : boundaryCount + 1 < count - boundaryCount
      ? [boundaryCount + 1]
      : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundaryCount - 1
      ? ["ellipsis"]
      : count - boundaryCount > boundaryCount
      ? [count - boundaryCount]
      : []),
    ...endPages,
  ].filter(Boolean);

  const btnBase =
    "inline-flex items-center justify-center h-8 w-8 rounded-xl text-sm font-bold transition-colors";
  const btnActive =
    "bg-primary text-primary-foreground shadow-sm";
  const btnInactive =
    "border border-border/60 bg-card hover:bg-muted/60 dark:hover:bg-slate-800/60 text-foreground";
  const btnDisabled =
    "border border-border/40 bg-muted/30 text-muted-foreground/40 cursor-not-allowed";

  return (
    <div className="flex items-center gap-1">
      {showFirstLast && (
        <button
          className={page <= 1 ? btnDisabled : `${btnBase} ${btnInactive}`}
          disabled={page <= 1}
          onClick={() => go(1)}>
          <ChevronsLeft size={14} />
        </button>
      )}

      <button
        className={page <= 1 ? `${btnBase} ${btnDisabled}` : `${btnBase} ${btnInactive}`}
        disabled={page <= 1}
        onClick={() => go(page - 1)}>
        <ChevronLeft size={14} />
      </button>

      {itemList.map((it, idx) =>
        it === "ellipsis" ? (
          <span key={`e-${idx}`} className={`${btnBase} text-muted-foreground/50 border-0`}>
            <MoreHorizontal size={14} />
          </span>
        ) : (
          <button
            key={it}
            className={`${btnBase} ${it === page ? btnActive : btnInactive}`}
            onClick={() => go(it)}>
            {it}
          </button>
        )
      )}

      <button
        className={page >= count ? `${btnBase} ${btnDisabled}` : `${btnBase} ${btnInactive}`}
        disabled={page >= count}
        onClick={() => go(page + 1)}>
        <ChevronRight size={14} />
      </button>

      {showFirstLast && (
        <button
          className={page >= count ? `${btnBase} ${btnDisabled}` : `${btnBase} ${btnInactive}`}
          disabled={page >= count}
          onClick={() => go(count)}>
          <ChevronsRight size={14} />
        </button>
      )}
    </div>
  );
}
