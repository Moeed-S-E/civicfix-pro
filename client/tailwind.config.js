/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        // ── Civic AI Brand Palette ──────────────────────────────────────────
        // Main brand color — headers, navbars, dark backgrounds
        navy:   '#073574',
        // Buttons, links, interactive elements, accent highlights
        sky:    '#2EA0F2',
        // Success states, eco/civic badges
        civic:  '#0B7B3E',
        // Action indicators, positive metric cards
        leaf:   '#34C759',
        // App background, card surfaces, neutral container fills
        canvas: '#F8FAFC',
        // Main body text, headings, high-contrast labels
        ink:    '#1E293B',
      },
      boxShadow: {
        // Subtle navy-tinted card shadow
        card: '0 12px 32px rgba(7, 53, 116, 0.08)'
      }
    }
  },
  plugins: []
};
