# Critical CSS build

This project includes a Puppeteer-based generator for **page-specific critical CSS**.

## Quick start

```bash
# in the project folder
npm install
npm run build:critical
```

- The script loads `index.html` via `file://` in headless Chrome at three breakpoints (mobile, tablet, desktop), collects **CSS coverage**, and assembles the **critical CSS**.
- It **replaces** the contents of `<style id="critical-css">...</style>` in `index.html` and writes a backup `index.html.bak`.
- It also writes the raw `critical.css` file for inspection.

You can customize the safelist of selectors in `scripts/build-critical.mjs` if certain essentials (e.g., `:root` CSS variables) are not picked up by coverage.
