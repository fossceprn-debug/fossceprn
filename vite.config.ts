import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const resendApiKey =
    env.RESEND_API_KEY ||
    env.VITE_RESEND_API_KEY ||
    "";

  return {
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
            "vendor-zip": ["jszip"],
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api/resend": {
          target: "https://api.resend.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/resend/, ""),
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        },
      },
    },
  };
});
