/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tg: {
          blue: '#24A1DE',
          dark: '#0e1621',
          card: '#17212b',
          border: '#242f3d',
          accent: '#2b5278',
          text: '#f5f5f5',
          muted: '#708499',
        }
      }
    },
  },
  plugins: [],
}
