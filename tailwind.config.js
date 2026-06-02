/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: '#0f111a',
        bgSecondary: '#1a1d2d',
        bgGlass: 'rgba(26, 29, 45, 0.7)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        accentPrimary: '#6366f1',
        accentHover: '#4f46e5',
        accentGlow: 'rgba(99, 102, 241, 0.4)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8'
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
