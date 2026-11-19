// vite.config.js
// Vite build config for the React client.
// We import the Tailwind Vite plugin – this is the modern v4 approach
// (no separate postcss.config.js needed).

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Processes Tailwind utility classes at build time
  ],
  server: {
    port: 5173, // Keep consistent with the CORS origin in the server
  },
});
