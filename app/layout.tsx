import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import '@radix-ui/themes/styles.css';
import AuthContext from '@/context/AuthContext';
import SWRConfigContext from '@/context/SWRConfigContext';
import clsx from 'clsx';
import ConditionalNavBar from '@/components/ConditionalNavBar';

const notoSans = Noto_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'React Tennis Club',
  description: '리액트 테니스 클럽에 오신것을 환영합니다.',
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
    <html lang="ko">
      <body className={clsx(notoSans.className)}>
        <Theme
          accentColor="crimson"
          grayColor="olive"
          radius="large"
          scaling="100%"
        >
          <AuthContext>
            <SWRConfigContext>
              <ConditionalNavBar />
              {/* Studio 페이지에서 NavBar 제외 */}
              {children}
              {/* <ThemePanel /> */}
              <Toaster />
            </SWRConfigContext>
          </AuthContext>
        </Theme>
      </body>
    </html>
  );
}
