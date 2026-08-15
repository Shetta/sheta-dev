import worker from '../worker/index.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const assetRequests = [];
const env = {
  ASSETS: {
    fetch(request) {
      assetRequests.push({
        method: request.method,
        pathname: new URL(request.url).pathname
      });
      const body = request.method === 'HEAD' ? null : 'asset';
      return Promise.resolve(new Response(body, {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
    }
  }
};

const canonical = 'https://blog.sheta.dev/posts/why-this-site-is-plain/';
const markdownResponse = await worker.fetch(new Request(
  canonical,
  { headers: { Accept: 'text/markdown' } }
), env);

assert(
  assetRequests[0].pathname === '/posts/why-this-site-is-plain.md',
  'trailing-slash content negotiation requested the wrong Markdown asset'
);
assert(
  markdownResponse.headers.get('Content-Type') === 'text/markdown; charset=utf-8',
  'negotiated Markdown has the wrong content type'
);
assert(markdownResponse.headers.get('Vary') === 'Accept', 'negotiated Markdown must vary on Accept');
assert(
  markdownResponse.headers.get('Content-Signal')?.includes('ai-train=no'),
  'negotiated Markdown must disallow AI training'
);
assert(
  markdownResponse.headers.get('Link') === `<${canonical}>; rel="canonical"`,
  'negotiated Markdown has the wrong canonical Link header'
);

const refusedMarkdown = await worker.fetch(new Request(
  canonical,
  { headers: { Accept: 'text/markdown;q=0, text/html;q=1' } }
), env);
assert(
  assetRequests[1].pathname === '/posts/why-this-site-is-plain/',
  'q=0 Markdown request must retain the HTML path'
);
assert(
  refusedMarkdown.headers.get('Content-Type') === 'application/octet-stream',
  'q=0 Markdown request returned Markdown'
);

await worker.fetch(new Request(
  canonical,
  { headers: { Accept: 'text/html, text/markdown' } }
), env);
assert(
  assetRequests[2].pathname === '/posts/why-this-site-is-plain/',
  'equal-quality request did not respect the first explicit media type'
);

const headResponse = await worker.fetch(new Request(
  canonical,
  { method: 'HEAD', headers: { Accept: 'text/markdown' } }
), env);
assert(assetRequests[3].method === 'HEAD', 'HEAD negotiation changed the request method');
assert(
  assetRequests[3].pathname === '/posts/why-this-site-is-plain.md',
  'HEAD negotiation requested the wrong Markdown asset'
);
assert(
  headResponse.headers.get('Content-Type') === 'text/markdown; charset=utf-8',
  'HEAD and GET selected different representations'
);

const explicitMarkdown = await worker.fetch(new Request(
  'https://blog.sheta.dev/posts/why-this-site-is-plain.md'
), env);
assert(
  explicitMarkdown.headers.get('Link') === `<${canonical}>; rel="canonical"`,
  'explicit Markdown has the wrong canonical Link header'
);
assert(!explicitMarkdown.headers.has('Vary'), 'explicit Markdown must not vary on Accept');

const homeResponse = await worker.fetch(new Request('https://blog.sheta.dev/'), env);
assert(!homeResponse.headers.has('Vary'), 'home must not vary on Accept');

console.log('Validated GET and HEAD negotiation, quality weights, canonical headers, and scoped Vary headers.');
