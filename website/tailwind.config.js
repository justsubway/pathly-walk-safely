/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#000000',
          neon: '#9DFF00',
          yellow: '#FDFD96',
          white: '#FFFFFF',
          gray: '#C0C0C0',
        }
      },
      fontFamily: {
        'display': ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        'body': ['Quicksand', 'Inter', 'system-ui', 'sans-serif'],
        'sans': ['Quicksand', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fade-in 0.8s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
