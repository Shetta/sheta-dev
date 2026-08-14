import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../src/assets/social-card.svg', import.meta.url);
const output = new URL('../public/social-card.png', import.meta.url);
const svg = await readFile(source);

await sharp(svg)
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(fileURLToPath(output));

console.log('Generated public/social-card.png (1200x630).');
