#!/usr/bin/env node
/**
 * Bundles the timer into a single HTML file with inline CSS and JS.
 * Requires the `esbuild` CLI to be available on PATH.
 */
const { promisify } = require('util');
const { execFile } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const run = promisify(execFile);
const projectRoot = __dirname;
const distDir = path.join(projectRoot, 'dist');
const cssMarker = '<link rel="stylesheet" href="./style.css" />';
const scriptMarker = '<script type="module" src="./main.js" crossorigin="anonymous"></script>';

async function main() {
  await recreateDist();
  const [htmlRaw, cssRaw, js] = await Promise.all([
    fs.readFile(path.join(projectRoot, 'index.html'), 'utf8'),
    fs.readFile(path.join(projectRoot, 'style.css'), 'utf8'),
    bundleJavaScript()
  ]);

  const html = await inlineAssetReferences(htmlRaw);
  const css = await inlineCssAssets(cssRaw);

  const inlined = inlineAssets(html, css, js);
  await fs.writeFile(path.join(distDir, 'index.html'), inlined, 'utf8');

  console.log('Built dist/index.html with inline CSS and JS.');
}

async function recreateDist() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
}

async function bundleJavaScript() {
  const outfile = path.join(distDir, 'bundle.js');
  await run('esbuild', [
    path.join(projectRoot, 'main.js'),
    '--bundle',
    '--format=esm',
    '--platform=browser',
    '--minify',
    '--log-level=error',
    `--outfile=${outfile}`
  ], { cwd: projectRoot });

  const bundled = await fs.readFile(outfile, 'utf8');
  await fs.rm(outfile);
  return bundled;
}

async function inlineAssetReferences(html) {
  const logoDataUri = await fileAsDataUri('assets/innoq-logo.svg', 'image/svg+xml');
  return html
    .replace(/href="\.\/assets\/innoq-logo\.svg"/g, `href="${logoDataUri}"`)
    .replace(/src="\.\/assets\/innoq-logo\.svg"/g, `src="${logoDataUri}"`);
}

async function inlineCssAssets(css) {
  const backgroundDataUri = await fileAsDataUri('assets/innoq-background.jpg', 'image/jpeg');
  return css.replace(/url\(['"]?\.\/assets\/innoq-background\.jpg['"]?\)/g, `url('${backgroundDataUri}')`);
}

async function fileAsDataUri(relativePath, mimeType) {
  const absolutePath = path.join(projectRoot, relativePath);
  const data = await fs.readFile(absolutePath);
  const base64 = data.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

function inlineAssets(html, css, js) {
  if (!html.includes(cssMarker) || !html.includes(scriptMarker)) {
    throw new Error('Unable to find CSS or JS markers in index.html');
  }

  const escapedCss = css.replace(/<\/style>/gi, '<\\/style>');
  const escapedJs = js.replace(/<\/script>/gi, '<\\/script>');

  return html
    .replace(cssMarker, `<style>${escapedCss}</style>`)
    .replace(scriptMarker, `<script>${escapedJs}</script>`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
