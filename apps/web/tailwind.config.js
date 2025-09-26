/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        orange: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
      fontFamily: {
        retro: ["Orbitron", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      animation: {
        float: "retro-float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in-right": "slideInRight 0.8s ease-out",
        "grid-move": "gridMove 20s linear infinite",
        "scan-lines": "scanLines 2s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-retro":
          "linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)",
        "gradient-metallic":
          "linear-gradient(135deg, #fed7aa 0%, #fb923c 25%, #f97316 50%, #ea580c 75%, #c2410c 100%)",
        "gradient-light":
          "linear-gradient(135deg, #fafafa 0%, #fff7ed 50%, #f5f5f5 100%)",
      },
      boxShadow: {
        retro: "0 4px 20px rgba(251, 146, 60, 0.15)",
        metallic:
          "0 8px 32px rgba(251, 146, 60, 0.2), 0 2px 8px rgba(249, 115, 22, 0.1)",
        glow: "0 0 30px rgba(251, 146, 60, 0.3)",
        "inset-retro": "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
      },
    },
  },
  plugins: [],
};
