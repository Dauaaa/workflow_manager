import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "./src/") }],
  },
});
