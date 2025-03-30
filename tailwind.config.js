/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(243, 244, 246)',
        text: 'rgb(66, 66, 69)',
        accent: 'rgb(255, 196, 3)',
      },
    },
  },
  plugins: [],
}; 