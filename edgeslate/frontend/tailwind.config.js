/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        slateboard: "#121A2A",
        mist: "#E8EEF7",
        edge: "#12B886",
        "edge-dim": "#0B8F68",
        warn: "#E8A317",
        frost: "#F4F7FB",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(18, 184, 134, 0.18)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseEdge: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.9" },
        },
        sweep: {
          "0%": { transform: "translateX(-30%)" },
          "100%": { transform: "translateX(130%)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "rise-delay": "rise 0.7s ease-out 0.15s both",
        "rise-delay-2": "rise 0.7s ease-out 0.3s both",
        "pulse-edge": "pulseEdge 3.2s ease-in-out infinite",
        sweep: "sweep 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
