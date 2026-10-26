// Gera os PNGs de ícone/splash a partir de assets/brand/logo.svg: node scripts/render-icons.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const svg = fs.readFileSync(path.join(__dirname, '../assets/brand/logo.svg'), 'utf8');
const out = (f) => path.join(__dirname, '../assets', f);

const page = (size, bg, scale) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;
  background:${bg};display:flex;align-items:center;justify-content:center">
  <div style="width:${size * scale}px;height:${size * scale}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  const shots = [
    ['icon.png', 1024, 'radial-gradient(circle at 50% 35%, #1E1640, #0B0B14 70%)', 0.92],
    ['android-icon-foreground.png', 1024, 'transparent', 0.62],
    ['android-icon-background.png', 1024, 'radial-gradient(circle at 50% 35%, #1E1640, #0B0B14 70%)', 0],
    ['splash-icon.png', 1024, 'transparent', 0.9],
    ['favicon.png', 48, '#0B0B14', 0.95],
  ];
  for (const [file, size, bg, scale] of shots) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(page(size, bg, scale));
    await p.screenshot({ path: out(file), omitBackground: bg === 'transparent' });
  }
  // Monocromático: silhueta branca do capuz
  await p.setViewportSize({ width: 1024, height: 1024 });
  await p.setContent(page(1024, 'transparent', 0.62).replace(/fill="url\(#hood\)"/, 'fill="#fff"').replace(/fill="#05040B"/, 'fill="#000"'));
  await p.screenshot({ path: out('android-icon-monochrome.png'), omitBackground: true });
  await browser.close();
  console.log('Ícones gerados.');
})();
