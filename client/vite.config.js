/// <reference types="vitest" />
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const clientNodeModules = path.resolve(__dirname, "node_modules");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@jakkash/bill-pdf": path.resolve(__dirname, "../shared/bill-pdf"),
      "@react-pdf/renderer": path.resolve(clientNodeModules, "@react-pdf/renderer"),
      "date-fns": path.resolve(clientNodeModules, "date-fns"),
      react: path.resolve(clientNodeModules, "react"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
});
