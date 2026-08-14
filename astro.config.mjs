import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.sheta.dev',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory'
  },
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math']
    },
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true
    }
  }
});
