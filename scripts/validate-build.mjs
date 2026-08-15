import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const canonicalHost = 'https://blog.sheta.dev';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(pathname) {
  return readFile(new URL(pathname, dist), 'utf8');
}

const files = {
  home: await read('index.html'),
  about: await read('about/index.html'),
  posts: await read('posts/index.html'),
  rss: await read('rss.xml'),
  sitemap: await read('sitemap.xml'),
  robots: await read('robots.txt'),
  llms: await read('llms.txt'),
  corpus: await read('llms-full.txt'),
  notFound: await read('404.html')
};
const htmlDocuments = [
  ['home', files.home],
  ['about', files.about],
  ['posts', files.posts],
  ['404', files.notFound]
];

for (const [name, body] of Object.entries(files)) {
  assert(!body.includes('https://sheta.dev'), `${name} contains the inactive apex host`);
}

assert(files.home.includes('>blog.sheta.dev</a>'), 'masthead does not identify the blog host');
assert(files.home.includes(`rel="canonical" href="${canonicalHost}/"`), 'home canonical is missing');
assert(files.home.includes('Software systems, data infrastructure, and reliability | Ahmed Sheta'), 'home title is not descriptive');
assert(files.home.includes('/posts/aws-for-beginners-one-file-upload/'), 'home does not link to the beginner guide');
assert(files.about.includes(`rel="canonical" href="${canonicalHost}/about/"`), 'about canonical is wrong');
assert(files.about.includes('"@type":"Person"'), 'about Person JSON-LD is missing');
assert(files.posts.includes(`rel="canonical" href="${canonicalHost}/posts/"`), 'posts canonical is wrong');
assert(files.notFound.includes('name="robots" content="noindex"'), '404 page must be noindex');

assert(files.rss.includes('<rss version="2.0"'), 'RSS root is missing');
assert(files.rss.includes(`atom:link href="${canonicalHost}/rss.xml"`), 'RSS self link is wrong');
assert(files.rss.includes(`<link>${canonicalHost}/</link>`), 'RSS home link is wrong');

const sitemapUrls = [...files.sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert(sitemapUrls.length >= 4, 'sitemap does not contain the expected pages');
assert(sitemapUrls.every((url) => url.startsWith(`${canonicalHost}/`)), 'sitemap contains another host');
assert(sitemapUrls.every((url) => !url.endsWith('.md')), 'sitemap contains Markdown alternates');
assert(files.robots.includes(`Sitemap: ${canonicalHost}/sitemap.xml`), 'robots.txt points to the wrong sitemap');

const postRoot = new URL('posts/', dist);
const postDirectories = (await readdir(postRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const slug of postDirectories) {
  const html = await read(join('posts', slug, 'index.html'));
  const canonical = `${canonicalHost}/posts/${slug}/`;
  htmlDocuments.push([slug, html]);
  assert(html.includes(`rel="canonical" href="${canonical}"`), `${slug} canonical is wrong`);
  assert(html.includes('<meta property="og:type" content="article">'), `${slug} article Open Graph type is missing`);
  assert(html.includes('property="article:published_time"'), `${slug} published metadata is missing`);
  assert(html.includes(`property="og:image" content="${canonicalHost}/social-card.png"`), `${slug} Open Graph image is missing`);
  assert(html.includes('property="og:image:width" content="1200"'), `${slug} Open Graph image dimensions are missing`);
  assert(html.includes('name="twitter:card" content="summary_large_image"'), `${slug} Twitter metadata is missing`);
  assert(html.includes(`name="twitter:image" content="${canonicalHost}/social-card.png"`), `${slug} Twitter image is missing`);
  assert(html.includes('"@type":"BlogPosting"'), `${slug} BlogPosting JSON-LD is missing`);
  assert(html.includes('rel="alternate" type="text/markdown"'), `${slug} Markdown alternate is missing`);
  assert(html.includes('By <a href="/about/">Ahmed Sheta</a>'), `${slug} visible author link is missing`);
  assert(html.includes('What should I explain next?'), `${slug} feedback prompt is missing`);
  assert(html.includes('discussions/new?category=ideas'), `${slug} topic suggestion link is missing`);
  assert(files.rss.includes(`<link>${canonical}</link>`), `${slug} is missing from RSS`);
  assert(files.sitemap.includes(`<loc>${canonical}</loc>`), `${slug} is missing from the sitemap`);
}

const architecturePost = await read('posts/the-replay-that-outgrew-the-cross-account-relay.md');
const beginnerPost = await read('posts/aws-for-beginners-one-file-upload.md');
assert(beginnerPost.includes('level: beginner'), 'beginner post level is missing from Markdown');
assert(beginnerPost.includes('nextPost: the-replay-that-outgrew-the-cross-account-relay'), 'beginner post next link is missing');
assert(beginnerPost.includes('architecture-beta'), 'beginner post does not use the architecture diagram format');
assert(beginnerPost.includes('logos:aws-iam'), 'beginner post is missing the AWS IAM icon');
assert(beginnerPost.includes('logos:aws-s3'), 'beginner post is missing the Amazon S3 icon');
assert(architecturePost.includes('prerequisites: ["aws-for-beginners-one-file-upload"]'), 'architecture prerequisite is missing');
for (const icon of ['aws-kinesis', 'apache-spark', 'aws-dynamodb', 'aws-s3', 'aws-glue']) {
  assert(architecturePost.includes(`logos:${icon}`), `architecture post is missing the ${icon} icon`);
}
assert(architecturePost.includes('[Kinesis source stream]'), 'Kinesis icon is missing its text label');
assert(architecturePost.includes('[EMR Spark]'), 'EMR Spark icon is missing its text label');

for (const [page, html] of htmlDocuments) {
  const localLinks = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)]
    .map((match) => match[1]);

  for (const pathname of localLinks) {
    const target = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    await access(new URL(target.replace(/^\//, ''), dist)).catch(() => {
      throw new Error(`${page} links to missing asset ${pathname}`);
    });
  }
}

console.log(`Validated ${postDirectories.length} post, local links, RSS, sitemap, robots.txt, canonicals, and 404 output.`);
