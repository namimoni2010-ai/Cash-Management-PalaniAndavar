/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
            fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Sora', '"DM Sans"', 'system-ui', 'sans-serif'],
        brand: ['Unbounded', 'Sora', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#14203d',
        canvas: '#eef2fb',
        navy: { 950: '#0a1330', 900: '#0f1b3d', 800: '#172757' },
        gpay: { DEFAULT: '#2563eb', soft: '#e6eeff', dark: '#1d4ed8' },
        cash: { DEFAULT: '#f08a0c', soft: '#fff3df', dark: '#b45f00' },
        gain: { DEFAULT: '#16a34a', soft: '#e1f6e8' },
        loss: { DEFAULT: '#dc2f2f', soft: '#fdeaea' },
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        slideInLeft: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        pop: { from: { opacity: 0, transform: 'translateY(10px) scale(.97)' }, to: { opacity: 1, transform: 'none' } },
        toastIn: { from: { opacity: 0, transform: 'translateY(-10px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        fadeIn: 'fadeIn .2s ease-out',
        slideIn: 'slideIn .3s cubic-bezier(.2,.8,.2,1)',
        slideInLeft: 'slideInLeft .26s cubic-bezier(.2,.8,.2,1)',
        pop: 'pop .24s ease-out',
        toastIn: 'toastIn .25s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};