---
title: "Why this site is plain"
description: "A plain blog built for durable ideas, stable URLs, readable text, and copyable code."
published: 2026-08-13
tags: [meta, web]
---

This site preserves technical ideas in plain text, stable URLs, and copyable code.

I work within a few constraints:

- pages must load fast;
- URLs must stay stable;
- readers must be able to copy code;
- client-side JavaScript must remain optional;
- each post must have a Markdown representation;
- software agents must receive the writing without scraping presentation markup.

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

I judge the site by whether the writing stays useful.
