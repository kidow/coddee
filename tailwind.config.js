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
        primary: colors.orange['500']
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('prettier-plugin-tailwindcss')
  ]
}
