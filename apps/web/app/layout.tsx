import type { Metadata } from "next";
import { Young_Serif, Familjen_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young-serif",
});
const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-familjen-grotesk",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Cloudify — Cloud storage for the handover",
  description:
    "Cloudify gives every person 2GB of encrypted space on Google Cloud. Organise your work into real folders, then hand any file or folder to a client with one link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${youngSerif.variable} ${familjenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
