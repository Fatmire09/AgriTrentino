/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        agri: {
          green: "#2D6A2D",
          greenLight: "#4CAF50",
          greenDark: "#1A4A1A",
          beige: "#F5F0E8",
          red: "#E53E3E",
        },
      },
    },
  },
  plugins: [],
}
