export const TEAM_OPTIONS = [
  { value: "brand", label: "Brand" },
  { value: "afiliados", label: "Afiliados" },
  { value: "paid_media", label: "Paid Media" },
  { value: "otro", label: "Otro" },
] as const;

export function teamLabel(value: string) {
  return TEAM_OPTIONS.find((o) => o.value === value)?.label ?? "Otro";
}

/** Map a free-text (pasted) team name onto one of the known team values. */
export function matchTeam(raw?: string) {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "otro";
  const hit = TEAM_OPTIONS.find(
    (o) => o.value === v || o.label.toLowerCase() === v,
  );
  if (hit) return hit.value;
  if (v.includes("paid") || v.includes("pauta")) return "paid_media";
  if (v.includes("afil")) return "afiliados";
  if (v.includes("brand") || v.includes("content")) return "brand";
  return "otro";
}

/** Per-row team picker used across the KPIs, Tareas and Budget tables. */
export function TeamSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const known = TEAM_OPTIONS.some((o) => o.value === value);
  return (
    <select
      aria-label="Equipo"
      className="team-select"
      value={known ? value : "otro"}
      onChange={(e) => onChange(e.target.value)}
    >
      {TEAM_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
