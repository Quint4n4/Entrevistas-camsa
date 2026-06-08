import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // En Docker sobre Mac, el polling permite que se vean los cambios en caliente.
    watch: { usePolling: true },
  },
});
