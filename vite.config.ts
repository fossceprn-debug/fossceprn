import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "lucide-react",
          ],
          "vendor-supabase": ["@supabase/supabase-js", "@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
