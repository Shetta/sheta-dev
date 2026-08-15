const MARKDOWN_ACCEPT = [
  'text/markdown',
  'application/x-markdown'
];
const CANONICAL_ORIGIN = 'https://blog.sheta.dev';

function parseAccept(value) {
  return value.split(',').map((entry, index) => {
    const [mediaRange, ...parameters] = entry.trim().toLowerCase().split(';');
    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const parsedQuality = qualityParameter
      ? Number.parseFloat(qualityParameter.split('=', 2)[1])
      : 1;
    const quality = Number.isFinite(parsedQuality) && parsedQuality >= 0 && parsedQuality <= 1
      ? parsedQuality
      : 0;

    return { mediaRange, quality, index };
  }).filter(({ mediaRange }) => mediaRange.includes('/'));
}

function qualityFor(entries, mediaType) {
  const [type, subtype] = mediaType.split('/');
  const matches = entries.map((entry) => {
    const [entryType, entrySubtype] = entry.mediaRange.split('/');
    if (entryType === type && entrySubtype === subtype) return { ...entry, specificity: 2 };
    if (entryType === type && entrySubtype === '*') return { ...entry, specificity: 1 };
    if (entryType === '*' && entrySubtype === '*') return { ...entry, specificity: 0 };
    return undefined;
  }).filter(Boolean);

  if (matches.length === 0) return 0;
  const highestSpecificity = Math.max(...matches.map(({ specificity }) => specificity));
  return Math.max(...matches
    .filter(({ specificity }) => specificity === highestSpecificity)
    .map(({ quality }) => quality));
}

function wantsMarkdown(request) {
  const entries = parseAccept(request.headers.get('Accept') || '');
  const markdownEntries = entries
    .filter(({ mediaRange }) => MARKDOWN_ACCEPT.includes(mediaRange))
    .sort((left, right) => right.quality - left.quality || left.index - right.index);
  const preferredMarkdown = markdownEntries[0];

  if (!preferredMarkdown || preferredMarkdown.quality === 0) return false;

  const htmlQuality = qualityFor(entries, 'text/html');
  const explicitHtml = entries.find(({ mediaRange }) => mediaRange === 'text/html');
  if (htmlQuality > preferredMarkdown.quality) return false;
  if (
    htmlQuality === preferredMarkdown.quality
    && explicitHtml
    && explicitHtml.index < preferredMarkdown.index
  ) return false;

  return true;
}

function isCleanPostPath(pathname) {
  if (!pathname.startsWith('/posts/')) return false;
  if (pathname === '/posts/' || pathname === '/posts') return false;
  if (pathname.endsWith('.md')) return false;
  if (pathname.includes('.')) return false;
  return true;
}

function markdownPath(pathname) {
  const cleanPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return `${cleanPath}.md`;
}

function isMarkdownPostPath(pathname) {
  return pathname.startsWith('/posts/') && pathname.endsWith('.md');
}

function canonicalPostUrl(pathname) {
  const canonical = new URL(CANONICAL_ORIGIN);
  canonical.pathname = pathname.replace(/\.md$/, '').replace(/\/$/, '') + '/';
  canonical.search = '';
  canonical.hash = '';
  return canonical.toString();
}

function withMarkdownHeaders(response, canonicalUrl) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Content-Signal', 'search=yes, ai-train=no, ai-input=yes, use=reference');
  headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const canNegotiate = request.method === 'GET' || request.method === 'HEAD';

    if (canNegotiate && wantsMarkdown(request) && isCleanPostPath(url.pathname)) {
      const markdownUrl = new URL(request.url);
      markdownUrl.pathname = markdownPath(url.pathname);
      const markdownRequest = new Request(markdownUrl, request);
      const response = await env.ASSETS.fetch(markdownRequest);

      if (response.ok) {
        const markdownResponse = withMarkdownHeaders(
          response,
          canonicalPostUrl(markdownUrl.pathname)
        );
        const headers = new Headers(markdownResponse.headers);
        headers.set('Vary', 'Accept');
        return new Response(markdownResponse.body, {
          status: markdownResponse.status,
          statusText: markdownResponse.statusText,
          headers
        });
      }
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    if (isCleanPostPath(url.pathname)) headers.set('Vary', 'Accept');
    if (response.ok && isMarkdownPostPath(url.pathname)) {
      headers.set('Content-Type', 'text/markdown; charset=utf-8');
      headers.set('Content-Signal', 'search=yes, ai-train=no, ai-input=yes, use=reference');
      headers.set('Link', `<${canonicalPostUrl(url.pathname)}>; rel="canonical"`);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
