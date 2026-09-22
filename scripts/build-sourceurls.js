// Regenerates the `sourceUrls` block inside js/config.js from categories.json,
// so the "Πηγή:" links can't drift out of sync with the feed list. Run after
// editing categories.json:
//
//   npm run build:sourceurls
//
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const categoriesConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));

function buildSourceUrlsBlock() {
    const sources = new Map();
    for (const cfg of Object.values(categoriesConfig)) {
        for (const feed of cfg.feeds) {
            if (!sources.has(feed.name)) sources.set(feed.name, feed.homepage);
        }
    }

    const nameWidth = Math.max(...[...sources.keys()].map(n => n.length));
    const lines = ['export const sourceUrls = {'];
    for (const [name, homepage] of [...sources.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const namePadded = `'${name}':`.padEnd(nameWidth + 4);
        lines.push(`    ${namePadded} '${homepage}',`);
    }
    lines.push('};');
    return lines.join('\n');
}

const configPath = path.join(ROOT, 'js', 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

const startIdx = config.indexOf('export const sourceUrls = {');
if (startIdx === -1) throw new Error('config.js: could not find "export const sourceUrls = {"');

const endIdx = config.indexOf('\n};', startIdx);
if (endIdx === -1) throw new Error('config.js: could not find end of sourceUrls block');

config = config.slice(0, startIdx) + buildSourceUrlsBlock() + config.slice(endIdx + 3);

fs.writeFileSync(configPath, config, 'utf8');
console.log('built: js/config.js (sourceUrls block synced from categories.json)');
