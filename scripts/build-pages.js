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

// js/config.js is a browser ES module (references `window`), so it can't be
// require()'d from Node — extract just the categoryAccents object literal
// (same trick build-worker.js uses for the categories block) so the skeleton
// generator below can match each category's real layout/colors.
function loadCategoryAccents() {
    const src = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
    const marker = 'export const categoryAccents = {';
    const start = src.indexOf(marker);
    if (start === -1) throw new Error('could not find categoryAccents in js/config.js');
    const objStart = src.indexOf('{', start);
    let depth = 0, i = objStart;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    return new Function(`return ${src.slice(objStart, i)};`)();
}

const categoryAccents = loadCategoryAccents();

// Non-category pages: navKey identifies which sidebar link gets the solid
// highlight; bodyCategory is written to <body data-category="...">. h1Text is
// injected as a visually-hidden <h1> right inside #main-content-wrapper (SEO —
// null skips it, e.g. policy/contact already have a visible <h1> of their own).
// skeletonKeys lists which categories' skeleton loading placeholder to render
// inside #main-content-wrapper (null skips it — policy/contact show no feed).
const EXTRA_PAGES = [
    { file: 'index.html',         navKey: 'home',   bodyCategory: null, h1Text: 'CaptainNews.gr — Ειδήσεις σε πραγματικό χρόνο από Ελλάδα και τον κόσμο', skeletonKeys: CATEGORY_KEYS },
    { file: 'policy/index.html',  navKey: 'policy',  bodyCategory: null, h1Text: null, skeletonKeys: null },
    { file: 'contact/index.html', navKey: 'contact', bodyCategory: null, h1Text: null, skeletonKeys: null },
];

function navClass(active) {
    return active ? 'bg-[#3749bd]' : 'hover:bg-[#3749bd]';
}

const NEW_BADGE_NAV  = `<span class="ml-2 bg-[#f59e0b] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest align-middle animate-pulse">NEW</span>`;
const NEW_BADGE_PILL = `<span class="ml-1 bg-[#f59e0b] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest align-middle animate-pulse">NEW</span>`;

function buildSidebarNav(navKey) {
    const lines = [];
    lines.push(`                <a href="/" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === 'home')} transition-all"><i class="fa-solid fa-house mr-3"></i>ΑΡΧΙΚΗ</a>`);
    lines.push(`                <p class="px-4 pt-3 pb-1 text-zinc-400 text-xs font-condensed font-bold uppercase tracking-widest">Κατηγορίες</p>`);
    for (const key of CATEGORY_KEYS) {
        const cfg = categoriesConfig[key];
        const badge = cfg.isNew ? NEW_BADGE_NAV : '';
        lines.push(`                <a href="${cfg.path}" class="block px-4 py-3 text-white font-condensed font-bold rounded-lg ${navClass(navKey === key)} transition-all"><i class="fa-solid ${cfg.navIcon} mr-3"></i>${cfg.navLabel}${badge}</a>`);
    }
    lines.push(`                <p class="px-4 pt-3 pb-1 text-zinc-400 text-xs font-condensed font-bold uppercase tracking-widest">Άλλα</p>`);
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
        const badge = cfg.isNew ? NEW_BADGE_PILL : '';
        lines.push(`                <a href="${cfg.path}" data-category="${key}" class="filter-pill${isActive} font-condensed font-bold text-xs px-4 py-1.5 rounded-full border transition-all duration-200 whitespace-nowrap cursor-pointer">\n                    ${cfg.displayName}${badge}\n                </a>`);
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
            `                        <li><a href="${f.homepage}" target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-main-yellow text-xs transition-colors">${f.name}</a></li>`
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

// ─── Skeleton loading placeholders ──────────────────────────────────────────
// Mirrors js/templates.js's card()/magazineFeatured()/magazineSideCard()/
// listItem() dimensions exactly (same aspect ratios, same px sizes) so the
// swap from skeleton -> real content in main.js causes near-zero layout
// shift. Pure gray pulsing blocks — no real content, no article count known
// yet at build time.

function skeletonSectionHeader() {
    return `
        <div class="gg-container section-header">
            <div class="w-full">
                <div class="flex items-end gap-[20px] pb-[8px]">
                    <div class="h-[24px] min-[420px]:h-[28px] min-[767px]:h-[38px] min-[1024px]:h-[46px] min-[1420px]:h-[54px] w-[55vw] max-w-[420px] bg-zinc-800 rounded animate-pulse"></div>
                    <div class="h-[3px] flex-1 rounded-full bg-zinc-800 mb-[5px]"></div>
                    <div class="h-[16px] w-[70px] shrink-0 bg-zinc-800 rounded animate-pulse"></div>
                </div>
            </div>
        </div>`;
}

function skeletonFeaturedCard() {
    return `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row rounded-[12px] overflow-hidden animate-pulse bg-main-grey">
            <div class="w-full md:w-6/12 aspect-[1.7] max-h-[280px] md:max-h-[500px] bg-zinc-800 shrink-0"></div>
            <div class="p-[20px] flex flex-col justify-center w-full md:w-6/12 gap-[12px]">
                <div class="h-[26px] bg-zinc-700 rounded w-full"></div>
                <div class="h-[26px] bg-zinc-700 rounded w-3/4"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-full mt-2"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-5/6"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-2/3"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-1/3 mt-[20px]"></div>
                <div class="flex items-center justify-between mt-[20px]">
                    <div class="h-[14px] w-[60px] bg-zinc-700 rounded"></div>
                    <div class="h-[14px] w-[80px] bg-zinc-700 rounded"></div>
                </div>
            </div>
        </div>`;
}

function skeletonMagazineFeatured() {
    return `
        <div class="rounded-[12px] overflow-hidden animate-pulse bg-main-grey h-full flex flex-col">
            <div class="w-full aspect-[1.7] bg-zinc-800 shrink-0"></div>
            <div class="p-[20px] flex flex-col flex-grow gap-[12px]">
                <div class="h-[24px] bg-zinc-700 rounded w-full"></div>
                <div class="h-[24px] bg-zinc-700 rounded w-3/4"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-full mt-2"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-5/6"></div>
                <div class="flex items-center justify-between mt-[12px]">
                    <div class="h-[14px] w-[60px] bg-zinc-700 rounded"></div>
                    <div class="h-[14px] w-[80px] bg-zinc-700 rounded"></div>
                </div>
            </div>
        </div>`;
}

function skeletonCard() {
    return `
        <div class="flex flex-col rounded-[12px] overflow-hidden animate-pulse bg-main-grey">
            <div class="w-full aspect-[1.7] bg-zinc-800"></div>
            <div class="p-[20px] flex flex-col flex-grow gap-[10px]">
                <div class="h-[20px] bg-zinc-700 rounded w-full"></div>
                <div class="h-[20px] bg-zinc-700 rounded w-2/3"></div>
                <div class="h-[14px] bg-zinc-700 rounded w-full mt-2"></div>
                <div class="h-[14px] bg-zinc-700 rounded w-5/6"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-1/3 mt-[20px]"></div>
                <div class="flex items-center justify-between mt-[20px]">
                    <div class="h-[14px] w-[60px] bg-zinc-700 rounded"></div>
                    <div class="h-[14px] w-[80px] bg-zinc-700 rounded"></div>
                </div>
            </div>
        </div>`;
}

function skeletonSideCard() {
    return `
        <div class="rounded-[12px] overflow-hidden flex flex-row flex-1 min-h-0 animate-pulse bg-main-grey">
            <div class="w-[38%] shrink-0 bg-zinc-800"></div>
            <div class="flex flex-col justify-between flex-1 px-[14px] py-[14px] min-w-0 gap-[8px]">
                <div class="h-[16px] bg-zinc-700 rounded w-full"></div>
                <div class="h-[16px] bg-zinc-700 rounded w-2/3"></div>
                <div class="h-[11px] bg-zinc-700 rounded w-1/3 mt-2"></div>
            </div>
        </div>`;
}

function skeletonListItem() {
    return `
        <div class="flex items-center gap-[14px] p-[10px] rounded-[10px] animate-pulse">
            <div class="w-[110px] h-[70px] shrink-0 bg-zinc-800 rounded-[8px]"></div>
            <div class="flex-1 min-w-0 flex flex-col gap-[8px]">
                <div class="h-[15px] bg-zinc-700 rounded w-full"></div>
                <div class="h-[15px] bg-zinc-700 rounded w-1/2"></div>
                <div class="h-[11px] bg-zinc-700 rounded w-1/4 mt-1"></div>
            </div>
        </div>`;
}

function skeletonLoadMoreBtn() {
    return `
        <div class="gg-container flex justify-center mt-6 pb-10">
            <div class="h-[38px] w-[180px] bg-zinc-800 rounded animate-pulse"></div>
        </div>`;
}

function skeletonDefaultLayout() {
    const cards = Array.from({ length: 6 }, skeletonCard).join('');
    return `<div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">${skeletonFeaturedCard()}${cards}</div>`;
}

function skeletonMagazineLayout() {
    const sideHtml  = Array.from({ length: 3 }, skeletonSideCard).join('');
    const belowHtml = Array.from({ length: 3 }, skeletonCard).join('');
    return `
        <div class="gg-container grid grid-cols-1 md:grid-cols-2 grid-rows-1 mb-[20px] gap-[20px] pt-[10px] md:items-stretch">
            <div class="flex flex-col">${skeletonMagazineFeatured()}</div>
            <div class="flex flex-col gap-[20px] h-full">${sideHtml}</div>
        </div>
        <div class="gg-container grid grid-cols-1 md:grid-cols-3 gap-[20px]">${belowHtml}</div>`;
}

function skeletonListLayout() {
    return `<div class="gg-container flex flex-col gap-[10px] pt-[10px]">${Array.from({ length: 7 }, skeletonListItem).join('')}</div>`;
}

function skeletonSection(key) {
    const accent = categoryAccents[key];
    if (!accent) return '';

    let body;
    switch (accent.sectionLayout) {
        case 'magazine': body = skeletonMagazineLayout(); break;
        case 'list':     body = skeletonListLayout(); break;
        default:         body = skeletonDefaultLayout();
    }

    let style = '';
    if (accent.sectionBgImage) {
        style = `background-image:url('${accent.sectionBgImage}');background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:fixed;border-radius:12px;padding-top:32px;`;
    } else if (accent.sectionBg) {
        style = `background-color:${accent.sectionBg};border-radius:0px;padding-top:0px;padding-bottom:20px;`;
    }

    return `        <section class="category-group pb-10"${style ? ` style="${style}"` : ''}>${skeletonSectionHeader()}${body}${skeletonLoadMoreBtn()}\n        </section>`;
}

function buildSkeleton(keys) {
    if (!keys || !keys.length) return '';
    return keys.map(skeletonSection).join('\n');
}

const MAIN_CONTENT_RE = /(<main id="main-content-wrapper"[^>]*>)[\s\S]*?(<\/main>)/;

// Fills #main-content-wrapper with the sr-only <h1> (SEO) plus a skeleton
// loading placeholder matching the real layout, so there's near-zero visual
// jump once js/main.js swaps in the real fetched articles. Pages that use a
// hidden <div id="main-content-wrapper"> (policy/contact) are left alone.
function applyMainContent(html, h1Text, skeletonKeys) {
    if (!MAIN_CONTENT_RE.test(html)) return html;
    const h1Block = h1Text ? `\n        <h1 class="sr-only">${h1Text}</h1>` : '';
    const skeletonHtml = buildSkeleton(skeletonKeys);
    return html.replace(MAIN_CONTENT_RE, (_m, openTag, closeTag) =>
        `${openTag}${h1Block}\n${skeletonHtml}\n    ${closeTag}`
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
    html = applyMainContent(html, cfg.displayName, [key]);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`scaffolded new page: ${cfg.path.slice(1)}index.html  ← edit its <meta name="description"> and add an accent in js/config.js`);
    return true;
}

function buildExistingPage({ file, navKey, bodyCategory, h1Text, skeletonKeys }) {
    const filePath = path.join(ROOT, file);
    let html = fs.readFileSync(filePath, 'utf8');

    const startMatch = html.match(/^ {4}<header id="main-header"/m);
    const endMatch   = html.match(HEADER_END);
    if (!startMatch || !endMatch) throw new Error(`${file}: could not locate header block boundaries`);

    html = html.slice(0, startMatch.index) + buildHeader(navKey, bodyCategory) + '\n' + html.slice(endMatch.index);

    if (!FOOTER_BLOCK.test(html)) throw new Error(`${file}: could not locate footer block`);
    html = html.replace(FOOTER_BLOCK, buildFooter().trimEnd());

    html = applyBodyCategory(html, bodyCategory);
    html = applyMainContent(html, h1Text, skeletonKeys);

    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`built: ${file}`);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

for (const key of CATEGORY_KEYS) {
    const cfg = categoriesConfig[key];
    const isNew = scaffoldPage(key);
    if (!isNew) {
        buildExistingPage({ file: path.join(cfg.path.slice(1), 'index.html'), navKey: key, bodyCategory: key, h1Text: cfg.displayName, skeletonKeys: [key] });
    }
}

for (const page of EXTRA_PAGES) buildExistingPage(page);

console.log(`\nDone — ${CATEGORY_KEYS.length + EXTRA_PAGES.length} pages synced from categories.json + partials/`);
