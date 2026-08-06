# Repositorio de KPIs y Objetivos — Shark Tank x Tiendanube

Tablero interno, editable en vivo por cualquiera con el link (sin login real —
solo pide un nombre para el historial de cambios). Migrado desde Lovable a un
proyecto Vite + React + Supabase simple, para no depender de créditos de IA de
ningún proveedor: de acá en adelante los cambios se hacen editando el código
directamente.

## Stack

- Vite + React 19 + TypeScript, todo client-side (sin SSR).
- Tailwind CSS v4 (tokens de color y utilidades custom en `src/styles.css`).
- Supabase (Postgres + Realtime) como backend — sin autenticación real, RLS
  abierta a propósito porque es un link interno.
- Deploy recomendado: Vercel (framework Vite, zero-config).

## Setup local

1. `npm install`
2. Copiá `.env.example` a `.env` y completá con los datos de tu proyecto de
   Supabase (Project Settings → API).
3. Corré `supabase/init.sql` en el SQL Editor de tu proyecto de Supabase (crea
   las tablas, las políticas RLS abiertas, Realtime, y siembra el contenido
   actual del tablero).
4. `npm run dev`

## Deploy en Vercel

1. Subí esta carpeta a un repo de GitHub.
2. En Vercel: "Add New Project" → importá el repo → framework "Vite" se
   detecta solo.
3. En Environment Variables, agregá `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY` (los mismos valores que en tu `.env`).
4. Deploy. Cada push a la rama principal vuelve a deployar solo.
