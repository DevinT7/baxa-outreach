/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        baxa: {
          orange: '#BF5700',
          'orange-light': '#F26522',
          dark: '#0f0f1a',
          'dark-2': '#16162a',
          'dark-3': '#1e1e35',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        'modal': '0 24px 64px -12px rgb(0 0 0 / 0.22)',
        'btn': '0 1px 2px 0 rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
