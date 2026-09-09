/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#070707",
        surface: "#111111",
        card: "#1A1A1A",
        line: "#2A2A2A",
        lime: "#C8FF00",
        "lime-dim": "#A6D600",
        mist: "#E8E8E8",
        mute: "#8A8A8A",
        danger: "#FF5A5A",
        warn: "#FFB020",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lime: "0 0 0 1px rgba(200,255,0,0.25), 0 12px 40px rgba(200,255,0,0.12)",
        card: "0 8px 32px rgba(0,0,0,0.45)",
      },
      borderRadius: {
        sheet: "1.25rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseLime: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200,255,0,0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(200,255,0,0)" },
        },
      },
      animation: {
        rise: "rise 0.55s ease-out both",
        "rise-2": "rise 0.55s ease-out 0.12s both",
        "rise-3": "rise 0.55s ease-out 0.24s both",
        "pulse-lime": "pulseLime 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
