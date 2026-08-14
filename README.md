# blog.sheta.dev

Text-first Astro blog for `https://blog.sheta.dev` with Markdown delivery for software agents.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Build

```bash
npm run build
```

The static site is emitted to `dist/`.

## Accessibility

The colour-theme control supports system, light, dark, and high-contrast modes. Code highlighting ships with separate high-contrast light and dark palettes, so it does not rely on a dark palette in light mode.

The “Read page aloud” control uses the browser's built-in Web Speech API. It prefers a locally installed natural or enhanced English voice when one is available, then falls back to another device voice. Voice availability and quality depend on the reader's browser and operating system. Speech is generated on the reader's device: it does not call the Worker, add a paid text-to-speech service, or consume additional Cloudflare requests beyond serving the page itself.

## Cloudflare Workers

The repository deploys static assets and a small content-negotiation Worker with `wrangler.jsonc`.

```bash
npm run build
npx wrangler deploy
```

The production custom domain is `blog.sheta.dev`. The Worker in `worker/index.js` serves Markdown when a post request includes `Accept: text/markdown`.

## Agent retrieval

Human HTML:

```bash
curl https://blog.sheta.dev/posts/why-this-site-is-plain/
```

Same clean URL as Markdown:

```bash
curl -H "Accept: text/markdown" \
  https://blog.sheta.dev/posts/why-this-site-is-plain/
```

Explicit Markdown:

```bash
curl https://blog.sheta.dev/posts/why-this-site-is-plain.md
```

Corpus indexes:

```bash
curl https://blog.sheta.dev/llms.txt
curl https://blog.sheta.dev/llms-full.txt
```

## Add a post

Create `src/content/posts/my-post.md`:

```md
---
title: "My post"
description: "One-sentence summary."
published: 2026-08-13
tags: [systems]
---

Write Markdown here.
```

The build creates `/posts/my-post/` and `/posts/my-post.md`, then adds the post to `/llms.txt`, `/llms-full.txt`, RSS, and the sitemap.

## Add a Mermaid diagram

Use a fenced `mermaid` block in a post. The browser renders the diagram on the HTML page. The Markdown endpoint retains the diagram source.

````text
```mermaid
flowchart LR
  accTitle: Queue processing flow
  accDescr: A request enters a queue, and a worker processes it.
  request[Request] --> queue[Queue]
  queue --> worker[Worker]
```
````

Use AWS service icons in Mermaid architecture diagrams with the registered Iconify `logos` pack:

````text
```mermaid
architecture-beta
  group aws(cloud)[AWS]

  service api(logos:aws-api-gateway)[API Gateway] in aws
  service queue(logos:aws-sqs)[SQS] in aws
  service worker(logos:aws-lambda)[Lambda] in aws
  service store(logos:aws-dynamodb)[DynamoDB] in aws

  api:R --> L:queue
  queue:R --> L:worker
  worker:R --> L:store
```
````

The browser loads pinned Mermaid and Iconify modules from jsDelivr. Add an `accTitle` and `accDescr` to each diagram that needs an accessible name and description. If Mermaid does not load or cannot render a diagram, the page shows its source block.
