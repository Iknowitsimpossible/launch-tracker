import type { ReactNode } from 'react';
import { DocumentLayout, siteMetadata, siteViewport } from '@/components/DocumentLayout';

export const metadata = siteMetadata('zh-Hans');
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <DocumentLayout locale="zh-Hans">{children}</DocumentLayout>;
}
