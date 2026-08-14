/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fbfaf8',
        ink: {
          50: '#f7f6f4',
          100: '#eeecea',
          200: '#e0ddd9',
          300: '#c4bfb9',
          400: '#918b84',
          500: '#6b655e',
          600: '#514c46',
          700: '#3b3733',
          800: '#262320',
          900: '#171513',
        },
        brand: {
          50: '#f6f3ff',
          100: '#ede7ff',
          200: '#dccfff',
          300: '#c3adff',
          400: '#a480fb',
          500: '#8b5cf6',
          600: '#7442e8',
          700: '#6030c9',
          800: '#4c249e',
          900: '#341a6d',
        },
        orange: {
          50: '#fff6ed',
          100: '#ffe9d5',
          200: '#fed0aa',
          300: '#fdb174',
          400: '#fb8f3c',
          500: '#f97316',
          600: '#ea5f0b',
          700: '#c2470c',
          800: '#9a3a12',
          900: '#7c3212',
        },
        green: {
          50: '#f1fdf5',
          100: '#dcf7e6',
          200: '#bbeecd',
          300: '#86ddaa',
          400: '#4ec582',
          500: '#26a862',
          600: '#18884e',
          700: '#146c40',
          800: '#135636',
          900: '#10462e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Armata', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(23, 21, 19, 0.04), 0 10px 28px -20px rgba(23, 21, 19, 0.3)',
        lift: '0 14px 34px -20px rgba(52, 26, 109, 0.45)',
        menu: '0 12px 32px -12px rgba(23, 21, 19, 0.22)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 220ms ease-out',
        popIn: 'popIn 140ms ease-out',
      },
    },
  },
  plugins: [],
};
