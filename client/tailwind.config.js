/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable dark mode via the 'dark' class

  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: "#000000",        // Dark gray/black for backgrounds
        secondary: "#60a5fa",      // Tailwind's Blue-400
        accent: "#00BCD4",         // A nice green (emerald-500)
        muted: "#9ca3af",          // Tailwind's gray-400 for subtle text
        background: "#1e1e1e",     // Slightly lighter than primary, for content areas
        surface: "#2c2c2c",        // Card and surface containers

        // dark mode colors (used via `dark:` prefix)
        darkPrimary: "#313338",
        darkSurface: "#2B2D31",
        darkSidebar: "#1E1F22",
        darkMuted: "#3A3C41",
        darkTextPrimary: "#FFFFFF",
        darkTextSecondary: "#B5BAC1",
        darkTextMuted: "#949BA4",
        darkBlurple: "#9B5DE5",         // Vibrant magenta-violet
        darkBlurpleHover: "#7C3ACF",    // Darker violet for hover
        darkOnlineGreen: "#23A55A",
        darkBorderLight: "#3F4248",
        darkBorderMuted: "#2B2D31",
      },

      fontFamily: {
        atkinson: ['"Atkinson Hyperlegible"', 'sans-serif'],
      },

      container: {
        padding: {
          md: "10rem",
        },
      },
    },
  },

  plugins: [],
};
