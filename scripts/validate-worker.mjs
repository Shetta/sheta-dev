import worker from '../worker/index.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const assetRequests = [];
const env = {
  ASSETS: {
    fetch(request) {
      assetRequests.push(new URL(request.url).pathname);
      return Promise.resolve(new Response('asset', {
        headers: { 'Content-Type': 'application/octet-stream' }
      }));
    }
  }
};

const markdownResponse = await worker.fetch(new Request(
  'https://blog.sheta.dev/posts/why-this-site-is-plain/',
  { headers: { Accept: 'text/markdown' } }
), env);

assert(
  assetRequests[0] === '/posts/why-this-site-is-plain.md',
  'trailing-slash content negotiation requested the wrong Markdown asset'
);
assert(
  markdownResponse.headers.get('Content-Type') === 'text/markdown; charset=utf-8',
  'negotiated Markdown has the wrong content type'
);
assert(markdownResponse.headers.get('Vary') === 'Accept', 'negotiated Markdown must vary on Accept');

await worker.fetch(new Request(
  'https://blog.sheta.dev/posts/why-this-site-is-plain',
  { headers: { Accept: 'text/markdown' } }
), env);
assert(
  assetRequests[1] === '/posts/why-this-site-is-plain.md',
  'clean content negotiation requested the wrong Markdown asset'
);

const htmlResponse = await worker.fetch(new Request(
  'https://blog.sheta.dev/posts/why-this-site-is-plain/'
), env);
assert(
  assetRequests[2] === '/posts/why-this-site-is-plain/',
  'HTML request did not retain its path'
);
assert(htmlResponse.headers.get('Vary') === 'Accept', 'HTML response must vary on Accept');

console.log('Validated clean and trailing-slash content negotiation.');
