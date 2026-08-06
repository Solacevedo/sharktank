-- Repositorio de KPIs y Objetivos — Shark Tank x Tiendanube
-- Run this once in a fresh Supabase project's SQL Editor (Database -> SQL Editor -> New query).
-- Creates every table the board needs, with open RLS (no auth: this is an
-- internal link-shared tool, intentionally) and Realtime enabled on all of
-- them, then seeds the current content of the board.

-- 1) Tables ------------------------------------------------------------

create table public.board_texts (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table public.metric_cards (
  id uuid not null default gen_random_uuid() primary key,
  label text not null default 'Nuevo objetivo',
  badge text not null default 'Estimado',
  value text not null default 'A definir',
  description text not null default 'Descripción',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.kpi_rows (
  id uuid not null default gen_random_uuid() primary key,
  team text not null default 'otro',
  kpi text not null default 'Nuevo KPI',
  definicion text not null default 'Definición',
  target text not null default 'A definir',
  frecuencia text not null default 'Semanal',
  fuente text not null default 'A definir',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.team_items (
  id uuid not null default gen_random_uuid() primary key,
  team text not null,
  kind text not null,
  content text not null default 'Nuevo punto',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid not null default gen_random_uuid() primary key,
  content text not null default 'Nueva acción',
  team text not null default 'otro',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  item text not null default 'Nuevo ítem',
  amount text not null default 'A definir',
  team text not null default 'otro',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'Anónimo',
  section text not null default '',
  action text not null default 'update',
  description text not null default '',
  created_at timestamptz not null default now()
);
create index activity_log_created_at_idx on public.activity_log (created_at desc);

-- 2) Grants + open RLS --------------------------------------------------
-- No login on this tool: anyone with the link can read and write. Only
-- activity_log restricts anon to insert+select (no edit/delete of history).

grant select, insert, update, delete on public.board_texts, public.metric_cards,
  public.kpi_rows, public.team_items, public.checklist_items, public.budget_items
  to anon, authenticated;
grant select, insert on public.activity_log to anon;
grant select, insert, update, delete on public.activity_log to authenticated;
grant all on public.board_texts, public.metric_cards, public.kpi_rows, public.team_items,
  public.checklist_items, public.budget_items, public.activity_log to service_role;

alter table public.board_texts enable row level security;
alter table public.metric_cards enable row level security;
alter table public.kpi_rows enable row level security;
alter table public.team_items enable row level security;
alter table public.checklist_items enable row level security;
alter table public.budget_items enable row level security;
alter table public.activity_log enable row level security;

create policy "board_texts open" on public.board_texts for all to anon, authenticated using (true) with check (true);
create policy "metric_cards open" on public.metric_cards for all to anon, authenticated using (true) with check (true);
create policy "kpi_rows open" on public.kpi_rows for all to anon, authenticated using (true) with check (true);
create policy "team_items open" on public.team_items for all to anon, authenticated using (true) with check (true);
create policy "checklist_items open" on public.checklist_items for all to anon, authenticated using (true) with check (true);
create policy "budget_items open" on public.budget_items for all to anon, authenticated using (true) with check (true);
create policy "activity_log open read" on public.activity_log for select to anon, authenticated using (true);
create policy "activity_log open insert" on public.activity_log for insert to anon, authenticated with check (true);

-- 3) Realtime ------------------------------------------------------------

alter table public.board_texts replica identity full;
alter table public.metric_cards replica identity full;
alter table public.kpi_rows replica identity full;
alter table public.team_items replica identity full;
alter table public.checklist_items replica identity full;
alter table public.budget_items replica identity full;
alter table public.activity_log replica identity full;

alter publication supabase_realtime add table public.board_texts;
alter publication supabase_realtime add table public.metric_cards;
alter publication supabase_realtime add table public.kpi_rows;
alter publication supabase_realtime add table public.team_items;
alter publication supabase_realtime add table public.checklist_items;
alter publication supabase_realtime add table public.budget_items;
alter publication supabase_realtime add table public.activity_log;

-- 4) Seed: current content of the board (as of the Lovable -> Vercel migration) ----

insert into public.board_texts (slug, value) values
('hero_kicker', 'tiendanube · Shark Tank / Partnerships'),
('hero_eyebrow', 'KPIS Y OBJETIVOS'),
('hero_title_pre', 'El próximo hit'),
('hero_title_highlight', 'x Tiendanube'),
('hero_title_post', '— seguimiento del proyecto'),
('hero_subtitle', 'Documento vivo para centralizar objetivos de alcance, KPIs por equipo (Afiliados/Adquisición y Content Hub/Brand) y el estado del pitch a la productora, a medida que el proyecto avanza de fase.'),
('last_updated', to_char(now(), 'DD/MM/YYYY')),
('usage_note', 'Cómo usar este tablero: hacé click en cualquier texto para editarlo. Usá los botones ''+ Agregar…'' para sumar filas, KPIs o acciones nuevas. Los cambios se guardan y se ven en vivo para todo el equipo, sin recargar la página.'),
('goals_eyebrow', 'OBJETIVOS DE ALCANCE'),
('goals_title', 'Objetivos globales del proyecto'),
('goals_subtitle', 'Todos los valores de esta sección son estimaciones de trabajo al día de hoy, no métricas confirmadas — se van ajustando a medida que el proyecto avance.'),
('afiliados_eyebrow', 'KPIs'),
('afiliados_title', 'KPIs del proyecto'),
('afiliados_subtitle', 'Todos los KPIs del proyecto en una sola tabla, con el equipo responsable de cada uno. Los targets son estimaciones de trabajo al día de hoy, a ajustar con datos reales a medida que avance la campaña.'),
('afiliados_callout', 'Requisitos de participación en el programa: haber creado una tienda Tiendanube a través del link de la acción. TBC: si se van a aceptar tiendas que no sean nuevas (no-sellers ya activos / en free trial) y, en ese caso, si se van a permitir migraciones desde otras plataformas.'),
('teams_eyebrow', 'Equipos involucrados'),
('teams_title', 'Responsabilidades y budget por equipo'),
('teams_subtitle', 'La iniciativa necesita a los dos equipos para funcionar: Afiliados aporta la lógica de adquisición y los perfiles; Content Hub / Brand aporta el concepto creativo y la producción.'),
('teams_callout', 'Anexo · Eficiencia de presupuesto: posibilidad de sumar tech partners o aliados corporativos como sponsors — obtienen visibilidad en la campaña y en los contenidos de los embajadores, reduciendo el budget propio necesario.'),
('team_afiliados_name', 'Afiliados / Acquisition'),
('team_content_name', 'Content Hub / Brand'),
('budget_title', 'Budget'),
('pitch_eyebrow', 'Pitch a la productora'),
('pitch_title', 'Estado: productora aún no definida'),
('pitch_subtitle', 'El formato Shark Tank requiere una productora para la ejecución audiovisual (jurado en vivo, votación, piezas de alto nivel de producción). Todavía no se seleccionó — este es el checklist para llegar al pitch.'),
('footer_text', 'Repositorio interno · Proyecto Shark Tank · Tiendanube — Afiliados × Content Hub');

insert into public.metric_cards (label, badge, value, description, position) values
('Leads estimados', 'Estimado', '20K', 'Postulaciones al concurso', 1),
('Trials', 'Estimado', '1K', 'Tiendas creadas con el link del concurso', 2),
('New Payments', 'Estimado', '200', 'Tiendas que pasan a pago', 3),
('CVR Lead → Trial → NP', 'Estimado', '5% → 20%', 'Lead→Trial 5% · Trial→NP 20%, sobre los targets estimados.', 4);

insert into public.kpi_rows (team, kpi, definicion, target, frecuencia, fuente, position) values
('afiliados', 'Leads', 'Postulaciones vía formulario + creación de tienda con link del concurso', '20.000', 'Semanal', 'Funnel de adquisición', 1),
('afiliados', 'Trials', 'Tiendas creadas que completan el módulo inicial', '1.000', 'Semanal', 'Funnel de adquisición', 2),
('afiliados', 'New Payments (NPs)', 'Tiendas que pasan de trial a plan pago', '200', 'Semanal', 'Funnel de adquisición', 3),
('afiliados', 'CAC', 'Costo de adquisición por NP (budget de pauta + fee embajadores / NPs)', 'A definir', 'Mensual', 'Budget', 4),
('afiliados', 'New Sellers', 'Social sellers que dan el salto a e-commerce vía esta iniciativa', 'A definir', 'Mensual', 'Funnel de adquisición', 5),
('afiliados', 'Branded searches', 'Incremento de búsquedas de marca durante la campaña', 'A definir', 'Mensual', 'SEO / Search', 6),
('afiliados', 'Conversión Lead → Trial → NP', '% de caída en cada paso del funnel', 'Lead→Trial 5% · Trial→NP 20%', 'Semanal', 'Funnel de adquisición', 7),
('paid_media', 'CPL / CPM pauta', 'Costo por lead y por mil impresiones en Meta + TikTok', 'A definir', 'Semanal', 'Pauta Meta/TikTok', 8),
('brand', 'Alcance (reach)', 'Cuentas únicas alcanzadas por contenido orgánico + pautado', 'A definir', 'Semanal', 'Meta/TikTok Insights', 9),
('brand', 'Views / reproducciones', 'Reproducciones totales de piezas de embajadores, jurado y mentores', 'A definir', 'Semanal', 'Meta/TikTok Insights', 10),
('brand', 'Engagement rate', '(Likes + comments + shares) / impresiones', 'A definir', 'Semanal', 'Meta/TikTok Insights', 11),
('brand', 'Piezas de contenido producidas', 'Cantidad de piezas entregadas por fase (concepto, convocatoria, finalistas)', 'A definir por fase', 'Por fase', 'Plan de producción', 12),
('brand', 'Costo por pieza producida', 'Budget de materiales y proveedores / piezas entregadas', 'A definir', 'Por fase', 'Budget Content Hub', 13),
('brand', 'Share of voice', 'Menciones de la iniciativa vs. otras campañas del período', 'A definir', 'Mensual', 'Social listening', 14),
('brand', 'Sentiment de menciones', 'Tono cualitativo de comentarios y menciones (positivo/neutral/negativo)', 'A definir', 'Mensual', 'Social listening', 15);

insert into public.team_items (team, kind, content, position) values
('afiliados', 'resp', 'Funnel de adquisición: postulación, tienda, activación.', 1),
('afiliados', 'resp', 'Pauta Meta + TikTok y negociación con embajadores.', 2),
('afiliados', 'resp', 'Seguimiento de contenidos y dinámica con los embajadores.', 3),
('afiliados', 'resp', 'Owner de fase: funnel, pauta y embajadores.', 4),
('content', 'resp', 'Validar la idea y confirmar prioridad en Q3–Q4.', 1),
('content', 'resp', 'Concepto creativo: naming, estética, formato de contenido.', 2),
('content', 'resp', 'Dinámica de producción: canales, piezas, distribución.', 3),
('content', 'resp', 'Owner de fase: concepto creativo y producción.', 4);

insert into public.checklist_items (content, team, position) values
('Definir criterios de selección — experiencia en formatos de streaming/reality, capacidad de producción en Argentina, presupuesto de referencia.', 'otro', 1),
('Armar el brief/RFP — concepto, fases estimadas, jurado en mente, objetivos de alcance y KPIs de esta tabla como base de la conversación comercial.', 'otro', 2),
('Shortlist de productoras — identificar 3–5 candidatas y agendar reuniones exploratorias.', 'otro', 3),
('Asignar owner del proceso — hoy ''por definir'' según el pitch original; necesita nombre y equipo responsable.', 'otro', 4),
('Definir modelo de acuerdo — fee fijo, revenue share, sponsors/tech partners como co-financiamiento (ver anexo de eficiencia de presupuesto).', 'otro', 5);

-- budget_items intentionally left empty — it's a blank grid for the team to fill in.
