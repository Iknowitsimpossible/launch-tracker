import type { ReactNode } from 'react';
import { DocumentLayout, siteMetadata, siteViewport } from '@/components/DocumentLayout';

export const metadata = siteMetadata('en');
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <DocumentLayout locale="en">{children}</DocumentLayout>;
}
