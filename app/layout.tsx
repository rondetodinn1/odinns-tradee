import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "ODINNS Trading Platform",
  description: "Профессиональная торговая платформа для криптовалют",
  keywords: ["trading", "crypto", "bitcoin", "ethereum", "blockchain"],
  authors: [{ name: "ODINNS Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "ODINNS Trading Platform",
    description: "Профессиональная торговая платформа для криптовалют",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "ODINNS Trading Platform",
    description: "Профессиональная торговая платформа для криптовалют",
  },
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />

        {/* Preload критически важные ресурсы */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* DNS prefetch для внешних ресурсов */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//api.coingecko.com" />

        {/* Инициализация обработчика chunk ошибок */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Инициализация обработчика ошибок chunks
              window.addEventListener('error', function(event) {
                if (event.error && (
                  event.error.message?.includes('ChunkLoadError') ||
                  event.error.message?.includes('Loading chunk') ||
                  event.error.name === 'ChunkLoadError'
                )) {
                  console.warn('Chunk load error detected, reloading...');
                  setTimeout(() => window.location.reload(), 1000);
                }
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (
                  event.reason.message?.includes('ChunkLoadError') ||
                  event.reason.message?.includes('Loading chunk') ||
                  event.reason.name === 'ChunkLoadError'
                )) {
                  console.warn('Chunk load promise rejection, reloading...');
                  event.preventDefault();
                  setTimeout(() => window.location.reload(), 1000);
                }
              });
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Providers>
              <div className="relative flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
            </Providers>
          </ThemeProvider>
        </ErrorBoundary>

        {/* Скрипт для мониторинга производительности */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Мониторинг производительности
              if ('performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData && perfData.loadEventEnd > 0) {
                      console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
