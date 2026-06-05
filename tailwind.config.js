/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgMain: 'var(--bg-main)',
        bgSecondary: 'var(--bg-sec)',
        bgGlass: 'var(--bg-glass)',
        borderColor: 'var(--border-color)',
        textPrimary: 'var(--text-pri)',
        textSecondary: 'var(--text-sec)',
        accentPrimary: '#6366f1',
        accentHover: '#4f46e5',
        accentGlow: 'rgba(99, 102, 241, 0.4)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif']
      },
      keyframes: {
        'float-avatar': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      animation: {
        'float-avatar': 'float-avatar 3s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
