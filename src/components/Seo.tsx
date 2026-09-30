import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageMetadata, SITE_URL } from '@/config/site';

export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = getPageMetadata(pathname);
    document.title = page.title;
    const set = (selector: string, value: string) => {
      let tag = document.querySelector(selector);
      if (!tag && selector === 'meta[property="og:url"]') {
        tag = document.createElement('meta');
        tag.setAttribute('property', 'og:url');
        document.head.appendChild(tag);
      }
      tag?.setAttribute('content', value);
    };
    set('meta[name="description"]', page.description);
    set('meta[name="robots"]', page.index ? 'index, follow' : 'noindex, follow');
    set('meta[property="og:title"]', page.title);
    set('meta[property="og:description"]', page.description);
    set('meta[property="og:url"]', SITE_URL + page.path);
    set('meta[name="twitter:title"]', page.title);
    set('meta[name="twitter:description"]', page.description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', SITE_URL + page.path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}
