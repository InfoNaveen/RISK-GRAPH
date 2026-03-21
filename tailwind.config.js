/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "var(--cream)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        gold: "var(--gold)",
        "gold-light": "var(--gold-light)",
        "risk-red": "var(--risk-red)",
        "risk-green": "var(--risk-green)",
        border: "var(--border)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
