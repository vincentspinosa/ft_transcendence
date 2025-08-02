/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Main HTML file
    "./src/*.{ts,js}" // Any TypeScript or JavaScript files where Tailwind classes are used
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}