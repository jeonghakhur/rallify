import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import AuthContext from '@/context/AuthContext';
import ThemeContext from '@/context/ThemeContext';
import SWRConfigContext from '@/context/SWRConfigContext';
import clsx from 'clsx';
import NavBar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TabBar from '@/components/TabBar';
import { DialogProvider } from '@/hooks/useDialog';

const notoSans = Noto_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'rallify-tennis',
  description: 'rallify-tennis에 오신것을 환영합니다.',
  icons: {
    icon: '/icons/favicon-32x32.png', // 기본 파비콘
    shortcut: '/icons/favicon.ico', // 브라우저 기본 favicon
    apple: '/icons/apple-touch-icon.png', // iOS 홈 화면 아이콘
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={clsx(notoSans.className)}>
        <ThemeContext>
          <AuthContext>
            <SWRConfigContext>
              <DialogProvider>
                <NavBar />
                <main className="pb-20">{children}</main>
                <Footer />
                <TabBar />
                <Toaster />
              </DialogProvider>
            </SWRConfigContext>
          </AuthContext>
        </ThemeContext>
      </body>
    </html>
  );
}
