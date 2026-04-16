# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **pre-built static Hexo blog** (GitHub Pages deployment branch). It contains only the generated HTML/CSS/JS output — no source Markdown, no `package.json`, no build tooling.

### Running the site locally

Serve the site with any static file server from the repo root:

```bash
python3 -m http.server 8080 --directory /workspace
```

Then open `http://localhost:8080` in Chrome.

### Key caveats

- **No build step or linter**: There is no `package.json`, `Makefile`, or build system. The site is pre-rendered static HTML.
- **CDN dependencies**: The site loads Font Awesome, Animate.css, Fancybox, and Pace.js from `cdnjs.cloudflare.com`. Without internet access these assets won't load and the site will appear degraded.
- **No dependency installation needed**: The update script is a no-op (`echo 'No dependencies to install'`) since there are no runtime dependencies to refresh.
- **Source code lives elsewhere**: The actual Hexo source (Markdown posts, `_config.yml`, theme configuration) is in a separate repository. This repo only holds the compiled output.
