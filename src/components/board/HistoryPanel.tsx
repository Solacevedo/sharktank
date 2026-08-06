import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityEntry } from "@/lib/board";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hace unos segundos";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}

/** Live drawer listing the latest activity_log entries, newest first. */
export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (active && data) setEntries(data as ActivityEntry[]);
    };
    void load();
    const channel = supabase
      .channel("live-activity_log")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log" },
        () => void load(),
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar historial"
        onClick={onClose}
        className="flex-1 bg-background/70 backdrop-blur-sm"
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-hairline bg-background">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-cyan">
              Historial
            </p>
            <h3 className="text-lg font-extrabold">Últimos cambios</h3>
          </div>
          <button type="button" onClick={onClose} className="ghost-btn">
            Cerrar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {entries.length === 0 ? (
            <p className="text-sm text-dim">Todavía no hay cambios registrados.</p>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.id} className="board-card p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold">{e.actor}</span>
                    <span className="shrink-0 text-[0.7rem] text-dim">
                      {relativeTime(e.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-dim">
                    {e.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
