const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue['500']
      },
      fontSize: {
        '2xs': '0.625rem'
      },
      keyframes: {
        'fade-up': {
          from: {
            opacity: 0,
            transform: 'translate3d(0, -16px, 0)'
          },
          '60%': {
            opacity: 1
          },
          to: {
            transform: 'none'
          }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.2s linear'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('prettier-plugin-tailwindcss')
  ]
}
