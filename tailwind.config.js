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
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('prettier-plugin-tailwindcss')
  ]
}
