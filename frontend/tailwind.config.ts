import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7fb",
          100: "#fdeaf3",
          200: "#f8cfe5",
          300: "#f3b5d7",
          400: "#ee9cc8",
          500: "#d776ae",
          600: "#b4578e",
          700: "#8f3c6f",
          800: "#6a2750",
          900: "#451434",
        },
      },
      boxShadow: {
        soft: "0 10px 40px rgba(212, 63, 120, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
