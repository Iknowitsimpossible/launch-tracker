import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import type { Locale } from '@/lib/locale';
import { BASE_PATH, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import '../app/globals.css';

const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'] });
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export function siteMetadata(locale: Locale): Metadata {
  return {
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: locale === 'zh-Hans'
      ? '追踪全球近期和即将进行的火箭发射，查看实时倒计时。'
      : SITE_DESCRIPTION,
    icons: { apple: `${BASE_PATH}/apple-touch-icon.png`, icon: `${BASE_PATH}/favicon.ico` },
    manifest: `${BASE_PATH}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'default' },
  };
}

export const siteViewport: Viewport = { themeColor: '#faf8f3' };

export function DocumentLayout({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
