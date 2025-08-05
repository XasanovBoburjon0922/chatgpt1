/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        amountBg: "url('amountBg.svg')",
        mainBg: "url('mainBg.svg')",
      },
      fontFamily: {
        primary: ["Manrope", "sans-serif"],
        secondary: ["Lobster", "cursive"],
      },
      borderRadius: {
        6: "6px",
        12: "12px",
        24: "24px",
        100: "100%",
      },
      container: {
        padding: "0px 15px",
        center: true,
        screens: {
          sm: "680px",
          md: "808px",
          lg: "1064px",
          xl: "1242px",
        },
      },
      colors: {
        primary: "#00235A",
        accent: "#FAFAFA",
        secondary: "#E0E0E0",
        spacial_red: "#ff4756",
      },
    },
  },
  plugins: [],
};
