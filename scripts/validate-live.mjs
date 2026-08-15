const origin = new URL(process.argv[2] ?? 'https://blog.sheta.dev');
const canonicalOrigin = 'https://blog.sheta.dev';
const articlePath = '/posts/aws-for-beginners-one-file-upload/';
const markdownPath = '/posts/aws-for-beginners-one-file-upload.md';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, init) {
  return fetch(new URL(path, origin), { redirect: 'manual', ...init });
}

const home = await request('/');
assert(home.status === 200, `home returned ${home.status}`);
assert(home.headers.has('content-security-policy'), 'home is missing Content-Security-Policy');
assert(home.headers.has('strict-transport-security'), 'home is missing Strict-Transport-Security');
assert(home.headers.get('x-frame-options') === 'DENY', 'home is missing X-Frame-Options: DENY');
assert(!home.headers.get('vary')?.toLowerCase().includes('accept'), 'home must not vary on Accept');

const missing = await request(`/missing-${Date.now()}/`);
const missingBody = await missing.text();
assert(missing.status === 404, `missing page returned ${missing.status}`);
assert(missingBody.includes('Page not found'), 'missing page returned an empty or unexpected body');

const refusedMarkdown = await request(articlePath, {
  headers: { Accept: 'text/markdown;q=0, text/html;q=1' }
});
assert(
  refusedMarkdown.headers.get('content-type')?.startsWith('text/html'),
  'q=0 Markdown request did not return HTML'
);

const negotiated = await request(articlePath, {
  headers: { Accept: 'text/markdown, text/html;q=0.5' }
});
assert(
  negotiated.headers.get('content-type') === 'text/markdown; charset=utf-8',
  'negotiated Markdown has the wrong content type'
);
assert(negotiated.headers.get('vary') === 'Accept', 'negotiated Markdown must vary on Accept');
assert(
  negotiated.headers.get('content-signal')?.includes('ai-train=no'),
  'negotiated Markdown must disallow AI training'
);
assert(
  negotiated.headers.get('link')?.includes(`${canonicalOrigin}${articlePath}`),
  'negotiated Markdown is missing its HTML canonical Link header'
);

const head = await request(articlePath, {
  method: 'HEAD',
  headers: { Accept: 'text/markdown' }
});
assert(
  head.headers.get('content-type') === 'text/markdown; charset=utf-8',
  'HEAD negotiation does not match GET negotiation'
);

const explicitMarkdown = await request(markdownPath);
assert(
  explicitMarkdown.headers.get('link')?.includes(`${canonicalOrigin}${articlePath}`),
  'explicit Markdown is missing its HTML canonical Link header'
);

console.log(`Validated deployed routing, security headers, and content negotiation at ${origin.origin}.`);
