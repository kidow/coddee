const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
    './templates/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
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
        },
        'fade-in-right': {
          from: {
            opacity: 0,
            transform: 'translateX(-100%)'
          },
          '60%': {
            opacity: 1
          },
          to: {
            transform: 'none'
          }
        },
        'fade-in-bottom': {
          from: {
            opacity: 0,
            transform: 'translateY(-100%)'
          },
          '60%': {
            opacity: 1
          },
          to: {
            transform: 'none'
          }
        },
        'fade-in-left': {
          from: {
            opacity: 0,
            transform: 'translateX(100%)'
          },
          '60%': {
            opacity: 1
          },
          to: {
            transform: 'none'
          }
        },
        'fade-in-top': {
          from: {
            opacity: 0,
            transform: 'translateY(100%)'
          },
          '60%': {
            opacity: 1
          },
          to: {
            transform: 'none'
          }
        },
        'fade-out-right': {
          from: {
            opacity: 1
          },
          '60%': {
            opacity: 0
          },
          to: {
            transform: 'translateX(150%)'
          }
        }
      },
      animation: {
        'fade-up': 'fade-up 0.2s linear',
        'fade-in-right': 'fade-in-right 0.2s linear',
        'fade-in-bottom': 'fade-in-bottom 0.2s linear',
        'fade-in-left': 'fade-in-left 0.2s linear',
        'fade-in-top': 'fade-in-top 0.2s linear',
        'fade-out-right': 'fade-out-right 0.2s linear'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('prettier-plugin-tailwindcss')
  ]
}
