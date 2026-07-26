/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F7F5",
        ink: "#1F1F1F",
        muted: "#6B6F76",
        subtle: "#9A9A95",
        line: "#E8E8E3",
        brand: "#2F6F5F",
        "brand-soft": "#E4F0EB",
        danger: "#C84B4B",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
