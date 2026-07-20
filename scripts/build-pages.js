// Regenerates the shared header/sidebar/filter-bar block, the footer, and
// (for brand-new categories) scaffolds the page itself — all driven by
// categories.json. Run after editing categories.json or a partial:
//
//   npm run build:pages
//
// Per-page meta tags (title, description, OG, canonical, JSON-LD) of EXISTING
// pages and the actual page content are NOT touched — only the header block
// (between <header id="main-header"> and #main-content-wrapper), the <body>
// tag's data-category attribute, and the <footer> block are replaced.
//
// To add a category: add an entry to categories.json, run this script (a
// starter page gets created if missing), then add its accent/colors to
// js/config.js (categoryAccents) — that part stays a manual design choice.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const categoriesConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));
const CATEGORY_KEYS = Object.keys(categoriesConfig);

// Non-category pages: navKey identifies which sidebar link gets the solid
// highlight; bodyCategory is written to <body data-category="...">.
const EXTRA_PAGES = [
    { file: 'index.html',         navKey: 'home',   bodyCategory: null },
    { file: 'policy/index.html',  navKey: 'policy',  bodyCategory: null },
    { file: 'contact/index.html', navKey: 'contact', bodyCategory: null },
];

function navClass(active) {
    return active ? 'bg-[#3749bd]' : 'hover:bg-[#3749bd]';
}

function buildSidebarNav(navKey) {
    const lines = [];
    lines.push(`                <a href="/" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === 'home')} transition-all"><i class="fa-solid fa-house mr-3"></i>ΑΡΧΙΚΗ</a>`);
    lines.push(`                <p class="px-4 pt-3 pb-1 text-zinc-600 text-xs font-condensed font-bold uppercase tracking-widest">Κατηγορίες</p>`);
    for (const key of CATEGORY_KEYS) {
        const cfg = categoriesConfig[key];
        lines.push(`                <a href="${cfg.path}" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === key)} transition-all"><i class="fa-solid ${cfg.navIcon} mr-3"></i>${cfg.navLabel}</a>`);
    }
    lines.push(`                <p class="px-4 pt-3 pb-1 text-zinc-600 text-xs font-condensed font-bold uppercase tracking-widest">Άλλα</p>`);
    lines.push(`                <a href="/contact" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === 'contact')} transition-all"><i class="fa-solid fa-envelope mr-3"></i>ΕΠΙΚΟΙΝΩΝΙΑ</a>`);
    lines.push(`                <a href="/policy" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === 'policy')} transition-all"><i class="fa-solid fa-shield-halved mr-3"></i>ΠΟΛΙΤΙΚΗ ΑΠΟΡΡΗΤΟΥ</a>`);
    return lines.join('\n');
}

function buildFilterPills(bodyCategory) {
    const active = bodyCategory || 'all';
    const lines = [];
    lines.push(`                <a href="/" data-category="all" class="filter-pill${active === 'all' ? ' active' : ''} font-condensed font-bold text-xs px-4 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer">\n                    ΟΛΕΣ ΟΙ ΚΑΤΗΓΟΡΙΕΣ\n                </a>`);
    for (const key of CATEGORY_KEYS) {
        const cfg = categoriesConfig[key];
        const isActive = active === key ? ' active' : '';
        lines.push(`                <a href="${cfg.path}" data-category="${key}" class="filter-pill${isActive} font-condensed font-bold text-xs px-4 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer">\n                    ${cfg.displayName}\n                </a>`);
    }
    return lines.join('\n');
}

function buildHeader(navKey, bodyCategory) {
    const template = fs.readFileSync(path.join(ROOT, 'partials/header.html'), 'utf8');
    return template
        .replace('{{SIDEBAR_NAV}}', buildSidebarNav(navKey))
        .replace('{{FILTER_PILLS}}', buildFilterPills(bodyCategory));
}

function buildFooter() {
    const template = fs.readFileSync(path.join(ROOT, 'partials/footer.html'), 'utf8');
    const columns = CATEGORY_KEYS.map(key => {
        const cfg = categoriesConfig[key];
        const items = cfg.feeds.map(f =>
            `                        <li><a href="${f.homepage}" target="_blank" rel="noopener noreferrer" class="text-zinc-500 hover:text-main-yellow text-xs transition-colors">${f.name}</a></li>`
        ).join('\n');
        return `                <div>\n                    <h3 class="text-white font-condensed font-bold text-xs uppercase tracking-wider mb-3">${cfg.displayName}</h3>\n                    <ul class="space-y-2">\n${items}\n                    </ul>\n                </div>`;
    }).join('\n');
    return template.replace(/\{\{FOOTER_COLUMNS\}\}/, columns);
}

const HEADER_END   = /^[ \t]*<(?:main|div) id="main-content-wrapper"/m;
const FOOTER_BLOCK = /^ {4}<footer class="bg-zinc-950 border-t border-zinc-900">[\s\S]*?<\/footer>/m;

function applyBodyCategory(html, bodyCategory) {
    return html.replace(
        /<body[^>]*>/,
        `<body class="bg-main-black flex flex-col min-h-screen"${bodyCategory ? ` data-category="${bodyCategory}"` : ''}>`
    );
}

function scaffoldPage(key) {
    const cfg = categoriesConfig[key];
    const filePath = path.join(ROOT, cfg.path.slice(1), 'index.html');
    if (fs.existsSync(filePath)) return false;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    let html = fs.readFileSync(path.join(ROOT, 'partials/page-template.html'), 'utf8');
    html = html
        .replace(/\{\{DISPLAY_NAME\}\}/g, cfg.displayName)
        .replace(/\{\{PATH\}\}/g, cfg.path)
        .replace(/\{\{DESCRIPTION\}\}/g, cfg.description || `Τελευταία νέα για ${cfg.displayName} σε πραγματικό χρόνο, από τις κορυφαίες πηγές.`)
        .replace('{{HEADER}}', buildHeader(key, key))
        .replace('{{FOOTER}}', buildFooter().trimEnd());
    html = applyBodyCategory(html, key);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`scaffolded new page: ${cfg.path.slice(1)}index.html  ← edit its <meta name="description"> and add an accent in js/config.js`);
    return true;
}

function buildExistingPage({ file, navKey, bodyCategory }) {
    const filePath = path.join(ROOT, file);
    let html = fs.readFileSync(filePath, 'utf8');

    const startMatch = html.match(/^ {4}<header id="main-header"/m);
    const endMatch   = html.match(HEADER_END);
    if (!startMatch || !endMatch) throw new Error(`${file}: could not locate header block boundaries`);

    html = html.slice(0, startMatch.index) + buildHeader(navKey, bodyCategory) + '\n' + html.slice(endMatch.index);

    if (!FOOTER_BLOCK.test(html)) throw new Error(`${file}: could not locate footer block`);
    html = html.replace(FOOTER_BLOCK, buildFooter().trimEnd());

    html = applyBodyCategory(html, bodyCategory);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`built: ${file}`);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

for (const key of CATEGORY_KEYS) {
    const cfg = categoriesConfig[key];
    const isNew = scaffoldPage(key);
    if (!isNew) {
        buildExistingPage({ file: path.join(cfg.path.slice(1), 'index.html'), navKey: key, bodyCategory: key });
    }
}

for (const page of EXTRA_PAGES) buildExistingPage(page);

console.log(`\nDone — ${CATEGORY_KEYS.length + EXTRA_PAGES.length} pages synced from categories.json + partials/`);
