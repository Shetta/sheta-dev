import { readFile, readdir } from 'node:fs/promises';

const postsRoot = new URL('../src/content/posts/', import.meta.url);
const postFiles = (await readdir(postsRoot)).filter((name) => name.endsWith('.md'));
const links = new Set();

for (const name of postFiles) {
  const markdown = await readFile(new URL(name, postsRoot), 'utf8');
  for (const match of markdown.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)) {
    links.add(match[1]);
  }
}

async function check(url) {
  let lastResult = 'request failed';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'blog.sheta.dev-link-check/1.0' },
        signal: AbortSignal.timeout(20_000)
      });
      await response.body?.cancel();

      if (response.status >= 200 && response.status < 400) return;
      lastResult = `HTTP ${response.status}`;
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastResult = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`${url}: ${lastResult}`);
}

const failures = [];
const queue = [...links];
const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
  while (queue.length > 0) {
    const url = queue.shift();
    if (!url) return;
    try {
      await check(url);
      console.log(`OK ${url}`);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
});

await Promise.all(workers);

if (failures.length > 0) {
  throw new Error(`External link check failed:\n${failures.join('\n')}`);
}

console.log(`Validated ${links.size} external article links.`);
