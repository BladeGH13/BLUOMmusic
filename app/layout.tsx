import "./globals.css"

import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter"
import { CssBaseline } from "@mui/material"
import { AppLayout } from "./app-layout"
import { ThemeStoreProvider } from "@/src/stores/theme-store"
import type { Viewport, Metadata } from "next"
import { GA_MEASUREMENT_ID } from "@/src/gtag"
import { GoogleAnalytics } from "@next/third-parties/google"

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents unintended zoom scaling on mobile inputs
}

export const metadata: Metadata = {
  title: "BLUOMmusic",
  description: "A premium open-source cloud storage streaming engine by BLUOMtech.",
  applicationName: "BLUOMmusic",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BLUOMmusic",
  },
  openGraph: {
    title: "BLUOMmusic Player",
    description: "A premium open-source cloud storage streaming engine by BLUOMtech.",
    type: "website",
    siteName: "BLUOMmusic",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="manifest.json" />
        {/* Apple PWA web app icon support assets tag flags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeStoreProvider>
            <CssBaseline />
            <AppLayout>{children}</AppLayout>
          </ThemeStoreProvider>
        </AppRouterCacheProvider>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  )
}

export const dynamic = "force-static"
