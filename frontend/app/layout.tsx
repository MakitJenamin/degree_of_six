import type { Metadata } from "next";
import { Inter, Playfair_Display, Dancing_Script } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Six Degrees of Separation",
  description: "Tìm khoảng cách liên kết ngắn nhất trên Wikipedia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${dancing.variable} antialiased bg-[#FAF9F6] dark:bg-stone-950 text-stone-800 dark:text-stone-100`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
