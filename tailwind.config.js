/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nss: {
          // --- 1. Background Layers ---
          bg: '#0B0E11',       // Main Canvas (Deepest Level)
          panel: '#15191E',    // Sidebars, Headers (Level 1 Elevation)
          surface: '#1F242C',  // Cards, Inputs, List Items (Level 2 Elevation)
          
          // --- 2. Structural Lines ---
          border: '#2A303C',   // Subtle dividers between panels
          borderHigh: '#4B5563', // Active borders, or hover states

          // --- 3. Typography ---
          text: '#E2E8F0',     // Primary Text (High readability)
          muted: '#94A3B8',    // Secondary Labels, Units (req/s, ms)
          placeholder: '#64748B', // Empty input text

          // --- 4. Brand & Interaction ---
          primary: '#3B82F6',  // "Run Sim" Button, Active Selection (Blue)
          primaryHover: '#2563EB', // Hover state for primary actions
          
          // --- 5. Data Visualization (Status) ---
          success: '#10B981',  // Healthy Nodes / Low Latency (Green)
          warning: '#F59E0B',  // Degraded / Medium Latency (Amber)
          danger: '#EF4444',   // Critical Failures / Errors (Red)
          info: '#6366F1',     // Networking / Standard Logs (Indigo)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // UI Text
        mono: ['JetBrains Mono', 'monospace'],      // Metrics, IDs, Code
      }
    },
  },
  plugins: [],
}