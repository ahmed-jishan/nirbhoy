/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0E15",
        elevated: "#10171F",
        elevated2: "#18222E",
        border: "rgba(255,255,255,0.06)",
        borderStrong: "rgba(255,255,255,0.12)",
        text: {
          primary: "#E1E4E8",
          muted: "#7D8899",
          faint: "#505A6B",
        },
        amber: {
          DEFAULT: "#8892A4",
          soft: "#1E2530",
          dim: "#6B7A90",
          bright: "#A0B0C4",
          glow: "rgba(136,146,164,0.12)",
        },
        danger: {
          DEFAULT: "#C4634F",
          soft: "#3A2420",
        },
        accent: {
          DEFAULT: "#7C8BA0",
          soft: "#1A212E",
          dim: "#5E6D82",
          bright: "#94A4B8",
          glow: "rgba(124,139,160,0.10)",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'VT323'", "'JetBrains Mono'", "ui-monospace", "monospace"],
        terminal: ["'VT323'", "ui-monospace", "monospace"],
        code: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        lantern: "radial-gradient(circle at 78% 18%, rgba(136,146,164,0.12), transparent 45%)",
        "accent-radial": "radial-gradient(circle at 22% 82%, rgba(124,139,160,0.05), transparent 45%)",
        "grid-pattern": `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/svg%3E")`,
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