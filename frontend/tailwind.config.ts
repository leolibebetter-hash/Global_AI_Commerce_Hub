import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#059669",
          hover: "#047857",
          light: "#ECFDF5",
          foreground: "#FFFFFF",
        },
        foreground: "#064E3B",
        accent: "#EA580C",
        surface: "#FFFFFF",
        border: "#A7F3D0",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
} satisfies Config;
