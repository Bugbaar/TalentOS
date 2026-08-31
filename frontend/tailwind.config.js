/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tx: {
          DEFAULT: "#1E2033",
          secondary: "#545A75",
          tertiary: "#8C93A8",
          muted: "#A0A7BD",
        },
        sf: {
          DEFAULT: "#FAF9F6",
          secondary: "#F2F4F8",
          tertiary: "#E7EBF2",
          card: "#FFFFFF",
        },
        st: {
          DEFAULT: "#E2E6EE",
          secondary: "#ECEFF5",
        },
        sr: {
          indigo: {
            50: "#EEF2FF",
            100: "#E0E7FF",
            200: "#C7D2FE",
            300: "#A5B4FC",
            400: "#818CF8",
            500: "#6366F1",
            600: "#4F46E5",
            700: "#3730A3",
            900: "#1E2B58",
          },
          green: {
            700: "#059669",
            100: "#D1FAE5",
          },
          orange: {
            700: "#EA580C",
            100: "#FFEDD5",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        matter: ["var(--font-matter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "sarvam-sm": "0 2px 8px -1px rgba(30, 32, 51, 0.04), 0 1px 3px -1px rgba(30, 32, 51, 0.02)",
        "sarvam-card": "0 4px 20px -2px rgba(30, 32, 51, 0.05), 0 2px 6px -1px rgba(30, 32, 51, 0.02)",
        "sarvam-hover": "0 12px 32px -4px rgba(30, 32, 51, 0.08), 0 4px 12px -2px rgba(30, 32, 51, 0.03)",
        "btn-primary": "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 2px 6px rgba(30, 32, 51, 0.12)",
        "btn-outline": "inset 0 0 0 1px rgba(30, 32, 51, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(ellipse at 50% -10%, #D5E2FF 0%, #EEF2FF 40%, transparent 70%)",
        "sarvam-btn": "linear-gradient(to bottom, #3A3F5C 0%, #1E2033 100%)",
        "sarvam-btn-hover": "linear-gradient(to bottom, #474D6E 0%, #2A2D45 100%)",
        "sarvam-outline-btn": "linear-gradient(to bottom, #FFFFFF 0%, #F0F1F5 100%)",
      },
    },
  },
  plugins: [],
};
