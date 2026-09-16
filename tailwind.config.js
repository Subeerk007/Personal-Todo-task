/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: "#FDF6F0",
        creamDark: "#F5EDE4",
        creamDeep: "#EDE4D8",
        // Card surfaces
        cardWhite: "#FFFFFF",
        cardHover: "#FFF9F5",
        // Primary accent (terracotta / coral)
        terra: "#C75B39",
        terraLight: "#E8714D",
        terraDark: "#A84A2E",
        terraPale: "#FFF0EB",
        // Navy / dark text
        navy: "#2C3E50",
        navyLight: "#4A6274",
        navyFaint: "#8A9BAD",
        // Success green
        forest: "#27AE60",
        forestLight: "#D4EFDF",
        forestDark: "#1E8449",
        // Warning / pending orange
        amber: "#E67E22",
        amberLight: "#FDE8D0",
        // Borders
        borderLight: "#E8E0D6",
        borderMedium: "#D4CCC2",
        // Tags
        tagWork: "#FFF0EB",
        tagWorkText: "#C75B39",
        tagPersonal: "#D4EFDF",
        tagPersonalText: "#1E8449",
        tagStudy: "#E8E0F8",
        tagStudyText: "#6C3FA0",
        tagHealth: "#FDE8D0",
        tagHealthText: "#B8600A",
      },
      fontFamily: {
        heading: ["'Outfit'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(44, 62, 80, 0.06)",
        cardHover: "0 4px 20px rgba(44, 62, 80, 0.1)",
        button: "0 2px 8px rgba(199, 91, 57, 0.25)",
        buttonHover: "0 4px 16px rgba(199, 91, 57, 0.35)",
        soft: "0 1px 4px rgba(44, 62, 80, 0.04)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        checkmark: {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease-out",
        fadeIn: "fadeIn 0.3s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        scaleIn: "scaleIn 0.2s ease-out",
        pulse: "pulse 0.3s ease-in-out",
        checkmark: "checkmark 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
