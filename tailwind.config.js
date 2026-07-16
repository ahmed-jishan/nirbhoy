/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0D1117",
        elevated: "#141B24",
        elevated2: "#1B2430",
        border: "rgba(255,255,255,0.08)",
        borderStrong: "rgba(255,255,255,0.14)",
        text: {
          primary: "#E7E9EC",
          muted: "#8A94A6",
          faint: "#5C6577",
        },
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#3D3121",
          dim: "#B87F2A",
        },
        teal: {
          DEFAULT: "#4F9C8C",
          soft: "#16302B",
        },
        danger: {
          DEFAULT: "#C4634F",
          soft: "#3A2420",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        lantern: "radial-gradient(circle at 78% 18%, rgba(232,163,61,0.16), transparent 45%)",
      },
    },
  },
  plugins: [],
};
