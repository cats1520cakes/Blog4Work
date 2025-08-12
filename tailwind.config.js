// tailwind.config.js
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"   // << 加上这行最稳
  ],
  darkMode: "media",
  theme: { extend: { /* ... */ } },
  plugins: [require("@tailwindcss/typography")],
};
