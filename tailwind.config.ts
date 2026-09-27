import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#100E1B',
        surface: '#1A1730',
        surface2: '#241F42',
        ink: '#F5F3FF',
        inksoft: '#ABA3D1',
        inkfaint: '#8279AB',
        line: 'rgba(245,243,255,0.08)',
        brand: {
          DEFAULT: '#7C5CFF',
          soft: '#2B2354',
          bright: '#9B82FF',
          fill: '#6A48F0',
          onlight: '#5B3BD9',
        },
        xp: {
          DEFAULT: '#FFC94A',
          soft: '#3D3018',
        },
        certo: {
          DEFAULT: '#2DD4BF',
          soft: '#12332F',
        },
        errado: {
          DEFAULT: '#FF6B6B',
          soft: '#3A1F22',
        },
        papel: {
          DEFAULT: '#FBFAFF',
          alt: '#F1EEFB',
          ink: '#17142A',
        },
        prio: {
          1: '#675AB9',
          2: '#7A68D4',
          3: '#8D78EE',
          4: '#A492FF',
          5: '#C3B0FF',
        },
        dif: {
          1: '#8FE3F5',
          2: '#5CC2E8',
          3: '#4098D8',
          4: '#2E6FC0',
          5: '#2B4CA3',
        },
      },
      fontFamily: {
        display: ['var(--font-fredoka)'],
        body: ['var(--font-lexend)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}

export default config
