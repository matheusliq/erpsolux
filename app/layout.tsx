import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP SOLUX",
  description: "ERP Premium da Solux Pinturas",
};

import { Providers } from "@/app/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased print:block print:h-auto print:overflow-visible`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}