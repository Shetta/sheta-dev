import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.sheta.dev',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true
    }
  }
});
