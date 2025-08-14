/** @type {import('tailwindcss').Config} */
// Line above -> provides autocompletion and type-checking for the Tailwind CSS configuration object.

// Tailwind Configuration object
module.exports = {
  // 'content' -> where Tailwind is used
  content: [
    "./index.html",
    "./src/**/*.{ts,js}"
  ],
  // 'theme' -> Tailwind Customization
  theme: {
    extend: {}, // No custom CSS.
  },
  plugins: [], // No plugins.
};