import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName } from "@/lib/session";

export type BoardText = { id: string; slug: string; value: string };
export type MetricCard = {
  id: string;
  label: string;
  badge: string;
  value: string;
  description: string;
  position: number;
};
export type KpiRow = {
  id: string;
  team: string;
  kpi: string;
  definicion: string;
  target: string;
  frecuencia: string;
  fuente: string;
  position: number;
};
export type TeamItem = {
  id: string;
  team: string;
  kind: string;
  content: string;
  position: number;
};
export type ChecklistItem = {
  id: string;
  content: string;
  team: string;
  position: number;
};
export type BudgetItem = {
  id: string;
  item: string;
  amount: string;
  team: string;
  position: number;
};

export type ActivityEntry = {
  id: string;
  actor: string;
  section: string;
  action: string;
  description: string;
  created_at: string;
};

type TableName =
  | "board_texts"
  | "metric_cards"
  | "kpi_rows"
  | "team_items"
  | "checklist_items"
  | "budget_items";

/** Fetch a whole small table and keep it live via Realtime. */
export function useLiveTable<T>(table: TableName, orderBy: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchRows = useCallback(async () => {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true });
    if (!error && data) setRows(data as T[]);
    setLoaded(true);
  }, [table, orderBy]);

  useEffect(() => {
    fetchRows();
    const channel = supabase
      .channel(`live-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => void fetchRows(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, fetchRows]);

  return { rows, loaded, refetch: fetchRows };
}

export function todayAr() {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

/** Stamp "Última actualización" with today's date whenever anything changes. */
export async function touchLastUpdated() {
  await supabase
    .from("board_texts")
    .update({ value: todayAr(), updated_at: new Date().toISOString() })
    .eq("slug", "last_updated");
}

export type LogInfo = { section: string; action: string; description: string };

function truncate(v: string, n = 60) {
  const s = v.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export { truncate as shortText };

/** Append an entry to the shared change history. */
export async function logActivity(log: LogInfo) {
  await supabase.from("activity_log").insert({
    actor: getDisplayName() ?? "Anónimo",
    section: log.section,
    action: log.action,
    description: `${getDisplayName() ?? "Alguien"} ${log.description}`,
  });
}

export async function updateText(slug: string, value: string, log?: LogInfo) {
  await supabase.from("board_texts").update({ value }).eq("slug", slug);
  if (slug !== "last_updated") await touchLastUpdated();
  if (log) await logActivity(log);
}

export async function updateRow(
  table: TableName,
  id: string,
  patch: Record<string, string>,
  log?: LogInfo,
) {
  await supabase
    .from(table)
    .update(patch as never)
    .eq("id", id);
  await touchLastUpdated();
  if (log) await logActivity(log);
}

export async function insertRow(
  table: TableName,
  values: Record<string, unknown>,
  log?: LogInfo,
) {
  await supabase.from(table).insert(values as never);
  await touchLastUpdated();
  if (log) await logActivity(log);
}

export async function insertRows(
  table: TableName,
  values: Record<string, unknown>[],
  log?: LogInfo,
) {
  if (!values.length) return;
  await supabase.from(table).insert(values as never);
  await touchLastUpdated();
  if (log) await logActivity(log);
}

export async function deleteRow(table: TableName, id: string, log?: LogInfo) {
  await supabase.from(table).delete().eq("id", id);
  await touchLastUpdated();
  if (log) await logActivity(log);
}

export function nextPosition(rows: { position: number }[]) {
  return rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 1;
}

export function textMap(rows: BoardText[]) {
  return Object.fromEntries(rows.map((r) => [r.slug, r.value])) as Record<
    string,
    string
  >;
}
