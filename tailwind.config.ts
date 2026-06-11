import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        creme: "#FAF4E8",
        tinta: "#1A1410",
        terracota: "#C84B2F",
        dourado: "#D9A441",
        verde: "#2D5A3D",
        linha: "rgba(26,20,16,.12)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(26,20,16,.06)",
      },
      maxWidth: {
        app: "430px",
      },
    },
  },
  plugins: [],
};
export default config;
