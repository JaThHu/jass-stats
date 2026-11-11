/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '400px',
      },
      colors: {
        bg: '#0b0f0e',
        surface: {
          DEFAULT: '#141a18',
          2: '#1c2421',
          3: '#26302c',
        },
        line: '#232c29',
        ink: {
          DEFAULT: '#edf2f0',
          2: '#a6b3ae',
          3: '#6f7c77',
        },
        brand: {
          DEFAULT: '#3ccf87',
          strong: '#2bb673',
        },
        gold: '#f2b84b',
        team0: '#3987e5',
        team1: '#d95926',
        danger: '#ef5b5b',
        wolf: '#e0262a',
        chalk: '#1a2420',
      },
      boxShadow: {
        sheet: '0 -12px 40px rgba(0,0,0,0.5)',
        pop: '0 12px 40px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
}
