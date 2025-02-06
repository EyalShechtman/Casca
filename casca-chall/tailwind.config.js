/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        loading: {
          '0%': { width: '0%' },
          '50%': { width: '90%' },
          '100%': { width: '90%' },
        }
      },
      animation: {
        loading: 'loading 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 