import { Inter } from "next/font/google";
import AppNavigation from "./components/AppNavigation";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const themeScript = `
  try {
    var stored = localStorage.getItem("autoskolatest-theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

export const metadata = {
  title: "Autoškola testy",
  description: "Procvičování a správa otázek pro autoškolu skupiny B",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="cs"
      className={`${inter.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthProvider>
            <AppNavigation />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
