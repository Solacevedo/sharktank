import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3";
  multiline?: boolean;
  placeholder?: string;
  /**
   * When set, a paste with multiple lines and/or tab-separated columns is
   * handed over as a parsed grid instead of being dropped into this cell.
   */
  onPasteGrid?: (grid: string[][]) => void;
};

/** Split clipboard text into a grid, or return null for a plain single-cell paste. */
export function parseClipboardGrid(text: string): string[][] | null {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  const isTabular = lines.length > 1 || text.includes("\t");
  if (!isTabular || lines.length === 0) return null;
  return lines.map((l) => l.split("\t").map((c) => c.trim()));
}

/**
 * Click-to-edit text. Saves on blur or Enter (Shift+Enter for a newline in
 * multiline mode), reverts on Escape.
 */
export function Editable({
  value,
  onSave,
  className = "",
  as = "span",
  multiline = false,
  placeholder = "Escribí acá…",
  onPasteGrid,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as "span";

  // Keep the DOM in sync with live updates from other users, but never while
  // this field is focused (that would fight the person typing).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerText !== value) el.innerText = value;
  }, [value]);

  return (
    <Tag
      ref={ref as React.Ref<HTMLSpanElement>}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      aria-label={placeholder}
      data-placeholder={placeholder}
      className={`editable ${className}`}
      onPaste={(e) => {
        const text = e.clipboardData.getData("text/plain");
        const grid = onPasteGrid ? parseClipboardGrid(text) : null;
        e.preventDefault();
        if (grid) {
          e.currentTarget.blur();
          onPasteGrid?.(grid);
          return;
        }
        document.execCommand("insertText", false, text.replace(/\s+/g, " "));
      }}
      onBlur={(e) => {
        const next = e.currentTarget.innerText.replace(/\n+$/, "").trim();
        if (next !== value) onSave(next);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (!multiline || !e.shiftKey)) {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.innerText = value;
          e.currentTarget.blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

export function DeleteButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-dim opacity-0 transition group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive focus:opacity-100"
    >
      ×
    </button>
  );
}

export function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="ghost-btn">
      {children}
    </button>
  );
}
