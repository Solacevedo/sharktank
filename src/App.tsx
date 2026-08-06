import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TiendanubeLogo } from "@/components/board/TiendanubeLogo";
import { AddButton, DeleteButton, Editable } from "@/components/board/Editable";
import { HistoryPanel } from "@/components/board/HistoryPanel";
import { NameGate } from "@/components/board/NameGate";
import { TeamSelect, matchTeam, teamLabel } from "@/components/board/TeamSelect";
import {
  clearDisplayName,
  getDisplayName,
  setDisplayName,
} from "@/lib/session";
import {
  deleteRow,
  insertRow,
  insertRows,
  nextPosition,
  shortText,
  textMap,
  updateRow,
  updateText,
  useLiveTable,
  type BoardText,
  type BudgetItem,
  type ChecklistItem,
  type KpiRow,
  type MetricCard,
  type TeamItem,
} from "@/lib/board";

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  onEyebrow,
  onTitle,
  onSubtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: "cyan" | "yellow";
  onEyebrow: (v: string) => void;
  onTitle: (v: string) => void;
  onSubtitle: (v: string) => void;
}) {
  return (
    <header className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <Editable
          value={eyebrow}
          onSave={onEyebrow}
          className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-cyan"
        />
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <Editable
        as="h2"
        value={title}
        onSave={onTitle}
        className="block text-2xl font-extrabold tracking-tight sm:text-3xl"
      />
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
        <Editable value={subtitle} onSave={onSubtitle} multiline />
        {badge ? (
          <span
            className={`badge-pill ml-2 align-middle ${
              badge === "cyan" ? "badge-cyan" : "badge-yellow"
            }`}
          >
            {badge === "cyan" ? "Estimado" : "Propuesto"}
          </span>
        ) : null}
      </p>
    </header>
  );
}

function KpiTable({ rows }: { rows: KpiRow[] }) {
  const cols: { key: keyof KpiRow; label: string; width: string }[] = [
    { key: "kpi", label: "KPI", width: "w-[16%]" },
    { key: "definicion", label: "Definición", width: "w-[30%]" },
    { key: "target", label: "Target", width: "w-[14%]" },
    { key: "frecuencia", label: "Periodo de retorno", width: "w-[12%]" },
    { key: "fuente", label: "Fuente", width: "w-[16%]" },
  ];

  const pasteGrid = (grid: string[][]) => {
    const base = nextPosition(rows);
    const values = grid.map((cells, i) => ({
      kpi: cells[0] ?? "Nuevo KPI",
      definicion: cells[1] ?? "Definición",
      target: cells[2] ?? "A definir",
      frecuencia: cells[3] ?? "Semanal",
      fuente: cells[4] ?? "A definir",
      team: matchTeam(cells[5]),
      position: base + i,
    }));
    void insertRows("kpi_rows", values, {
      section: "KPIs",
      action: "bulk_insert",
      description: `pegó ${values.length} fila${values.length === 1 ? "" : "s"} nueva${values.length === 1 ? "" : "s"} en KPIs`,
    });
    toast.success(`${values.length} filas agregadas en KPIs`);
  };

  const copyCsv = async () => {
    const header = [...cols.map((c) => c.label), "Equipo"].join("\t");
    const body = rows
      .map((r) =>
        [...cols.map((c) => String(r[c.key])), teamLabel(r.team)].join("\t"),
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${header}\n${body}`);
      toast.success("Tabla copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar la tabla");
    }
  };

  return (
    <div className="board-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={`${c.width} px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan`}
                >
                  {c.label}
                </th>
              ))}
              <th className="w-[12%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Equipo
              </th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="group border-b border-hairline/70 last:border-0 align-top"
              >
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    <Editable
                      value={String(r[c.key])}
                      onPasteGrid={pasteGrid}
                      onSave={(v) =>
                        void updateRow("kpi_rows", r.id, { [c.key]: v }, {
                          section: "KPIs",
                          action: "update",
                          description: `editó ${c.label} de "${shortText(String(r[c.key]))}" a "${shortText(v)}" en KPIs`,
                        })
                      }
                      className={
                        c.key === "kpi"
                          ? "block font-bold"
                          : c.key === "definicion"
                            ? "block text-dim"
                            : "block"
                      }
                      multiline
                    />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <TeamSelect
                    value={r.team}
                    onChange={(v) =>
                      void updateRow("kpi_rows", r.id, { team: v }, {
                        section: "KPIs",
                        action: "update",
                        description: `cambió el equipo de "${shortText(r.kpi)}" a ${teamLabel(v)} en KPIs`,
                      })
                    }
                  />
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteButton
                    label="Eliminar fila"
                    onClick={() =>
                      void deleteRow("kpi_rows", r.id, {
                        section: "KPIs",
                        action: "delete",
                        description: `eliminó "${shortText(r.kpi)}" en KPIs`,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-3">
        <AddButton
          onClick={() =>
            void insertRow(
              "kpi_rows",
              { team: "otro", position: nextPosition(rows) },
              {
                section: "KPIs",
                action: "insert",
                description: "agregó una fila en KPIs",
              },
            )
          }
        >
          + Agregar fila
        </AddButton>
        <button type="button" onClick={copyCsv} className="ghost-btn">
          Copiar como CSV
        </button>
      </div>
    </div>
  );
}

function TareasTable({ rows }: { rows: ChecklistItem[] }) {
  const pasteGrid = (grid: string[][]) => {
    const base = nextPosition(rows);
    const values = grid.map((cells, i) => ({
      content: cells[0] ?? "Nueva acción",
      team: matchTeam(cells[1]),
      position: base + i,
    }));
    void insertRows("checklist_items", values, {
      section: "Tareas",
      action: "bulk_insert",
      description: `pegó ${values.length} fila${values.length === 1 ? "" : "s"} nueva${values.length === 1 ? "" : "s"} en Tareas`,
    });
    toast.success(`${values.length} filas agregadas en Tareas`);
  };

  return (
    <div className="board-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-[80%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Tarea
              </th>
              <th className="w-[20%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Equipo
              </th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="group border-b border-hairline/70 last:border-0 align-top"
              >
                <td className="px-4 py-3">
                  <Editable
                    value={r.content}
                    onPasteGrid={pasteGrid}
                    onSave={(v) =>
                      void updateRow("checklist_items", r.id, { content: v }, {
                        section: "Tareas",
                        action: "update",
                        description: `editó una tarea de "${shortText(r.content)}" a "${shortText(v)}" en Tareas`,
                      })
                    }
                    className="block leading-relaxed"
                    multiline
                  />
                </td>
                <td className="px-4 py-3">
                  <TeamSelect
                    value={r.team}
                    onChange={(v) =>
                      void updateRow("checklist_items", r.id, { team: v }, {
                        section: "Tareas",
                        action: "update",
                        description: `cambió el equipo de "${shortText(r.content)}" a ${teamLabel(v)} en Tareas`,
                      })
                    }
                  />
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteButton
                    label="Eliminar tarea"
                    onClick={() =>
                      void deleteRow("checklist_items", r.id, {
                        section: "Tareas",
                        action: "delete",
                        description: `eliminó la tarea "${shortText(r.content)}" en Tareas`,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <AddButton
          onClick={() =>
            void insertRow(
              "checklist_items",
              { team: "otro", position: nextPosition(rows) },
              {
                section: "Tareas",
                action: "insert",
                description: "agregó una tarea en Tareas",
              },
            )
          }
        >
          + Agregar fila
        </AddButton>
      </div>
    </div>
  );
}

function BudgetTable({ rows }: { rows: BudgetItem[] }) {
  const pasteGrid = (grid: string[][]) => {
    const base = nextPosition(rows);
    const values = grid.map((cells, i) => ({
      item: cells[0] ?? "Nuevo ítem",
      amount: cells[1] ?? "A definir",
      team: matchTeam(cells[2]),
      position: base + i,
    }));
    void insertRows("budget_items", values, {
      section: "Budget",
      action: "bulk_insert",
      description: `pegó ${values.length} fila${values.length === 1 ? "" : "s"} nueva${values.length === 1 ? "" : "s"} en Budget`,
    });
    toast.success(`${values.length} filas agregadas en Budget`);
  };

  return (
    <div className="board-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-[46%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Ítem
              </th>
              <th className="w-[28%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Monto estimado
              </th>
              <th className="w-[26%] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cyan">
                Equipo
              </th>
              <th className="w-8 px-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="group border-b border-hairline/70 last:border-0 align-top"
              >
                <td className="px-4 py-3">
                  <Editable
                    value={r.item}
                    onPasteGrid={pasteGrid}
                    onSave={(v) =>
                      void updateRow("budget_items", r.id, { item: v }, {
                        section: "Budget",
                        action: "update",
                        description: `editó un ítem de "${shortText(r.item)}" a "${shortText(v)}" en Budget`,
                      })
                    }
                    className="block font-bold"
                    multiline
                  />
                </td>
                <td className="px-4 py-3">
                  <Editable
                    value={r.amount}
                    onPasteGrid={pasteGrid}
                    onSave={(v) =>
                      void updateRow("budget_items", r.id, { amount: v }, {
                        section: "Budget",
                        action: "update",
                        description: `editó el monto de "${shortText(r.item)}" a "${shortText(v)}" en Budget`,
                      })
                    }
                    className="block"
                  />
                </td>
                <td className="px-4 py-3">
                  <TeamSelect
                    value={r.team}
                    onChange={(v) =>
                      void updateRow("budget_items", r.id, { team: v }, {
                        section: "Budget",
                        action: "update",
                        description: `cambió el equipo de "${shortText(r.item)}" a ${teamLabel(v)} en Budget`,
                      })
                    }
                  />
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteButton
                    label="Eliminar fila"
                    onClick={() =>
                      void deleteRow("budget_items", r.id, {
                        section: "Budget",
                        action: "delete",
                        description: `eliminó "${shortText(r.item)}" en Budget`,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-hairline px-4 py-3">
        <AddButton
          onClick={() =>
            void insertRow(
              "budget_items",
              { team: "otro", position: nextPosition(rows) },
              {
                section: "Budget",
                action: "insert",
                description: "agregó una fila en Budget",
              },
            )
          }
        >
          + Agregar fila
        </AddButton>
      </div>
    </div>
  );
}

function TeamCard({
  name,
  slug,
  team,
  items,
}: {
  name: string;
  slug: string;
  team: "afiliados" | "content";
  items: TeamItem[];
}) {
  const resp = items.filter((i) => i.team === team && i.kind === "resp");

  const List = ({
    title,
    kind,
    rows,
    addLabel,
  }: {
    title: string;
    kind: "resp" | "budget";
    rows: TeamItem[];
    addLabel: string;
  }) => (
    <div className="mt-5 first:mt-0">
      <h4 className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-cyan">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {rows.map((i) => (
          <li key={i.id} className="group flex items-start gap-2 text-sm">
            <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-cyan" />
            <Editable
              value={i.content}
              onSave={(v) =>
                void updateRow("team_items", i.id, { content: v }, {
                  section: "Equipos",
                  action: "update",
                  description: `editó una responsabilidad de "${shortText(i.content)}" a "${shortText(v)}" en Equipos`,
                })
              }
              className="flex-1 leading-relaxed text-foreground/90"
              multiline
            />
            <DeleteButton
              label="Eliminar punto"
              onClick={() =>
                void deleteRow("team_items", i.id, {
                  section: "Equipos",
                  action: "delete",
                  description: `eliminó "${shortText(i.content)}" en Equipos`,
                })
              }
            />
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <AddButton
          onClick={() =>
            void insertRow(
              "team_items",
              { team, kind, position: nextPosition(rows) },
              {
                section: "Equipos",
                action: "insert",
                description: "agregó un punto en Equipos",
              },
            )
          }
        >
          {addLabel}
        </AddButton>
      </div>
    </div>
  );

  return (
    <div className="board-card p-6">
      <Editable
        as="h3"
        value={name}
        onSave={(v) =>
          void updateText(slug, v, {
            section: "Equipos",
            action: "update",
            description: `renombró un equipo de "${shortText(name)}" a "${shortText(v)}"`,
          })
        }
        className="block text-lg font-extrabold"
      />

      <List
        title="Responsabilidades"
        kind="resp"
        rows={resp}
        addLabel="+ Agregar punto"
      />
    </div>
  );
}

export default function App() {
  const texts = useLiveTable<BoardText>("board_texts", "slug");
  const metrics = useLiveTable<MetricCard>("metric_cards", "position");
  const kpis = useLiveTable<KpiRow>("kpi_rows", "position");
  const teamItems = useLiveTable<TeamItem>("team_items", "position");
  const checklist = useLiveTable<ChecklistItem>("checklist_items", "position");
  const budget = useLiveTable<BudgetItem>("budget_items", "position");

  const t = textMap(texts.rows);
  const st = (slug: string) => (v: string) =>
    void updateText(slug, v, {
      section: "Textos",
      action: "update",
      description: `editó un texto de "${shortText(t[slug] ?? "")}" a "${shortText(v)}"`,
    });

  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setName(getDisplayName());
    setReady(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {ready && !name ? (
        <NameGate
          onSubmit={(n) => {
            setDisplayName(n);
            setName(n);
          }}
        />
      ) : null}
      {historyOpen ? (
        <HistoryPanel onClose={() => setHistoryOpen(false)} />
      ) : null}

      <div className="hero-band">
        <div className="mx-auto max-w-[960px] px-6 py-14 sm:py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <TiendanubeLogo className="h-7 w-auto sm:h-8" />
              <Editable
                value={t.hero_kicker ?? ""}
                onSave={st("hero_kicker")}
                className="text-xs font-semibold text-white/75"
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="ghost-btn"
              >
                Historial
              </button>
              {name ? (
                <span className="text-white/70">
                  Sesión: <span className="font-bold text-cyan">{name}</span>{" "}
                  <button
                    type="button"
                    onClick={() => {
                      clearDisplayName();
                      setName(null);
                    }}
                    className="underline underline-offset-2 hover:text-cyan"
                  >
                    cambiar
                  </button>
                </span>
              ) : null}
            </div>
          </div>

          <Editable
            value={t.hero_eyebrow ?? ""}
            onSave={st("hero_eyebrow")}
            className="mt-9 block text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-cyan"
          />

          <h1 className="mt-3 text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-[2.7rem]">
            <Editable
              value={t.hero_title_pre ?? ""}
              onSave={st("hero_title_pre")}
            />{" "}
            <Editable
              value={t.hero_title_highlight ?? ""}
              onSave={st("hero_title_highlight")}
              className="text-cyan"
            />{" "}
            <Editable
              value={t.hero_title_post ?? ""}
              onSave={st("hero_title_post")}
            />
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            <Editable
              value={t.hero_subtitle ?? ""}
              onSave={st("hero_subtitle")}
              multiline
            />
          </p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold">
            <span className="text-white/70">Última actualización</span>
            <Editable
              value={t.last_updated ?? ""}
              onSave={st("last_updated")}
              className="font-bold text-cyan"
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[960px] px-6 pb-4">
        <div className="callout-cyan mt-8 p-4 text-sm leading-relaxed text-dim">
          <Editable
            value={t.usage_note ?? ""}
            onSave={st("usage_note")}
            multiline
          />
        </div>

        {/* Objetivos de alcance */}
        <section className="border-b border-hairline py-12">
          <SectionHeader
            eyebrow={t.goals_eyebrow ?? ""}
            title={t.goals_title ?? ""}
            subtitle={t.goals_subtitle ?? ""}
            onEyebrow={st("goals_eyebrow")}
            onTitle={st("goals_title")}
            onSubtitle={st("goals_subtitle")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.rows.map((m) => (
              <div key={m.id} className="board-card group relative p-5">
                <div className="absolute right-3 top-3">
                  <DeleteButton
                    label="Eliminar objetivo"
                    onClick={() =>
                      void deleteRow("metric_cards", m.id, {
                        section: "Objetivos",
                        action: "delete",
                        description: `eliminó "${shortText(m.label)}" en Objetivos`,
                      })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <Editable
                    value={m.label}
                    onSave={(v) =>
                      void updateRow("metric_cards", m.id, { label: v }, {
                        section: "Objetivos",
                        action: "update",
                        description: `editó "${shortText(m.label)}" a "${shortText(v)}" en Objetivos`,
                      })
                    }
                    className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-dim"
                  />
                  <Editable
                    value={m.badge}
                    onSave={(v) =>
                      void updateRow("metric_cards", m.id, { badge: v }, {
                        section: "Objetivos",
                        action: "update",
                        description: `cambió el estado de "${shortText(m.label)}" a "${shortText(v)}" en Objetivos`,
                      })
                    }
                    className={`badge-pill ${
                      m.badge.trim().toLowerCase() === "propuesto"
                        ? "badge-yellow"
                        : "badge-cyan"
                    }`}
                  />
                </div>
                <Editable
                  value={m.value}
                  onSave={(v) =>
                    void updateRow("metric_cards", m.id, { value: v }, {
                      section: "Objetivos",
                      action: "update",
                      description: `editó el valor de "${shortText(m.label)}" de "${shortText(m.value)}" a "${shortText(v)}" en Objetivos`,
                    })
                  }
                  className="mt-3 block text-3xl font-extrabold tracking-tight sm:text-4xl"
                />
                <Editable
                  value={m.description}
                  onSave={(v) =>
                    void updateRow("metric_cards", m.id, { description: v }, {
                      section: "Objetivos",
                      action: "update",
                      description: `editó la descripción de "${shortText(m.label)}" en Objetivos`,
                    })
                  }
                  className="mt-2 block text-sm leading-relaxed text-dim"
                  multiline
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <AddButton
              onClick={() =>
                void insertRow(
                  "metric_cards",
                  { position: nextPosition(metrics.rows) },
                  {
                    section: "Objetivos",
                    action: "insert",
                    description: "agregó un objetivo en Objetivos",
                  },
                )
              }
            >
              + Agregar objetivo
            </AddButton>
          </div>
        </section>

        {/* KPIs */}
        <section className="border-b border-hairline py-12">
          <SectionHeader
            eyebrow={t.afiliados_eyebrow ?? ""}
            title={t.afiliados_title ?? ""}
            subtitle={t.afiliados_subtitle ?? ""}
            badge="cyan"
            onEyebrow={st("afiliados_eyebrow")}
            onTitle={st("afiliados_title")}
            onSubtitle={st("afiliados_subtitle")}
          />
          <KpiTable rows={kpis.rows} />
          <div className="callout-yellow mt-5 p-4 text-sm leading-relaxed text-foreground/85">
            <Editable
              value={t.afiliados_callout ?? ""}
              onSave={st("afiliados_callout")}
              multiline
            />
          </div>
        </section>

        {/* Equipos */}
        <section className="border-b border-hairline py-12">
          <SectionHeader
            eyebrow={t.teams_eyebrow ?? ""}
            title={t.teams_title ?? ""}
            subtitle={t.teams_subtitle ?? ""}
            onEyebrow={st("teams_eyebrow")}
            onTitle={st("teams_title")}
            onSubtitle={st("teams_subtitle")}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TeamCard
              name={t.team_afiliados_name ?? ""}
              slug="team_afiliados_name"
              team="afiliados"
              items={teamItems.rows}
            />
            <TeamCard
              name={t.team_content_name ?? ""}
              slug="team_content_name"
              team="content"
              items={teamItems.rows}
            />
          </div>
          <div className="mt-6">
            <h4 className="mb-3 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-cyan">
              <Editable
                value={t.budget_title ?? "Budget"}
                onSave={st("budget_title")}
              />
            </h4>
            <BudgetTable rows={budget.rows} />
          </div>
          <div className="callout-yellow mt-5 p-4 text-sm leading-relaxed text-foreground/85">
            <Editable
              value={t.teams_callout ?? ""}
              onSave={st("teams_callout")}
              multiline
            />
          </div>
        </section>

        {/* Tareas */}
        <section className="py-12">
          <SectionHeader
            eyebrow={t.pitch_eyebrow ?? ""}
            title={t.pitch_title ?? ""}
            subtitle={t.pitch_subtitle ?? ""}
            onEyebrow={st("pitch_eyebrow")}
            onTitle={st("pitch_title")}
            onSubtitle={st("pitch_subtitle")}
          />
          <h3 className="mb-3 text-lg font-extrabold">Tareas</h3>
          <TareasTable rows={checklist.rows} />
        </section>
      </main>

      <footer className="border-t border-hairline py-10">
        <div className="mx-auto flex max-w-[960px] flex-col items-center gap-3 px-6 text-center">
          <TiendanubeLogo className="h-4 w-auto opacity-45" />
          <p className="text-xs text-dim">
            <Editable
              value={t.footer_text ?? ""}
              onSave={st("footer_text")}
              multiline
            />
          </p>
          <p className="text-xs text-dim">
            Última actualización:{" "}
            <Editable
              value={t.last_updated ?? ""}
              onSave={st("last_updated")}
              className="font-semibold text-cyan"
            />
          </p>
        </div>
      </footer>
    </div>
  );
}
