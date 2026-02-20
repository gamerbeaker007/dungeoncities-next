import { TopNav } from "@/components/top-nav";
import { Container } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "./providers";

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
    template: "%s | Dungeon Cities",
    default: "Dungeon Cities",
  },
  description: "Companion app for the Dungeon Cities blockchain game on Hive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppRouterCacheProvider>
          <AppProviders>
            <Container maxWidth={false} sx={{ py: 1 }}>
              <TopNav />
              {children}
            </Container>
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
