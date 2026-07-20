// Regenerates the `categories` block inside worker.js from categories.json,
// so the RSS feed list can't drift between update-news.js (local) and
// worker.js (live). Run after editing categories.json:
//
//   npm run build:worker
//
// worker.js stays a single self-contained file — after running this, copy
// its contents into the Cloudflare Worker "Quick Edit" dashboard as usual.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const categoriesConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));

function buildCategoriesBlock() {
    const catEntries = Object.entries(categoriesConfig);
    const lines = ['const categories = {'];

    catEntries.forEach(([key, cfg], i) => {
        const nameWidth = Math.max(...cfg.feeds.map(f => f.name.length));
        lines.push(`    "${key}": [`);
        for (const feed of cfg.feeds) {
            const namePadded = `"${feed.name}",`.padEnd(nameWidth + 3);
            lines.push(`        { name: ${namePadded} url: "${feed.url}" },`);
        }
        lines.push(i === catEntries.length - 1 ? '    ]' : '    ],');
    });

    lines.push('};');
    return lines.join('\n');
}

const workerPath = path.join(ROOT, 'worker.js');
let worker = fs.readFileSync(workerPath, 'utf8');

const startIdx = worker.indexOf('const categories = {');
if (startIdx === -1) throw new Error('worker.js: could not find "const categories = {"');

const endIdx = worker.indexOf('\n};', startIdx);
if (endIdx === -1) throw new Error('worker.js: could not find end of categories block');

worker = worker.slice(0, startIdx) + buildCategoriesBlock() + worker.slice(endIdx + 3);

fs.writeFileSync(workerPath, worker, 'utf8');
console.log('built: worker.js (categories block synced from categories.json)');
