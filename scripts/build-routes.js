// Regenerates _routes.json from categories.json. It tells Cloudflare Pages
// which paths invoke Functions: only the news pages (for the SSR headlines in
// functions/_middleware.js) and the news sitemap. Everything else (CSS, JS,
// images, policy/contact) is served as a plain static asset and doesn't count
// against the Workers free-tier request limit.
//
//   npm run build:routes

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const categoriesConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));

const include = ['/', '/index.html'];
for (const cfg of Object.values(categoriesConfig)) {
    const p = cfg.path.replace(/\/$/, '');
    include.push(p, `${p}/`, `${p}/index.html`);
}
include.push('/news-sitemap.xml');

// Cloudflare's hard limit for include + exclude rules combined.
if (include.length > 100) throw new Error(`_routes.json: ${include.length} rules, Cloudflare allows 100`);

fs.writeFileSync(path.join(ROOT, '_routes.json'), JSON.stringify({ version: 1, include, exclude: [] }, null, 2) + '\n', 'utf8');
console.log(`built: _routes.json (${include.length} function routes)`);
