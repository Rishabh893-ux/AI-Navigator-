import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI Navigator — Your AI Learning Hub",
  description:
    "A free, structured AI learning hub for students: roadmap, topic explainers, progress tracker and a Gemini-powered AI mentor.",
};

// Applies the saved (or system) theme before the page paints, so dark mode doesn't flash white.
const themeScript = `try{var t=localStorage.getItem('ain_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
