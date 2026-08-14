const MARKDOWN_ACCEPT = [
  'text/markdown',
  'application/x-markdown',
  'text/plain'
];

function wantsMarkdown(request) {
  const accept = request.headers.get('Accept') || '';
  return MARKDOWN_ACCEPT.some((type) => accept.includes(type));
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

function withAgentHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', 'Accept');
  headers.set('Content-Signal', 'ai-train=yes, search=yes, ai-input=yes');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && wantsMarkdown(request) && isCleanPostPath(url.pathname)) {
      const markdownUrl = new URL(request.url);
      markdownUrl.pathname = markdownPath(url.pathname);
      const markdownRequest = new Request(markdownUrl, request);
      const response = await env.ASSETS.fetch(markdownRequest);

      if (response.ok) return withAgentHeaders(response);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.append('Vary', 'Accept');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
