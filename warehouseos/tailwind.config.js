/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme colours are CSS channel variables (see src/index.css) that
        // flip between dark and light via the `.dark` class on <html>.
        // Defining them as `rgb(var(--x) / <alpha-value>)` lets every opacity
        // modifier (bg-os-accent/10, text-os-muted/70 ...) work everywhere.
        os: {
          bg: 'rgb(var(--os-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--os-sidebar) / <alpha-value>)',
          card: 'rgb(var(--os-card) / <alpha-value>)',
          border: 'rgb(var(--os-border) / <alpha-value>)',
          text: 'rgb(var(--os-text) / <alpha-value>)',
          muted: 'rgb(var(--os-muted) / <alpha-value>)',
          accent: 'rgb(var(--os-accent) / <alpha-value>)',
          success: 'rgb(var(--os-success) / <alpha-value>)',
          warning: 'rgb(var(--os-warning) / <alpha-value>)',
          danger: 'rgb(var(--os-danger) / <alpha-value>)',
          info: 'rgb(var(--os-info) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.06)',
        glow: '0 0 0 1px rgba(139,92,246,0.25), 0 8px 24px -8px rgba(139,92,246,0.45)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
}
