/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      colors: {
        baxa: {
          orange:  '#BF5700',
          'orange-light': '#F26522',
          cream:   '#f5f3ef',
          'cream-2': '#edeae4',
          ink:     '#1a1814',
        },
      },
      boxShadow: {
        'card':       '0 1px 4px 0 rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 20px 0 rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.04)',
        'modal':      '0 24px 64px -12px rgb(0 0 0 / 0.18)',
        'btn':        '0 1px 2px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
