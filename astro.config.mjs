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
      excludeLangs: ['math']
    },
    shikiConfig: {
      themes: {
        light: 'github-light-high-contrast',
        dark: 'github-dark-high-contrast'
      },
      defaultColor: false,
      wrap: true
    }
  }
});
