/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nss: {
          bg: 'var(--nss-bg)',
          panel: 'var(--nss-panel)',
          surface: 'var(--nss-surface)',
          border: 'var(--nss-border)',
          borderHigh: 'var(--nss-border-high)',
          text: 'var(--nss-text)',
          muted: 'var(--nss-muted)',
          placeholder: 'var(--nss-placeholder)',
          primary: 'var(--nss-primary)',
          primaryHover: 'var(--nss-primary-hover)',
          success: 'var(--nss-success)',
          warning: 'var(--nss-warning)',
          danger: 'var(--nss-danger)',
          info: 'var(--nss-info)',
        }
      },
    },
  },
  plugins: [],
}