import type { ReactNode } from 'react';
import type { Locale } from '@/lib/locale';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

export function SiteFrame({ locale, path, children }: { locale: Locale; path: string; children: ReactNode }) {
  return (
    <div className="wrap">
      <SiteHeader locale={locale} path={path} />
      <main>{children}</main>
      <SiteFooter locale={locale} />
    </div>
  );
}
