/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Primary text
        tx: {
          DEFAULT: "#0F172A",
          primary: "#1E293B",
          secondary: "#475569",
          tertiary: "#64748B",
          muted: "#94A3B8",
        },
        // Surface / Background
        sf: {
          DEFAULT: "#FAFBFC",
          secondary: "#F1F5F9",
          tertiary: "#E2E8F0",
          card: "#FFFFFF",
          overlay: "rgba(15, 23, 42, 0.6)",
        },
        // Border / Stroke
        st: {
          DEFAULT: "#E2E8F0",
          secondary: "#CBD5E1",
          tertiary: "#94A3B8",
        },
        // Brand / Primary (Indigo)
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        // Legacy support
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
            900: "#312E81",
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
        // Semantic colors
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        matter: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        // Subtle shadows
        "subtle": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "sm": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        // Brand shadows
        "brand-sm": "0 2px 8px -2px rgba(99, 102, 241, 0.3)",
        "brand": "0 4px 14px -2px rgba(99, 102, 241, 0.35)",
        "brand-lg": "0 8px 30px -4px rgba(99, 102, 241, 0.4)",
        // Legacy support
        "app-sm": "0 2px 8px -1px rgba(30, 32, 51, 0.04), 0 1px 3px -1px rgba(30, 32, 51, 0.02)",
        "app-card": "0 4px 20px -2px rgba(30, 32, 51, 0.05), 0 2px 6px -1px rgba(30, 32, 51, 0.02)",
        "app-hover": "0 12px 32px -4px rgba(30, 32, 51, 0.08), 0 4px 12px -2px rgba(30, 32, 51, 0.03)",
        "btn-primary": "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 2px 6px rgba(30, 32, 51, 0.12)",
        "btn-outline": "inset 0 0 0 1px rgba(30, 32, 51, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(ellipse at 50% -10%, #D5E2FF 0%, #EEF2FF 40%, transparent 70%)",
        "app-btn": "linear-gradient(to bottom, #3A3F5C 0%, #1E2033 100%)",
        "app-btn-hover": "linear-gradient(to bottom, #474D6E 0%, #2A2D45 100%)",
        "app-outline-btn": "linear-gradient(to bottom, #FFFFFF 0%, #F0F1F5 100%)",
        "gradient-brand": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "gradient-success": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "gradient-warning": "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        "gradient-danger": "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
        "gradient-mesh": "radial-gradient(at 40% 20%, hsla(250,80%,60%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(250,60%,50%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(250,80%,60%,0.1) 0px, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};
