import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          brown: '#713600',
          orange: '#C05800',
          cream: '#FDFBD4',
          espresso: '#38240D',
        },
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-subtle': 'var(--bg-subtle)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          strong: 'var(--primary-strong)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
        surface: 'var(--surface)',
      },
      borderRadius: {
        card: '12px',
        input: '10px',
        pill: '9999px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(56, 36, 13, 0.08), 0 2px 6px -1px rgba(56, 36, 13, 0.04)',
        'warm-lg': '0 10px 30px -4px rgba(56, 36, 13, 0.12), 0 4px 10px -2px rgba(56, 36, 13, 0.06)',
      },
      keyframes: {
        'logo-loop': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
      },
      animation: {
        'logo-loop': 'logo-loop 30s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
