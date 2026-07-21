// Regenerates sitemap.xml from categories.json, stamping every URL with
// today's date as <lastmod>. Since the site is 100% static (Cloudflare Pages
// has no build step here), "today" means the day this script last ran and
// its output got committed/pushed — not truly real-time, but it stops the
// sitemap from claiming the same lastmod forever while content changes every
// 5 minutes via the Worker. Run as part of `npm run build`.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const categoriesConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));

const today = new Date().toISOString().slice(0, 10);

const urls = [
    { loc: 'https://captainnews.gr/', changefreq: 'hourly', priority: '1.0' },
    ...Object.values(categoriesConfig).map(cfg => ({
        loc: `https://captainnews.gr${cfg.path}`,
        changefreq: 'hourly',
        priority: '0.9'
    })),
    { loc: 'https://captainnews.gr/contact/', changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://captainnews.gr/policy/',  changefreq: 'monthly', priority: '0.5' },
];

const body = urls.map(u => `    <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`built: sitemap.xml (${urls.length} urls, lastmod ${today})`);
