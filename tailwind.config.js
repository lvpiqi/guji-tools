/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#faf8f5',
        ink: '#2c2416',
        seal: '#c23a2b',
        gold: '#c9a227',
      },
      fontFamily: {
        guji: ['"Noto Serif SC"', '"Source Han Serif CN"', 'serif'],
      },
    },
  },
  plugins: [],
}
