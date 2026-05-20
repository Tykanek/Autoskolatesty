/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f4f7fb",
        foreground: "#172033",
        muted: "#eef3f8",
        "muted-foreground": "#62718a",
        card: "#ffffff",
        "card-foreground": "#172033",
        border: "#d8e2ee",
        input: "#d8e2ee",
        primary: "#2563eb",
        "primary-strong": "#1d4ed8",
        "primary-soft": "#dbeafe",
        accent: "#0f766e",
        "accent-soft": "#ccfbf1",
        warning: "#b45309",
        "warning-soft": "#fef3c7",
        destructive: "#b91c1c",
        "destructive-soft": "#fee2e2",
      },
      borderRadius: {
        lg: "0.5rem",
      },
    },
  },
  plugins: [],
};
