import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const satoshi = localFont({
  src: "../public/fonts/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ttArtnik = localFont({
  src: [
    {
      path: "../public/fonts/TTArtnikDemo-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/TTArtnikDemo-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-tt-artnik",
});

export const metadata: Metadata = {
  title: "Xpand — See what every area is missing",
  description:
    "Xpand reads land, demand, momentum and real amenities across Abu Dhabi to show where service gaps are now and where they appear next — then connects investors and operators to the areas that need them.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${geistMono.variable} ${ttArtnik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
