// ─── Imports ───────────────────────────────────────────────────────────────────

import { categoryDisplayNames, categoryAccents, sourceUrls, INITIAL_VISIBLE_COUNT } from './config.js?v=88';
import { stripHtml, timeAgo, escapeHtml, safeUrl } from './utils.js?v=88';

// ─── Public API ────────────────────────────────────────────────────────────────

// Feed fields are untrusted. Every article is escaped once here, so the
// templates below can interpolate its fields into HTML as-is.
function toSafeArticle(a) {
    const link  = safeUrl(a.link);
    const image = safeUrl(a.image);
    return {
        date:            a.date,
        title:           escapeHtml(a.title),
        source:          escapeHtml(a.source),
        sourceUrl:       escapeHtml(safeUrl(sourceUrls[a.source])),
        link:            escapeHtml(link),
        image:           image === '#' ? '' : escapeHtml(image),
        descriptionText: stripHtml(a.description).trim(),           // plain text; escape after truncating
        shareText:       `${stripHtml(a.title)}\n${link}\n\nμέσω captainnews.gr`, // raw, for encodeURIComponent
        // Other sources for the same story (js/dedupe.js). JSON in a data attribute,
        // read by window.showSources in main.js, which builds the list with DOM APIs.
        relatedCount:    a.related?.length || 0,
        relatedJson:     a.related?.length
            ? escapeHtml(JSON.stringify(a.related.map(r => ({ source: String(r.source || ''), title: stripHtml(r.title), link: safeUrl(r.link) }))))
            : '',
    };
}

export function buildSection(categoryKey, rawArticles) {
    const articles    = (rawArticles || []).map(toSafeArticle);
    const accent      = categoryAccents[categoryKey];
    const accentColor = accent?.color || '#4f72ff';
    const title       = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
    const configured  = (accent?.sectionLayout || 'default').trim();
    // A single horizontal row makes no sense when the category is the whole
    // page, so on category pages the swipe layouts fall back to a grid:
    // carousel → default, poster → bento (same photo-overlay look).
    const onCategoryPage = !!document.body.dataset.category;
    const layout = !onCategoryPage ? configured
                 : configured === 'carousel' ? 'default'
                 : configured === 'poster' ? 'bento'
                 : configured;

    const section = document.createElement('section');
    section.id        = `section-${categoryKey}`;
    section.className = 'category-group pb-10';
    section.setAttribute('data-category', categoryKey);

    if (accent?.sectionBgImage) {
        section.style.backgroundImage      = `url('${accent.sectionBgImage}')`;
        section.style.backgroundSize       = 'cover';
        section.style.backgroundPosition   = 'center';
        section.style.backgroundRepeat     = 'no-repeat';
        section.style.backgroundAttachment = 'fixed';
        section.style.borderRadius         = '12px';
        section.style.paddingTop           = '32px';
    } else if (accent?.sectionBg) {
        section.style.backgroundColor = accent.sectionBg;
        section.style.borderRadius    = '0px';
        section.style.paddingTop      = '10px';
        section.style.paddingBottom      = '20px';

    }

    const header  = sectionHeader(title, articles.length, accentColor, accent);
    let body = '';

    switch (layout) {
        case 'magazine': body = magazineLayout(articles, categoryKey, accent, accentColor); break;
        case 'carousel': body = carouselLayout(articles, categoryKey, accent, accentColor); break;
        case 'poster':   body = posterLayout(articles, categoryKey, accent, accentColor); break;
        case 'bento':    body = bentoLayout(articles, categoryKey, accent, accentColor); break;
        case 'timeline': body = timelineLayout(articles, categoryKey, accent, accentColor); break;
        default:         body = defaultLayout(articles, categoryKey, accent, accentColor);
    }

    const visibleCount = layout === 'timeline' ? TIMELINE_VISIBLE_COUNT
                       : layout === 'carousel' || layout === 'poster' ? articles.length
                       : layout === 'bento' ? BENTO_VISIBLE_COUNT
                       : INITIAL_VISIBLE_COUNT;
    const content = header + body + loadMoreBtn(categoryKey, articles.length, visibleCount);

    section.innerHTML = content;

    return section;
}

// ─── Section header ────────────────────────────────────────────────────────────

function sectionHeader(title, count, accentColor, accent) {
    const newBadge = accent?.isNew
        ? `<span class="shrink-0 self-center ml-1 bg-[#f59e0b] text-black text-[10px] font-bold px-2 py-[3px] rounded-full uppercase tracking-widest animate-pulse">NEW</span>`
        : '';
    return `
        <div class="gg-container section-header">
            <div class="w-full">
                <div class="flex items-end gap-[20px] pb-[8px]">
                    <div class="shrink-0 flex items-center gap-2">
                        <h2 class="whitespace-nowrap font-medium font-label uppercase text-[22px] leading-[24px] min-[420px]:text-[26px] min-[420px]:leading-[28px] min-[767px]:text-[36px] min-[767px]:leading-[38px] min-[1024px]:text-[44px] min-[1024px]:leading-[46px] min-[1420px]:text-[52px] min-[1420px]:leading-[54px]"
                            style="color:${accentColor}">${title}</h2>
                        ${newBadge}
                    </div>
                    <div class="h-[3px] flex-1 rounded-full mb-[5px]"
                         style="background:  ${accentColor} "></div>
                    <span class="shrink-0 whitespace-nowrap text-[13px] font-bold font-condensed"
                          style="color:${accentColor}">${count} ΑΡΘΡΑ</span>
                </div>
            </div>
        </div>`;
}

// ─── Layout: default ───────────────────────────────────────────────────────────

function defaultLayout(articles, categoryKey, accent, accentColor) {
    return `<div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">` +
        articles.map((a, i) => card(a, i, categoryKey, accent, accentColor)).join('') +
        `</div>`;
}

// ─── Layout: magazine ──────────────────────────────────────────────────────────

function magazineLayout(articles, categoryKey, accent, accentColor) {
    if (!articles.length) return '';

    const sideCards = articles.slice(1, 4);   // 3 κάρτες στα δεξιά
    const belowRow  = articles.slice(4, 7);   // 3 κανονικά cards κάτω
    const remaining = articles.slice(7);       // υπόλοιπα συνεχίζουν στο ίδιο grid

    const sideHtml = sideCards
        .map((a, i) => magazineSideCard(a, i + 1, categoryKey, accent, accentColor))
        .join('');

    const belowHtml = belowRow.length
        ? `<div class="gg-container grid grid-cols-1 md:grid-cols-3 gap-[20px]">` +
          belowRow.map((a, i) => card(a, i + 4, categoryKey, accent, accentColor)).join('') +
          `</div>`
        : '';

    const restHtml = remaining.length
        ? `<div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">` +
          remaining.map((a, i) => card(a, i + 7, categoryKey, accent, accentColor)).join('') +
          `</div>`
        : '';

    const featuredDiv = `<div class="flex flex-col">${magazineFeatured(articles[0], 0, categoryKey, accent, accentColor)}</div>`;
    const sideDiv     = `<div class="flex flex-col gap-[20px] h-full">${sideHtml}</div>`;
    const topRow      = accent?.featuredReverse ? sideDiv + featuredDiv : featuredDiv + sideDiv;

    return `
        <div class="gg-container grid grid-cols-1 md:grid-cols-2 grid-rows-1 mb-[20px] gap-[20px] pt-[10px] md:items-stretch">
            ${topRow}
        </div>
        ${belowHtml}
        ${restHtml}`;
}

// ─── Layout: timeline ──────────────────────────────────────────────────────────

// Grouped by Athens calendar day: ΣΗΜΕΡΑ / ΧΘΕΣ / ΤΡΙΤΗ 29/9. Relies on the
// articles already being sorted newest-first (update-news.js / worker.js do).
const TZ = 'Europe/Athens';
// Intl formatters are expensive to create, so build them once, not per article.
const DAY_KEY_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const WEEKDAY_FMT = new Intl.DateTimeFormat('el-GR', { timeZone: TZ, weekday: 'long' });
const DAY_MONTH_FMT = new Intl.DateTimeFormat('el-GR', { timeZone: TZ, day: 'numeric', month: 'numeric' });
const CLOCK_FMT = new Intl.DateTimeFormat('el-GR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const dayKey = d => DAY_KEY_FMT.format(new Date(d));
const stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const clockTime = d => CLOCK_FMT.format(new Date(d));

function dayLabel(dateString, todayKey, yesterdayKey) {
    const key = dayKey(dateString);
    if (key === todayKey) return 'ΣΗΜΕΡΑ';
    if (key === yesterdayKey) return 'ΧΘΕΣ';
    const d = new Date(dateString);
    return `${stripAccents(WEEKDAY_FMT.format(d).toUpperCase())} ${DAY_MONTH_FMT.format(d)}`;
}

const TIMELINE_VISIBLE_COUNT = 10;
const TIMELINE_ROW = 'grid grid-cols-[46px_22px_1fr] md:grid-cols-[60px_28px_1fr]';

function timelineLayout(articles, categoryKey, accent, accentColor) {
    const valid = articles.filter(a => !isNaN(new Date(a.date)));
    const todayKey     = dayKey(Date.now());
    const yesterdayKey = dayKey(Date.now() - 864e5);
    const groups = [];
    valid.forEach((a, i) => {
        const key = dayKey(a.date);
        if (!groups.length || groups.at(-1).key !== key) groups.push({ key, label: dayLabel(a.date, todayKey, yesterdayKey), items: [] });
        groups.at(-1).items.push([a, i]);
    });

    const hiddenCls = i => (i >= TIMELINE_VISIBLE_COUNT ? `hidden hidden-item-${categoryKey}` : '');
    const line = `<span class="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] opacity-30" style="background:${accentColor}"></span>`;

    const html = groups.map((g, gi) => {
        const isToday = g.label === 'ΣΗΜΕΡΑ';
        const header = `
            <div class="${TIMELINE_ROW} ${hiddenCls(g.items[0][1])}">
                <div></div>
                <div class="relative">
                    ${gi > 0 ? line : ''}
                    <span class="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 w-[14px] h-[14px] rounded-full ${isToday ? 'animate-pulse' : ''}" style="background:${accentColor}"></span>
                </div>
                <div class="py-[10px] font-condensed font-black text-[15px] md:text-[17px] tracking-widest" style="color:${accentColor}">${g.label}</div>
            </div>`;
        return header + g.items.map(([a, i]) => timelineItem(a, accent, accentColor, line, hiddenCls(i))).join('');
    }).join('');

    return `<div class="gg-container pt-[6px]"><div class="max-w-[900px]">${html}</div></div>`;
}

function timelineItem(article, accent, accentColor, line, hiddenClass) {
    const titleColor = accent?.titleColor || '#ffffff';
    const sourceUrl  = article.sourceUrl;

    return `
        <div class="${TIMELINE_ROW} group ${hiddenClass}" style="--card-hover-color:${accent?.hoverColor || '#f2d06f'}">
            <div class="pt-[2px] pr-[6px] text-right font-condensed font-bold text-[13px] md:text-[14px] tabular-nums" style="color:${accentColor}">${clockTime(article.date)}</div>
            <div class="relative">
                ${line}
                <span class="absolute left-1/2 -translate-x-1/2 top-[6px] w-[10px] h-[10px] rounded-full border-2 bg-white" style="border-color:${accentColor}"></span>
            </div>
            <div class="pb-[20px] min-w-0">
                <div class="min-w-0">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="block text-[16px] leading-[20px] md:text-[18px] md:leading-[23px] font-bold font-condensed text-(--title-color) hover:text-(--card-hover-color) transition-colors duration-300"
                       style="--title-color:${titleColor}">${article.title}</a>
                    <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-[2px] mt-[6px]">
                        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-[12px] font-condensed font-bold whitespace-nowrap text-(--card-link-color) hover:text-(--card-hover-color) hover:underline"
                           style="--card-link-color:${accentColor}">${article.source}</a>
                        ${moreSources(article, accentColor)}
                        ${shareActions(article, titleColor, true)}
                    </div>
                </div>
            </div>
        </div>`;
}

// ─── Layout: bento ─────────────────────────────────────────────────────────────

// 5 photo tiles, then the rest as the same small photo tiles in 4 columns,
// lined up with the tile grid above. One extra row is visible initially.
// Keep the grid/tile sizes in sync with skeletonBentoLayout() in scripts/build-pages.js.
const BENTO_TILES         = 5;
const BENTO_VISIBLE_COUNT = BENTO_TILES + 4;

function bentoLayout(articles, categoryKey, accent, accentColor) {
    if (!articles.length) return '';
    const tiles = articles.slice(0, BENTO_TILES)
        .map((a, i) => bentoTile(a, i === 0, accent, accentColor)).join('');
    const rest = articles.slice(BENTO_TILES);
    const restHtml = rest.length
        ? `<div class="gg-container grid grid-cols-2 md:grid-cols-4 gap-[12px] md:gap-[16px] mt-[12px] md:mt-[16px]">` +
          rest.map((a, i) => {
              const hidden = i + BENTO_TILES >= BENTO_VISIBLE_COUNT ? `hidden hidden-item-${categoryKey}` : '';
              return bentoTile(a, false, accent, accentColor, `h-[190px] md:h-[230px] ${hidden}`);
          }).join('') +
          `</div>`
        : '';
    return `
        <div class="gg-container grid grid-cols-2 md:grid-cols-4 md:grid-rows-[230px_230px] gap-[12px] md:gap-[16px] pt-[10px]">
            ${tiles}
        </div>
        ${restHtml}`;
}

// Title sits on the photo over a dark gradient, so text and icons are white
// here regardless of the category's titleColor (which is meant for its bg).
function bentoTile(article, isBig, accent, accentColor, sizeOverride = '') {
    const imgUrl  = article.image || '/icons/default-image.png?v=2';
    const timeStr = timeAgo(article.date);
    const size    = sizeOverride || (isBig
        ? 'col-span-2 md:row-span-2 h-[300px] min-[480px]:h-[360px] md:h-auto'
        : 'h-[190px] md:h-auto');
    const titleCls = isBig
        ? 'text-[22px] leading-[26px] md:text-[30px] md:leading-[34px] line-clamp-3'
        : 'text-[15px] leading-[19px] md:text-[17px] md:leading-[21px] line-clamp-3';
    const overlayText = '#ffffff';

    return `
        <div class="item relative ${size} rounded-[12px] overflow-hidden group bg-zinc-800"
             style="--card-hover-color:${accent?.hoverColor || '#f2d06f'}">
            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="absolute inset-0 block" aria-hidden="true" tabindex="-1">
                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                     src="${imgUrl}" alt="${article.title}" width="${isBig ? 800 : 400}" height="${isBig ? 600 : 300}" loading="lazy"
                     onerror="this.src='/icons/default-image.png?v=2'">
            </a>
            <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 ${isBig ? 'p-[16px] md:p-[22px]' : 'p-[10px] md:p-[14px]'} flex flex-col gap-[6px]">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                   class="font-condensed font-bold ${titleCls} text-(--title-color) hover:text-(--card-hover-color) transition-colors duration-300"
                   style="--title-color:${overlayText}">${article.title}</a>
                <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-[2px]">
                    <div class="flex items-center gap-[6px] min-w-0">
                        <span class="text-[11px] md:text-[12px] font-condensed font-bold whitespace-nowrap" style="color:${accentColor}">${article.source}</span>
                        ${moreSources(article, '#ffffff')}
                        <span class="text-white/50 text-[11px]">·</span>
                        <span class="text-[11px] font-condensed whitespace-nowrap text-white/80">${timeStr}</span>
                    </div>
                    ${shareActions(article, overlayText, true)}
                </div>
            </div>
        </div>`;
}

// ─── Layout: poster ────────────────────────────────────────────────────────────

// Tall swipeable posters with a big uppercase title on the photo.
// Keep in sync with skeletonPosterLayout() in scripts/build-pages.js.
const POSTER_CARD_WIDTH = 'w-[62%] min-[560px]:w-[38%] lg:w-[calc((100%-24px)/4)]';

function posterLayout(articles, categoryKey, accent, accentColor) {
    const arrow = (dir, icon, label, side) => `
        <button onclick="scrollCarousel('${categoryKey}', ${dir})" aria-label="${label}"
                class="hidden lg:flex absolute ${side} top-1/2 -translate-y-1/2 z-10 w-[44px] h-[44px] rounded-full bg-white text-black items-center justify-center shadow-lg hover:bg-[#f2d06f] transition-colors cursor-pointer">
            <i class="fa-solid ${icon}"></i>
        </button>`;
    return `
        <div class="gg-container relative">
            <div id="carousel-${categoryKey}" class="no-scrollbar relative flex gap-[8px] overflow-x-auto snap-x snap-mandatory scroll-smooth pt-[10px] pb-[4px]">
                ${articles.map(a => posterCard(a, accent)).join('')}
            </div>
            ${arrow(-1, 'fa-chevron-left', 'Προηγούμενα', 'left-[-8px]')}
            ${arrow(1, 'fa-chevron-right', 'Επόμενα', 'right-[-8px]')}
        </div>`;
}

// Text sits on the photo, so it's white regardless of the category's titleColor.
function posterCard(article, accent) {
    const imgUrl  = article.image || '/icons/default-image.png?v=2';
    const overlay = '#ffffff';
    return `
        <div class="item relative snap-start shrink-0 ${POSTER_CARD_WIDTH} aspect-[3/5] rounded-[10px] overflow-hidden group bg-zinc-800"
             style="--card-hover-color:${accent?.hoverColor || '#f2d06f'}">
            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="absolute inset-0 block" aria-hidden="true" tabindex="-1">
                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                     src="${imgUrl}" alt="${article.title}" width="360" height="600" loading="lazy"
                     onerror="this.src='/icons/default-image.png?v=2'">
            </a>
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-linear-to-t from-black/95 via-black/50 to-transparent"></div>
            <div class="absolute inset-x-0 bottom-0 p-[14px] md:p-[20px] flex flex-col gap-[10px]">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                   class="font-condensed font-black uppercase text-[20px] leading-[22px] md:text-[25px] md:leading-[27px] line-clamp-5 text-(--title-color) hover:text-(--card-hover-color) transition-colors duration-300"
                   style="--title-color:${overlay}">${article.title}</a>
                <div class="flex items-center justify-between gap-2">
                    <span class="min-w-0 flex items-center gap-[6px]">
                        <span class="min-w-0 truncate text-[11px] font-condensed font-bold text-white/70">${article.source} · ${timeAgo(article.date)}</span>
                        ${moreSources(article, '#ffffff')}
                    </span>
                    ${shareActions(article, overlay, true)}
                </div>
            </div>
        </div>`;
}

// ─── Layout: carousel ──────────────────────────────────────────────────────────

// Keep in sync with skeletonCarouselLayout() in scripts/build-pages.js.
// Mobile shows ~1.3 cards so the next one peeks in; desktop shows exactly 4.
const CAROUSEL_CARD_WIDTH = 'w-[78%] min-[560px]:w-[46%] lg:w-[calc((100%-48px)/4)]';

function carouselLayout(articles, categoryKey, accent, accentColor) {
    const arrow = (dir, icon, label, side) => `
        <button onclick="scrollCarousel('${categoryKey}', ${dir})" aria-label="${label}"
                class="hidden lg:flex absolute ${side} top-[40%] -translate-y-1/2 z-10 w-[40px] h-[40px] rounded-full bg-zinc-900/90 text-white items-center justify-center shadow-lg hover:bg-[#3749bd] transition-colors cursor-pointer">
            <i class="fa-solid ${icon}"></i>
        </button>`;
    return `
        <div class="gg-container relative">
            <div id="carousel-${categoryKey}" class="no-scrollbar relative flex gap-[16px] overflow-x-auto snap-x snap-mandatory scroll-smooth pt-[10px] pb-[4px]">
                ${articles.map(a => carouselCard(a, accent, accentColor)).join('')}
            </div>
            ${arrow(-1, 'fa-chevron-left', 'Προηγούμενα', 'left-[-6px]')}
            ${arrow(1, 'fa-chevron-right', 'Επόμενα', 'right-[-6px]')}
        </div>`;
}

function carouselCard(article, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png?v=2';
    const timeStr     = timeAgo(article.date);
    const sourceUrl   = article.sourceUrl;
    const cardBg      = accent?.cardBg || '';
    const cardBgClass = cardBg ? '' : 'bg-main-grey';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const titleColor       = accent?.titleColor || '#ffffff';
    const descriptionColor = accent?.descriptionColor || 'rgba(255,255,255,0.8)';

    return `
        <div class="item snap-start shrink-0 ${CAROUSEL_CARD_WIDTH} ${cardBgClass} rounded-[12px] overflow-hidden flex flex-col group"
             style="${bgStyle}--card-hover-color:${accent?.hoverColor || '#f2d06f'}">
            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full aspect-square overflow-hidden rounded-[12px]">
                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110"
                     src="${imgUrl}" alt="${article.title}" width="400" height="235" loading="lazy"
                     onerror="this.src='/icons/default-image.png?v=2'">
            </a>
            <div class="flex flex-col flex-grow pt-[12px] px-[4px]">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                   class="text-[17px] leading-[21px] font-bold font-condensed line-clamp-3 text-(--title-color) hover:text-(--card-hover-color) transition-colors duration-300"
                   style="--title-color:${titleColor}">${article.title}</a>
                <div class="mt-auto pt-[10px] flex flex-wrap items-center justify-between gap-x-2 gap-y-[4px]">
                    <div class="flex items-center gap-[6px] min-w-0">
                        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-[12px] font-condensed font-bold text-(--card-link-color) hover:text-(--card-hover-color) hover:underline whitespace-nowrap"
                           style="--card-link-color:${accentColor}">${article.source}</a>
                        ${moreSources(article, accentColor)}
                        <span class="text-zinc-500 text-[11px]">·</span>
                        <span class="text-[11px] font-condensed whitespace-nowrap" style="color:${titleColor}">${timeStr}</span>
                    </div>
                    ${shareActions(article, titleColor, true)}
                </div>
            </div>
        </div>`;
}

function magazineSideCard(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png?v=2';
    const timeStr     = timeAgo(article.date);
    const sourceUrl   = article.sourceUrl;
    const isHidden    = artIndex >= INITIAL_VISIBLE_COUNT;
    const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';
    const cardBg      = accent?.cardBg || '';
    const cardBgClass = cardBg ? '' : 'bg-main-grey';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const styleAttr   = `style="${bgStyle}--card-hover-color:${accent?.hoverColor || '#f2d06f'}"`;
    const titleColor  = accent?.titleColor || '#ffffff';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden flex flex-row group flex-1 min-h-0 ${hiddenClass}" ${styleAttr}>
            <div class="w-[38%] shrink-0 overflow-hidden">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                         src="${imgUrl}" alt="${article.title}" width="300" height="200" loading="lazy"
                         onerror="this.src='/icons/default-image.png?v=2'">
                </a>
            </div>
            <div class="flex flex-col justify-between flex-1 px-[14px] py-[14px] min-w-0">
                <div class="text-[16px] leading-[20px] font-bold font-condensed line-clamp-4 mb-[8px]" style="color:${titleColor}">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="hover:text-(--card-hover-color) transition-colors duration-300">${article.title}</a>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-[4px]">
                    <div class="flex items-center gap-[6px] min-w-0">
                        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-[11px] font-condensed font-bold text-(--card-link-color) hover:text-(--card-hover-color) hover:underline whitespace-nowrap"
                           style="--card-link-color:${accentColor}">${article.source}</a>
                        ${moreSources(article, accentColor)}
                        <span class="text-zinc-600 text-[11px]">·</span>
                        <span class="text-[11px] font-condensed whitespace-nowrap" style="color:${titleColor}">${timeStr}</span>
                    </div>
                    ${shareActions(article, titleColor, true)}
                </div>
            </div>
        </div>`;
}

function magazineFeatured(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png?v=2';
    const timeStr     = timeAgo(article.date);
    const sourceUrl   = article.sourceUrl;
    const isHidden    = artIndex >= INITIAL_VISIBLE_COUNT;
    const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';
    const cardBg      = accent?.cardBg || '';
    const cardBgClass = cardBg ? '' : 'bg-main-grey';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const styleAttr   = `style="${bgStyle}--card-source-border:${accentColor};--card-hover-color:${accent?.hoverColor || '#f2d06f'}"`;
    const titleColor       = accent?.titleColor || '#ffffff';
    const descriptionColor = accent?.descriptionColor || 'rgba(255,255,255,0.8)';
    const description = article.descriptionText
        ? escapeHtml(article.descriptionText.substring(0, 200)) + '...'
        : 'Διαβάστε περισσότερα για το θέμα στην πηγή.';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden flex flex-col group h-full ${hiddenClass}" ${styleAttr}>
            <div class="w-full aspect-[1.7] overflow-hidden shrink-0">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110"
                         src="${imgUrl}" alt="${article.title}" width="800" height="470" loading="lazy"
                         onerror="this.src='/icons/default-image.png?v=2'">
                </a>
            </div>
            <div class="${accent?.cardPadding === false ? '' : 'p-[20px]'} flex flex-col flex-grow">
                <div class="text-[20px] leading-[24px] font-bold font-condensed pb-[10px]" style="color:${titleColor}">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="hover:text-(--card-hover-color) transition-colors duration-300">${article.title}</a>
                </div>
                <div class="text-[14px] leading-[20px] font-normal font-roboto pb-[16px] flex-grow" style="color:${descriptionColor}">
                    ${description}
                </div>
                <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-[4px] pt-[12px] border-t border-(--card-source-border)">
                    <div class="flex items-center gap-[6px] min-w-0">
                        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                           class="text-[14px] font-condensed font-bold text-(--card-link-color) hover:text-(--card-hover-color) hover:underline whitespace-nowrap"
                           style="--card-link-color:${accentColor}">${article.source}</a>
                        ${moreSources(article, accentColor)}
                        <span class="text-zinc-600 text-[11px]">·</span>
                        <span class="text-[12px] font-condensed whitespace-nowrap" style="color:${titleColor}">${timeStr}</span>
                    </div>
                    ${shareActions(article, titleColor)}
                </div>
            </div>
        </div>`;
}


// ─── Card ──────────────────────────────────────────────────────────────────────

function card(article, artIndex, categoryKey, accent, accentColor, visibleCount = INITIAL_VISIBLE_COUNT) {
    const imgUrl     = article.image || '/icons/default-image.png?v=2';
    const timeStr    = timeAgo(article.date);
    const sourceUrl  = article.sourceUrl;
    const isFeatured = artIndex === 0;
    const isHidden   = artIndex >= visibleCount;

    const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';
    const baseHover   = accent
        ? ''
        : 'hover:border-[#3749bd] hover:shadow-[0_0_20px_rgba(55,73,189,0.3)]';

    const featuredDirection = isFeatured && accent?.featuredReverse ? 'md:flex-row-reverse' : 'md:flex-row';
    const wrapperClasses = isFeatured
        ? `col-span-1 md:col-span-2 lg:col-span-3 flex flex-col ${featuredDirection} group border border-transparent transition-all duration-300 ${baseHover} ${hiddenClass}`
        : `flex flex-col group border border-transparent transition-all duration-300 ${baseHover} ${hiddenClass}`;

    const imageWrapperClasses = isFeatured
        ? 'w-full md:w-6/12 aspect-[1.7] max-h-[280px] md:max-h-[500px] relative shrink-0 overflow-hidden'
        : 'w-full aspect-[1.7] overflow-hidden';

    const paddingClass = accent?.cardPadding === false ? '' : 'p-[20px]';
    const infoWrapperClasses = isFeatured
        ? `${paddingClass} flex flex-col justify-center w-full md:w-6/12`
        : `${paddingClass} flex flex-col flex-grow`;

    const charLimit   = isFeatured ? 350 : 110;
    const cardBg      = accent?.cardBg || '';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const cardBgAttr  = `style="${bgStyle}--card-source-border:${accentColor};--card-hover-color:${accent?.hoverColor || '#f2d06f'}"`;
    const cardBgClass = cardBg ? '' : (accent?.cardClass || 'bg-main-grey');
    const titleColor       = accent?.titleColor || '#ffffff';
    const descriptionColor = accent?.descriptionColor || 'rgba(255,255,255,0.8)';

    const description = article.descriptionText
        ? escapeHtml(article.descriptionText.substring(0, charLimit)) + '...'
        : 'Διαβάστε περισσότερα για το θέμα στην πηγή.';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden ${wrapperClasses}" ${cardBgAttr}>
            <div class="${imageWrapperClasses}">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full cursor-pointer">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110"
                         src="${imgUrl}" alt="${article.title}" width="800" height="470" loading="lazy"
                         onerror="this.src='/icons/default-image.png?v=2'">
                </a>
            </div>
            <div class="${infoWrapperClasses}">
                <div class="title font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[21px] leading-[25px] md:text-[26px] md:leading-[32px]' : 'text-[20px] leading-[26px] min-h-[50px]'}" style="color:${titleColor}">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="hover:text-(--card-hover-color) transition-colors duration-300">${article.title}</a>
                </div>
                <div class="description text-[14px] leading-[20px] font-normal font-roboto pb-[20px] flex-grow" style="color:${descriptionColor}">
                    ${description}
                </div>
                <div class="source text-[16px] leading-[14px] font-bold font-condensed pb-[20px] border-b border-(--card-source-border)" style="color:${titleColor}">
                    Πηγή: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                              class="text-(--card-link-color) hover:text-(--card-hover-color) hover:underline transition-colors"
                              style="--card-link-color:${accentColor}">${article.source}</a>
                    ${moreSources(article, accentColor)}
                </div>
                <div class="card-footer flex items-center justify-between pt-[20px]">
                    <div class="time text-[14px] leading-[16px] font-bold font-condensed" style="color:${titleColor}">${timeStr}</div>
                    ${shareActions(article, titleColor)}
                </div>
            </div>
        </div>`;
}

// ─── "+N πηγές" ────────────────────────────────────────────────────────────────

function moreSources(article, color) {
    if (!article.relatedCount) return '';
    const n = article.relatedCount;
    return `<button type="button" onclick="showSources(this)" data-sources="${article.relatedJson}"
                    title="Το ίδιο θέμα και από άλλες πηγές" aria-label="Δες ${n} ακόμα ${n === 1 ? 'πηγή' : 'πηγές'}"
                    class="more-sources shrink-0 whitespace-nowrap cursor-pointer rounded-full border px-[6px] py-[1px] text-[10px] leading-[14px] font-condensed font-bold opacity-80 hover:opacity-100 transition-opacity"
                    style="color:${color};border-color:${color}">+${n} ${n === 1 ? 'πηγή' : 'πηγές'}</button>`;
}

// ─── Share buttons ─────────────────────────────────────────────────────────────

// The "μέσω captainnews.gr" line is what brings recipients back to the site,
// since there are no per-article pages of our own to link to.
function shareButtons(article, color) {
    const text = encodeURIComponent(article.shareText);
    // 34×36 tap target around an 18px icon; the negative margin keeps the
    // card footer the same height as before.
    const cls  = 'share-btn inline-flex items-center justify-center w-[34px] h-[36px] -my-[10px] text-[18px] leading-none text-(--card-link-color) hover:text-(--card-hover-color) transition-all';
    return `
        <span class="flex items-center">
            <a href="https://wa.me/?text=${text}" target="_blank" rel="noopener noreferrer"
               title="Κοινοποίηση στο WhatsApp" aria-label="Κοινοποίηση στο WhatsApp"
               class="${cls}" style="--card-link-color:${color}"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="viber://forward?text=${text}"
               title="Κοινοποίηση στο Viber" aria-label="Κοινοποίηση στο Viber"
               class="${cls}" style="--card-link-color:${color}"><i class="fa-brands fa-viber"></i></a>
        </span>`;
}

// compact: icon-only COPY for narrow cards. The label stays in the DOM (sr-only)
// because window.copyArticleLink in main.js swaps its text to "COPIED!".
function copyButton(article, color, compact = false) {
    const label = compact ? 'copy-label sr-only' : 'copy-label';
    const size  = compact ? 'w-[34px] h-[36px] -my-[10px] justify-center' : 'gap-1';
    return `
        <button data-link="${article.link}" onclick="copyArticleLink(this)"
                title="Αντιγραφή συνδέσμου" aria-label="Αντιγραφή συνδέσμου"
                class="copy-btn inline-flex items-center ${size} text-[12px] leading-[14px] font-bold font-condensed text-(--card-link-color) hover:text-(--card-hover-color) transition-all cursor-pointer"
                style="--card-link-color:${color}">
            <svg xmlns="http://www.w3.org/2000/svg" class="copy-icon ${compact ? 'w-[16px] h-[16px]' : 'w-[13px] h-[13px]'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="${label}">COPY</span>
        </button>`;
}

function shareActions(article, color, compact = false) {
    return `<div class="flex items-center ${compact ? '' : 'gap-3'} shrink-0 ml-auto">${shareButtons(article, color)}${copyButton(article, color, compact)}</div>`;
}

// ─── Load more button ──────────────────────────────────────────────────────────

function loadMoreBtn(categoryKey, totalArticles, visibleCount) {
    if (totalArticles <= visibleCount) return '';
    return `
        <div class="gg-container flex justify-center mt-6 pb-10">
            <button id="btn-${categoryKey}" onclick="loadAllArticles('${categoryKey}')"
                    class="bg-zinc-800 cursor-pointer text-white font-condensed font-bold py-2 px-6 rounded hover:bg-[#3749bd] transition-colors border border-zinc-700 hover:border-[#3749bd]">
                ΠΡΟΒΟΛΗ ΟΛΩΝ (${totalArticles})
            </button>
        </div>`;
}
