
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFF0F0',
          100: '#FFE5E5',
          400: '#FF8F8F',
          500: '#FF6B6B', // Primary Accent
          600: '#E64545',
        },
        trust: {
          blue: '#4A90E2',
          green: '#52C41A',
        },
        gray: {
          50: '#FAFAFA', // Base Background
          100: '#F5F5F5',
          200: '#E0E0E0',
          800: '#1A1A1A', // Soft Black
          900: '#111111',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 8px 30px -4px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
