#!/usr/bin/env node
// build-critical.mjs
// Usage: node scripts/build-critical.mjs [inputHtml=index.html] [outputHtml=index.html]
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const inputHtml = process.argv[2] || 'index.html';
const outputHtml = process.argv[3] || inputHtml;
const inputPath = path.resolve(projectRoot, inputHtml);
const outputPath = path.resolve(projectRoot, outputHtml);

// Simple CSS minifier (naive, but effective for critical)
function minifyCSS(css){
  return css
    .replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, '') // comments
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

// Extract CSS blocks for safelist selectors from a stylesheet string
function pickSafeBlocks(css, safelist){
  const blocks = [];
  for (const sel of safelist){
    // Very naive: look for 'selector{...}' or ':root{...}'
    const re = new RegExp(`${sel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g');
    const matches = css.match(re);
    if (matches) blocks.push(...matches);
  }
  return blocks.join('\n');
}

async function main(){
  const html = await fs.readFile(inputPath, 'utf-8');

  // Find existing stylesheet link to read full CSS (assets.min.css)
  const cssHrefMatch = html.match(/href="([^"]*assets\.min\.css)"/);
  let fullCss = '';
  if (cssHrefMatch){
    const cssFile = path.resolve(projectRoot, cssHrefMatch[1]);
    try{
      fullCss = await fs.readFile(cssFile, 'utf-8');
    }catch(e){
      // ignore
    }
  }

  // Prepare a file:// URL for puppeteer
  const url = 'file://' + inputPath.replace(/\\/g, '/');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Function to get coverage for a given viewport
  async function getCoverageForViewport(width, height){
    await page.setViewport({width, height, deviceScaleFactor: 1});
    await page.coverage.startCSSCoverage();
    await page.goto(url, {waitUntil: 'networkidle2'});
    // Small settle wait to allow fonts/late paints
    await page.waitForTimeout(200);
    const coverage = await page.coverage.stopCSSCoverage();
    return coverage;
  }

  // Collect coverage across multiple breakpoints (mobile + desktop)
  const viewports = [
    {width: 390, height: 844},    // mobile
    {width: 768, height: 1024},   // tablet
    {width: 1280, height: 900},   // desktop
  ];
  let usedCssChunks = [];
  for (const vp of viewports){
    const cov = await getCoverageForViewport(vp.width, vp.height);
    for (const entry of cov){
      for (const range of entry.ranges){
        usedCssChunks.push(entry.text.slice(range.start, range.end));
      }
    }
  }
  await browser.close();

  // Combine and minify
  let critical = minifyCSS(usedCssChunks.join(' '));

  // Safelist essential base rules that coverage can miss (variables, helpers, layout)
  const safelist = [
    ':root',
    'html','body','.container','.header','.header-inner',
    '.brand','.brand-name','.nav','.nav a','.nav a.active','.nav a::after','.nav-toggle',
    '.hero','.hero-inner','.section','.section-title','.card',
    '.social-bar','.social-bar a','.footer','.footer-inner',
    '.visually-hidden','.skip-link','.skip-link:focus'
  ];
  if (fullCss){
    const safe = pickSafeBlocks(fullCss, safelist);
    // Prepend safelist blocks so variables and layout appear before used rules
    critical = minifyCSS(safe + '\n' + critical);
  }

  // Replace inline <style id="critical-css"> content in index.html
  let newHtml = html;
  if (newHtml.includes('id="critical-css"')){
    newHtml = newHtml.replace(
      /<style id="critical-css">[\s\S]*?<\/style>/,
      `<style id="critical-css">${critical}</style>`
    );
  }else{
    // Insert before first stylesheet link if not present
    newHtml = newHtml.replace(
      /<link[^>]+assets\.min\.css[^>]*>/,
      `<style id="critical-css">${critical}</style>\n$&`
    );
  }

  // Backup original then write
  await fs.copyFile(inputPath, inputPath + '.bak');
  await fs.writeFile(outputPath, newHtml, 'utf-8');

  // Also write critical.css for inspection
  await fs.writeFile(path.resolve(projectRoot, 'critical.css'), critical, 'utf-8');

  console.log('Critical CSS generated and inlined.');
  console.log('- Updated:', path.relative(projectRoot, outputPath));
  console.log('- Backup  :', path.relative(projectRoot, inputPath + '.bak'));
  console.log('- CSS file:', 'critical.css');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
