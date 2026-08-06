import { useState } from "react";

/** First-visit overlay that captures a display name (no auth, localStorage only). */
export function NameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const next = value.trim();
    if (next) onSubmit(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm">
      <div className="board-card w-full max-w-sm p-6">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cyan">
          Antes de empezar
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
          ¿Cómo te llamás?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          Usamos tu nombre solo para registrar los cambios en el historial. Sin
          contraseñas ni cuentas.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Tu nombre"
          aria-label="Tu nombre"
          className="mt-5 w-full rounded-xl border border-cyan/25 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-dim focus:border-cyan"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          className="mt-4 w-full rounded-xl bg-cyan px-4 py-2.5 text-sm font-extrabold text-[#010B23] transition disabled:opacity-40"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
