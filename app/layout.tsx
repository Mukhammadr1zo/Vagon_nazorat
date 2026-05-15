import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Vagon Nazorat — Temir yo\'l logistika analitikasi',
  description: 'Mahalliy eksport vagonlari nazorati va data analiz tizimi',
  keywords: ['vagon', 'temir yo\'l', 'logistika', 'analytics', 'dashboard'],
  generator: 'Next.js',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${outfit.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  );
}
