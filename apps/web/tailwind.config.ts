import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        roseartisan: {
          50: '#fff8f8',
          100: '#fbeeee',
          200: '#f4dbd9',
          300: '#eabfbb',
          400: '#de9e97',
          500: '#cc7f74',
          600: '#b86458',
          700: '#985147',
          800: '#7f463f',
          900: '#6d403a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(99, 42, 34, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
