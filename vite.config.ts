import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Plain Vite + React SPA. No SSR, no server framework — this board is 100%
// client-rendered against Supabase (realtime), so a static build is all we need.
// Deploys on Vercel with zero extra config (framework auto-detected as Vite).
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
});
