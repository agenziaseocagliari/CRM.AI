/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        sidebar: '#1f2937', // gray-800
        'sidebar-hover': '#374151', // gray-700
        background: '#f3f4f6', // gray-100
        card: '#ffffff', // white
        'text-primary': '#111827', // gray-900
        'text-secondary': '#4b5563', // gray-600
      }
    },
  },
  plugins: [],
}