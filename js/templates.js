// ─── Imports ───────────────────────────────────────────────────────────────────

import { categoryDisplayNames, categoryAccents, sourceUrls, INITIAL_VISIBLE_COUNT } from './config.js?v=27';
import { stripHtml, timeAgo } from './utils.js?v=27';

// ─── Public API ────────────────────────────────────────────────────────────────

export function buildSection(categoryKey, articles) {
    const accent      = categoryAccents[categoryKey];
    const accentColor = accent?.color || '#4f72ff';
    const title       = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
    const layout      = (accent?.sectionLayout || 'default').trim();

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
        case 'list':     body = listLayout(articles, categoryKey, accent, accentColor); break;
        default:         body = defaultLayout(articles, categoryKey, accent, accentColor);
    }

    const content = header + body + loadMoreBtn(categoryKey, articles.length);

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
                        <h2 class="whitespace-nowrap font-black font-condensed uppercase text-[22px] leading-[24px] min-[420px]:text-[26px] min-[420px]:leading-[28px] min-[767px]:text-[36px] min-[767px]:leading-[38px] min-[1024px]:text-[44px] min-[1024px]:leading-[46px] min-[1420px]:text-[52px] min-[1420px]:leading-[54px]"
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

// ─── Layout: list ──────────────────────────────────────────────────────────────

function listLayout(articles, categoryKey, accent, accentColor) {
    return `<div class="gg-container flex flex-col gap-[10px] pt-[10px]">` +
        articles.map((a, i) => listItem(a, i, categoryKey, accent, accentColor)).join('') +
        `</div>`;
}

function listItem(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png';
    const timeStr     = timeAgo(article.date);
    const isHidden    = artIndex >= INITIAL_VISIBLE_COUNT;
    const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';
    const cardBg      = accent?.cardBg || '';
    const cardBgClass = cardBg ? '' : 'bg-main-grey';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const titleColor  = accent?.titleColor || '#ffffff';
    const styleAttr   = `style="${bgStyle}--card-hover-color:${accent?.hoverColor || '#f2d06f'};--list-title-color:${titleColor}"`;

    return `
        <a href="${article.link}" target="_blank" rel="noopener noreferrer"
           class="list-item ${cardBgClass} flex items-center gap-[14px] p-[10px] rounded-[10px] group transition-colors duration-300 ${hiddenClass}" ${styleAttr}>
            <div class="w-[110px] h-[70px] shrink-0 overflow-hidden rounded-[8px]">
                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                     src="${imgUrl}" alt="${article.title}" width="110" height="70" loading="lazy"
                     onerror="this.src='/icons/default-image.png'">
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-[15px] leading-[19px] font-bold font-condensed line-clamp-2 text-(--list-title-color) group-hover:text-(--card-hover-color) transition-colors duration-300">
                    ${article.title}
                </div>
                <div class="flex items-center gap-[8px] mt-[6px]">
                    <span class="text-[12px] font-condensed font-bold" style="color:${accentColor}">${article.source}</span>
                    <span class="text-zinc-600 text-[11px]">·</span>
                    <span class="text-[11px] font-condensed text-(--list-title-color)">${timeStr}</span>
                </div>
            </div>
        </a>`;
}

function magazineSideCard(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png';
    const timeStr     = timeAgo(article.date);
    const sourceUrl   = sourceUrls[article.source] || '#';
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
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                         src="${imgUrl}" alt="${article.title}" width="300" height="200" loading="lazy"
                         onerror="this.src='/icons/default-image.png'">
                </a>
            </div>
            <div class="flex flex-col justify-between flex-1 px-[14px] py-[14px] min-w-0">
                <div class="text-[16px] leading-[20px] font-bold font-condensed line-clamp-4 mb-[8px]" style="color:${titleColor}">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="hover:text-(--card-hover-color) transition-colors duration-300">${article.title}</a>
                </div>
                <div class="flex items-center gap-[6px]">
                    <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                       class="text-[11px] font-condensed font-bold text-(--card-link-color) hover:text-(--card-hover-color) hover:underline shrink-0"
                       style="--card-link-color:${accentColor}">${article.source}</a>
                    <span class="text-zinc-600 text-[11px]">·</span>
                    <span class="text-[11px] font-condensed shrink-0" style="color:${titleColor}">${timeStr}</span>
                </div>
            </div>
        </div>`;
}

function magazineFeatured(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl      = article.image || '/icons/default-image.png';
    const timeStr     = timeAgo(article.date);
    const sourceUrl   = sourceUrls[article.source] || '#';
    const isHidden    = artIndex >= INITIAL_VISIBLE_COUNT;
    const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';
    const cardBg      = accent?.cardBg || '';
    const cardBgClass = cardBg ? '' : 'bg-main-grey';
    const bgStyle     = cardBg ? `background-color:${cardBg};` : '';
    const styleAttr   = `style="${bgStyle}--card-source-border:${accentColor};--card-hover-color:${accent?.hoverColor || '#f2d06f'}"`;
    const titleColor       = accent?.titleColor || '#ffffff';
    const descriptionColor = accent?.descriptionColor || 'rgba(255,255,255,0.8)';
    const description = article.description
        ? stripHtml(article.description).substring(0, 200) + '...'
        : 'Διαβάστε περισσότερα για το θέμα στην πηγή.';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden flex flex-col group h-full ${hiddenClass}" ${styleAttr}>
            <div class="w-full aspect-[1.7] overflow-hidden shrink-0">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                         src="${imgUrl}" alt="${article.title}" width="800" height="470" loading="lazy"
                         onerror="this.src='/icons/default-image.png'">
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
                <div class="flex items-center justify-between pt-[12px] border-t border-(--card-source-border)">
                    <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                       class="text-[14px] font-condensed font-bold text-(--card-link-color) hover:text-(--card-hover-color) hover:underline"
                       style="--card-link-color:${accentColor}">${article.source}</a>
                    <span class="text-[12px] font-condensed" style="color:${titleColor}">${timeStr}</span>
                </div>
            </div>
        </div>`;
}


// ─── Card ──────────────────────────────────────────────────────────────────────

function card(article, artIndex, categoryKey, accent, accentColor) {
    const imgUrl     = article.image || '/icons/default-image.png';
    const timeStr    = timeAgo(article.date);
    const sourceUrl  = sourceUrls[article.source] || '#';
    const isFeatured = artIndex === 0;
    const isHidden   = artIndex >= INITIAL_VISIBLE_COUNT;

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

    const description = article.description
        ? stripHtml(article.description).substring(0, charLimit) + '...'
        : 'Διαβάστε περισσότερα για το θέμα στην πηγή.';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden ${wrapperClasses}" ${cardBgAttr}>
            <div class="${imageWrapperClasses}">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full cursor-pointer">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                         src="${imgUrl}" alt="${article.title}" width="800" height="470" loading="lazy"
                         onerror="this.src='/icons/default-image.png'">
                </a>
            </div>
            <div class="${infoWrapperClasses}">
                <div class="title text-[20px] leading-[26px] font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[26px] leading-[32px]' : 'min-h-[50px]'}" style="color:${titleColor}">
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
                </div>
                <div class="card-footer flex items-center justify-between pt-[20px]">
                    <div class="time text-[14px] leading-[16px] font-bold font-condensed" style="color:${titleColor}">${timeStr}</div>
                    <div class="flex items-center gap-3">
                        <button onclick="copyArticleLink(this, '${article.link}')"
                                title="Αντιγραφή συνδέσμου"
                                class="copy-btn flex items-center gap-1 text-[12px] leading-[14px] font-bold font-condensed text-(--card-link-color) hover:text-(--card-hover-color) transition-all cursor-pointer"
                                style="--card-link-color:${descriptionColor}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="copy-icon w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span class="copy-label">COPY</span>
                        </button>
                        <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                           class="read-more text-[12px] leading-[14px] font-bold font-condensed text-(--card-link-color) hover:text-(--card-hover-color) transition-all"
                           style="--card-link-color:${accentColor}">Διαβάστε -></a>
                    </div>
                </div>
            </div>
        </div>`;
}

// ─── Load more button ──────────────────────────────────────────────────────────

function loadMoreBtn(categoryKey, totalArticles) {
    if (totalArticles <= INITIAL_VISIBLE_COUNT) return '';
    return `
        <div class="gg-container flex justify-center mt-6 pb-10">
            <button id="btn-${categoryKey}" onclick="loadAllArticles('${categoryKey}')"
                    class="bg-zinc-800 cursor-pointer text-white font-condensed font-bold py-2 px-6 rounded hover:bg-[#3749bd] transition-colors border border-zinc-700 hover:border-[#3749bd]">
                ΠΡΟΒΟΛΗ ΟΛΩΝ (${totalArticles})
            </button>
        </div>`;
}
