// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      colors: {
        glassWhite: "rgba(255, 255, 255, 0.25)",
        glassDark: "rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};
