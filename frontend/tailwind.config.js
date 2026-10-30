/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#070B12",
        panel: "#0C121C",
        edge: "#1B2533",
        hhg: "#0B6839",
        signal: "#10B981", // Crisp emerald for verified security outcomes
        policy: "#FBBF24", // Amber for policy staging / rules
        accent: "#6366F1", // Indigo accent
        exploit: "#F43F5E", // Rose/red for verified exploits
        evidence: "#818CF8", // Periwinkle for evidence & traces
        ink: "#F8FAFC",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "SF Pro Text", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Space Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        slidein: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseglow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        slidein: "slidein 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        pulseglow: "pulseglow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
