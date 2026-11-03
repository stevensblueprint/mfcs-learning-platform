import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Cherry_Bomb_One,
  Inclusive_Sans,
} from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const headingFont = Cherry_Bomb_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});
const bodyFont = Inclusive_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MFCS | Monmouth Fidelity Chinese School",
    template: "%s | MFCS",
  },
  description:
    "The learning platform for Monmouth Fidelity Chinese School.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
