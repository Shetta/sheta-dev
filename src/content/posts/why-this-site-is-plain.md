---
title: "Why this site is plain"
description: "A blog should optimize for ideas, URLs, text, and code—not decoration."
published: 2026-08-13
tags: [meta, web]
---

The point of this site is not to demonstrate a frontend framework. It is to preserve ideas in a form that remains useful.

That means a few constraints:

- text should load quickly;
- URLs should be stable and unsurprising;
- code should be copyable;
- JavaScript should be optional rather than structural;
- every post should have a Markdown representation;
- software agents should be able to retrieve the same writing without scraping presentation markup.

For a person, this URL returns HTML:

```text
https://sheta.dev/posts/why-this-site-is-plain
```

For an agent, the same URL can return Markdown:

```bash
curl -H "Accept: text/markdown" \
  https://sheta.dev/posts/why-this-site-is-plain
```

The explicit Markdown form is also available:

```text
https://sheta.dev/posts/why-this-site-is-plain.md
```

If the writing is useful, the site has done its job.
