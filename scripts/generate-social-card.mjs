import { mkdir, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../src/assets/social-card.svg', import.meta.url);
const output = new URL('../public/social-card.png', import.meta.url);
const svg = await readFile(source);

await sharp(svg)
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(fileURLToPath(output));

const postsRoot = new URL('../src/content/posts/', import.meta.url);
const cardsRoot = new URL('../public/social/', import.meta.url);
await mkdir(cardsRoot, { recursive: true });

function field(frontmatter, name) {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*["']?(.*?)["']?\\s*$`, 'm'));
  return match?.[1] ?? '';
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;'
  })[character]);
}

function titleLines(title, limit = 27) {
  const words = title.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= limit || current === '') {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  if (lines.length <= 3) return lines;
  return [lines[0], lines[1], `${lines.slice(2).join(' ').slice(0, limit - 1)}…`];
}

function articleCard(title, level, tags) {
  const lines = titleLines(title);
  const fontSize = lines.length === 1 ? 66 : lines.length === 2 ? 60 : 52;
  const lineHeight = fontSize + 16;
  const firstY = 280 - ((lines.length - 1) * lineHeight) / 2;
  const titleMarkup = lines.map((line, index) => (
    `<text x="108" y="${firstY + index * lineHeight}" fill="#f3f4f6" font-family="DejaVu Sans Mono, monospace" font-size="${fontSize}" font-weight="700">${escapeXml(line)}</text>`
  )).join('\n');
  const topic = tags.split(',').slice(0, 3).map((tag) => tag.trim()).filter(Boolean).join(' / ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0f172a"/>
    <rect x="64" y="64" width="1072" height="502" rx="16" fill="#111827" stroke="#475569" stroke-width="2"/>
    <path d="M64 174H1136" stroke="#334155" stroke-width="2"/>
    <circle cx="110" cy="119" r="10" fill="#60a5fa"/>
    <circle cx="142" cy="119" r="10" fill="#94a3b8"/>
    <circle cx="174" cy="119" r="10" fill="#475569"/>
    <text x="600" y="129" text-anchor="middle" fill="#cbd5e1" font-family="DejaVu Sans Mono, monospace" font-size="26">blog.sheta.dev</text>
    ${titleMarkup}
    <path d="M108 482H1092" stroke="#475569" stroke-width="2"/>
    <text x="108" y="528" fill="#93c5fd" font-family="DejaVu Sans Mono, monospace" font-size="24">Ahmed Sheta · ${escapeXml(level)}</text>
    <text x="1092" y="528" text-anchor="end" fill="#94a3b8" font-family="DejaVu Sans Mono, monospace" font-size="20">${escapeXml(topic)}</text>
  </svg>`;
}

const postFiles = (await readdir(postsRoot)).filter((name) => name.endsWith('.md'));
for (const name of postFiles) {
  const markdown = await readFile(new URL(name, postsRoot), 'utf8');
  const frontmatter = markdown.match(/^---\s*([\s\S]*?)\s*---/)?.[1] ?? '';
  const title = field(frontmatter, 'title');
  const level = field(frontmatter, 'level') || 'intermediate';
  const tags = field(frontmatter, 'tags').replace(/^\[|\]$/g, '');
  const slug = name.replace(/\.md$/, '');
  const card = Buffer.from(articleCard(title, level, tags));

  await sharp(card)
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`${slug}.png`, cardsRoot)));
}

console.log(`Generated the site card and ${postFiles.length} article cards.`);
