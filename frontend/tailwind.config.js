/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js,jsx,ts,tsx}", // Điều chỉnh nếu cần
  ],
  theme: {
    extend: {
      colors: {
        "rabbit-red": "#ea2e0e",
      },
    },
  },
  plugins: [],
};
