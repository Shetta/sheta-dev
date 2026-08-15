# blog.sheta.dev

This repository contains the Astro source for `https://blog.sheta.dev`. The site serves HTML to readers and Markdown to software agents.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

The development command generates the architecture diagrams and social cards before Astro starts.

## Build and validation

```bash
npm run validate
```

The validation command checks Astro types, builds the site, checks local links and metadata, and tests the content-negotiation Worker.

Two additional checks use the network:

```bash
npm run check:links
npm run validate:live
```

The first command checks external article citations. The second command checks the deployed 404 page, security headers, Markdown negotiation, and canonical headers. GitHub Actions runs these network checks each week.

## Accessibility

The colour-theme control supports system, light, dark, and high-contrast modes. Code highlighting includes separate light and dark palettes.

The “Read page aloud” control uses the browser's Web Speech API. The reader can select an English voice that the browser or operating system provides. The site does not send article text to a text-to-speech service.

Architecture diagrams are static SVG images. Each article supplies alternative text and a visible caption. Image dimensions reserve layout space before the browser loads the file.

## Cloudflare Workers

The repository deploys static assets and a small content-negotiation Worker. The configuration is in `wrangler.jsonc`.

```bash
npm run build
npx wrangler deploy
```

The Worker serves the custom 404 page when a static asset does not exist. It also adds security and indexing headers from `public/_headers`.

## Agent retrieval

Human HTML:

```bash
curl https://blog.sheta.dev/posts/why-this-site-is-plain/
```

Markdown from the same URL:

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

Markdown responses identify the HTML page with an HTTP canonical `Link` header. The content signal permits search and reference use. It does not permit AI training.

## Add a post

Create `src/content/posts/my-post.md`:

```md
---
title: "My post"
description: "One-sentence summary."
published: 2026-08-13
tags: [systems]
level: intermediate
series: "Systems notes"
prerequisites: [an-earlier-post]
nextPost: the-next-post
---

Write Markdown here.
```

Use post slugs without `/posts/` in `prerequisites` and `nextPost`. The build checks those links and adds the post to RSS, the sitemap, and the agent indexes.

The asset build creates a 1200 by 630 social card for each post. Set `image` and `imageAlt` in the frontmatter only when a post needs another preview image.

## Add an AWS architecture diagram

Use the current official [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/). Do not load an icon library or diagram renderer in the reader's browser.

Copy only the required SVG icons to `src/assets/aws-architecture-icons/<release-date>/`. Record the package release in `src/assets/aws-architecture-icons/README.md`.

Add the diagram layout to `scripts/generate-diagrams.mjs`. The output must include a `<title>`, a `<desc>`, visible service labels, and a white background. The article must use a `<figure>` with fixed image dimensions, alternative text, and a caption.

Generate and inspect the files:

```bash
npm run diagrams
```

AWS publishes icon packages during the first three quarters of each year. Review the stored icons after each release.

## Publishing policy and reader feedback

The public policy page records scenario labels, content-use preferences, privacy details, and correction practices.

Each post links to the repository's Ideas discussion category and content-correction issue form. Both actions require GitHub sign-in. Keep Discussions enabled and keep the `ideas` category slug unchanged.
