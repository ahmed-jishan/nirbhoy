/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#162033",
        elevated: "#1C2A3D",
        elevated2: "#243348",
        border: "rgba(255,255,255,0.06)",
        borderStrong: "rgba(255,255,255,0.12)",
        text: {
          primary: "#F1F5F9",
          muted: "#94A3B8",
          faint: "#64748B",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#3B1414",
        },
        accent: {
          DEFAULT: "#0D9488",
          soft: "#0F2F2D",
          dim: "#0F766E",
          bright: "#14B8A6",
          glow: "rgba(13,148,136,0.10)",
        },
      },
      fontFamily: {
        // Prefer the self-hosted next/font CSS variables — falls back to
        // the raw family name so tests / SSR without _app work too.
        display: ["var(--font-space-grotesk)", "'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["var(--font-space-grotesk)", "'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["var(--font-vt323)", "'VT323'", "var(--font-jetbrains-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
        terminal: ["var(--font-vt323)", "'VT323'", "ui-monospace", "monospace"],
        code: ["var(--font-jetbrains-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        lantern: "radial-gradient(circle at 78% 18%, rgba(13,148,136,0.08), transparent 45%)",
        "accent-radial": "radial-gradient(circle at 22% 82%, rgba(13,148,136,0.04), transparent 45%)",
        "grid-pattern": `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/svg%3E")`,
        "body-bg":
          "radial-gradient(circle at 78% 8%, rgba(13,148,136,0.04), transparent 50%)," +
          "radial-gradient(circle at 22% 92%, rgba(13,148,136,0.02), transparent 50%)," +
          'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 40 0 L 0 0 0 40\' fill=\'none\' stroke=\'rgba(255,255,255,0.01)\' stroke-width=\'1\'/%3E%3C/svg%3E")',
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 1px)" },
          "40%": { transform: "translate(2px, -1px)" },
          "60%": { transform: "translate(-1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
        "glitch-skew": {
          "0%, 100%": { transform: "skew(0deg, 0deg)" },
          "25%": { transform: "skew(0.5deg, 0.5deg)" },
          "75%": { transform: "skew(-0.5deg, -0.5deg)" },
        },
        typewriter: {
          "from": { width: "0" },
          "to": { width: "100%" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "fade-in-up": {
          "from": { opacity: "0", transform: "translateY(12px)" },
          "to": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(124,139,160,0.1)" },
          "50%": { boxShadow: "0 0 16px rgba(124,139,160,0.2)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        glitch: "glitch 3s infinite, glitch-skew 3s infinite",
        typewriter: "typewriter 2s steps(30) forwards",
        "scan-line": "scan-line 8s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};