import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        preps: {
          bg: '#030303',
          white: '#f6f6f2',
          yellow: '#FFC93C',
        },
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(.16, 1, .3, 1)',
      },
      keyframes: {
        heroIn: {
          from: { opacity: '0', transform: 'scale(1.12)', filter: 'blur(10px)' },
          to: { opacity: '1', transform: 'scale(1.035)', filter: 'blur(0)' },
        },
        railIn: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        copyIn: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        heroIn: 'heroIn 1.8s cubic-bezier(.16,1,.3,1) forwards',
        railIn: 'railIn 1.1s cubic-bezier(.16,1,.3,1) both',
        blink: 'blink 0.7s step-end infinite',
        copyIn: 'copyIn 1.25s .25s cubic-bezier(.16,1,.3,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
