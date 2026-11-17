import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentLayout, siteMetadata, siteViewport } from '@/components/DocumentLayout';
import { SiteFrame } from '@/components/SiteFrame';
import { SITE_NAME } from '@/lib/site';
import styles from './global-not-found.module.css';

/*
 * The 404 page (out/404.html, which GitHub Pages serves for any missing address).
 *
 * The usual cause is an old shared link: launch pages are kept for 30 days after
 * liftoff, and an upcoming launch's address changes when its name is announced.
 * So the page says why, and points both languages back home.
 *
 * It's a "global" not-found because the site has two root layouts (English and
 * Chinese), so there's no single layout a normal not-found.tsx could sit inside.
 * The address alone doesn't tell us the visitor's language, so it shows both.
 */

export const metadata: Metadata = {
  ...siteMetadata('en'),
  title: `Page not found · ${SITE_NAME}`,
  alternates: null,
};
export const viewport = siteViewport;

export default function GlobalNotFound() {
  return (
    <DocumentLayout locale="en">
      <SiteFrame locale="en" path="/">
        <section className={styles.notFound}>
          <h1>This page isn’t here</h1>
          <p>
            Launch pages are kept for 30 days after liftoff, so older links stop working. An
            upcoming launch’s address can also change when its mission name is announced.
          </p>
          <p lang="zh-Hans">
            找不到此页面。发射页面在发射后保留 30 天，较早的链接会失效；即将进行的发射在公布任务名称后，网址也可能改变。
          </p>
          <p className={styles.links}>
            <Link href="/">See all launches</Link>
            <Link href="/zh/" lang="zh-Hans" hrefLang="zh-Hans">查看所有发射</Link>
          </p>
        </section>
      </SiteFrame>
    </DocumentLayout>
  );
}
