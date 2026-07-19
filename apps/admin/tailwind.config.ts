import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leather: {
          300: '#D4A882',
          400: '#C4956A',
          500: '#A87C55',
          600: '#8B6F5E',
          700: '#6B5347',
        },
        brand: {
          DEFAULT: '#C4956A',
          light:   '#D4A882',
          dark:    '#8B6F5E',
        },
        // Tokens específicos do admin
        admin: {
          sidebar: '#111009',      // sidebar quase-preta
          ink:     '#1E1B18',      // texto principal
          muted:   '#6B6560',      // texto secundário
          bg:      '#F7F4F1',      // fundo da área de conteúdo
          surface: '#EDE9E4',      // superfície de hover / inputs
          border:  '#E4DED8',      // bordas
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'admin-sm': '0 1px 3px rgba(30,27,24,0.06)',
        'admin-md': '0 4px 12px rgba(30,27,24,0.08)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}

export default config
