---
title: "Why this site is plain"
description: "A plain blog built for durable ideas, stable URLs, readable text, and copyable code."
published: 2026-08-13
updated: 2026-08-15
tags: [meta, web]
level: beginner
---

I keep this site in plain text with stable URLs and copyable code.

I work within a few constraints. Pages must load fast, and URLs must stay stable. Readers must be able to copy code. Client-side JavaScript must remain optional. Each post must provide Markdown so software agents do not have to scrape presentation markup.

For a person, this URL returns HTML:

```text
https://blog.sheta.dev/posts/why-this-site-is-plain/
```

For an agent, the same URL can return Markdown:

```bash
curl -H "Accept: text/markdown" \
  https://blog.sheta.dev/posts/why-this-site-is-plain/
```

The explicit Markdown form is also available:

```text
https://blog.sheta.dev/posts/why-this-site-is-plain.md
```

I remove site features that make the writing harder to read or retrieve.
