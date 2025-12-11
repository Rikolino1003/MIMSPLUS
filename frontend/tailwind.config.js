/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#00bcbc",
          600: "#00a3a3",
        },
        accent: {
          500: "#3eb8ff",
          600: "#2f95d9",
        },
      },
      boxShadow: {
        'soft-lg': '0 10px 30px rgba(2,6,23,0.08)',
      },
      borderRadius: {
        'xl': '1rem',
      },
    },
  },
  plugins: [],
}

