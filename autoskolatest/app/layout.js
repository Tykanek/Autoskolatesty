import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Autoškola testy",
  description: "Procvičování a správa otázek pro autoškolu skupiny B",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs" className={`${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}