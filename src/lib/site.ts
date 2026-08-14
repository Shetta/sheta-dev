export const SITE_NAME = 'blog.sheta.dev';
export const SITE_TITLE = 'Ahmed Sheta';
export const SITE_DESCRIPTION = 'Technical notes by Ahmed Sheta.';

export function siteUrl(site: URL | undefined, pathname = '/') {
  if (!site) {
    throw new Error('Set the Astro site URL before building the blog.');
  }

  return new URL(pathname, site).toString();
}
