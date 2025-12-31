/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nssimulator: {
          bg: '#0B0E11',       // Main Canvas
          panel: '#15191E',    // Sidebars
          element: '#1F242C',  // Inputs/Cards
          border: '#2A303C',   // Borders
          primary: '#3B82F6',  // Bright Blue
          text: '#E2E8F0',     // White/Grey
          muted: '#94A3B8',    // Muted Grey
        }
      }
    },
  },
  plugins: [],
}