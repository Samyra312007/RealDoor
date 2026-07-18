/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "Consolas", "monospace"],
      },
      colors: {
        ink: "#1E2A38",
        paper: "#FAF8F3",
        brass: "#A87C3F",
        confirmed: "#4B6F52",
        review: "#C08A2E",
        expired: "#9B4238",
        line: "#DDD6C8",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      rotate: {
        "stamp": "-1.5deg",
      },
    },
  },
  plugins: [],
};
