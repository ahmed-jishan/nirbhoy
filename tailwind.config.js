/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--color-bg-rgb) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated-rgb) / <alpha-value>)",
        elevated2: "rgb(var(--color-elevated2-rgb) / <alpha-value>)",
        border: "rgb(var(--color-border-rgb) / <alpha-value>)",
        borderStrong: "rgb(var(--color-border-strong-rgb) / <alpha-value>)",
        text: {
          primary: "rgb(var(--color-text-primary-rgb) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted-rgb) / <alpha-value>)",
          faint: "rgb(var(--color-text-faint-rgb) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger-rgb) / <alpha-value>)",
          soft: "rgb(var(--color-danger-soft-rgb) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent-rgb) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft-rgb) / <alpha-value>)",
          dim: "rgb(var(--color-accent-dim-rgb) / <alpha-value>)",
          bright: "rgb(var(--color-accent-bright-rgb) / <alpha-value>)",
          glow: "rgb(var(--color-accent-glow-rgb) / <alpha-value>)",
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
        lantern: "var(--bg-lantern)",
        "accent-radial": "var(--bg-accent-radial)",
        "grid-pattern": "var(--bg-grid-pattern)",
        "body-bg": "var(--bg-body)",
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