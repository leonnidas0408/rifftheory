import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "/rifftheory/",
    plugins: [react()], 
});