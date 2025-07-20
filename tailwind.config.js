/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Your main HTML file
    "./src/*.{ts,js}" // Any TypeScript or JavaScript files where you use Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}