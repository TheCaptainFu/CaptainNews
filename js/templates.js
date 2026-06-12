import { categoryDisplayNames, categoryAccents, sourceUrls, INITIAL_VISIBLE_COUNT } from './config.js';
import { stripHtml, timeAgo } from './utils.js';

// ─── Public: builds a complete <section> DOM element for one category ──────────

export function buildSection(categoryKey, articles) {
    const accent      = categoryAccents[categoryKey];
    const accentColor = accent?.color || '#4f72ff';
    const title       = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();

    const section = document.createElement('section');
    section.id        = `section-${categoryKey}`;
    section.className = 'category-group mb-10';
    section.setAttribute('data-category', categoryKey);

    if (accent?.sectionBgImage) {
        section.style.backgroundImage    = `url('${accent.sectionBgImage}')`;
        section.style.backgroundSize     = 'cover';
        section.style.backgroundPosition = 'center';
        section.style.backgroundRepeat   = 'no-repeat';
        section.style.borderRadius       = '12px';
        section.style.padding            = '12px 0 20px';
        section.style.marginTop          = '32px';
    } else if (accent?.sectionBg) {
        section.style.backgroundColor = accent.sectionBg;
        section.style.borderRadius    = '12px';
        section.style.padding         = '12px 0 20px';
        section.style.marginTop       = '32px';
    }

    section.innerHTML =
        sectionHeader(title, articles.length, accentColor, accent) +
        `<div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">` +
        articles.map((article, i) => card(article, i, categoryKey, accent, accentColor)).join('') +
        `</div>` +
        loadMoreBtn(categoryKey, articles.length);

    return section;
}

// ─── Section heading + gradient line ──────────────────────────────────────────

function sectionHeader(title, count, accentColor, accent) {
    const newBadge = accent?.isNew
        ? `<span class="shrink-0 self-center ml-1 bg-[#f59e0b] text-black text-[10px] font-bold px-2 py-[3px] rounded-full uppercase tracking-widest animate-pulse">NEW</span>`
        : '';
    return `
        <div class="gg-container mt-[20px] section-header">
            <div class="w-full">
                <div class="flex items-end gap-[20px] pb-[8px]">
                    <div class="shrink-0 flex items-center gap-2">
                        <h2 class="whitespace-nowrap font-bold font-condensed uppercase text-[22px] leading-[24px] min-[420px]:text-[26px] min-[420px]:leading-[28px] min-[767px]:text-[36px] min-[767px]:leading-[38px] min-[1024px]:text-[44px] min-[1024px]:leading-[46px] min-[1420px]:text-[52px] min-[1420px]:leading-[54px]"
                            style="color:${accentColor}">${title}</h2>
                        ${newBadge}
                    </div>
                    <div class="h-[3px] flex-1 rounded-full mb-[5px]"
                         style="background: linear-gradient(to right, ${accentColor}, transparent)"></div>
                    <span class="shrink-0 whitespace-nowrap text-[13px] font-bold font-condensed"
                          style="color:${accentColor}88">${count} ΑΡΘΡΑ</span>
                </div>
            </div>
        </div>`;
}

// ─── Single article card ───────────────────────────────────────────────────────

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

    const infoWrapperClasses = isFeatured
        ? 'p-[20px] flex flex-col justify-center w-full md:w-6/12'
        : 'p-[20px] flex flex-col flex-grow';

    const charLimit   = isFeatured ? 350 : 110;
    const cardBg      = accent?.cardBg || '';
    const cardBgAttr  = cardBg ? `style="background-color:${cardBg}"` : '';
    const cardBgClass = cardBg ? '' : (accent?.cardClass || 'bg-main-grey');

    const description = article.description
        ? stripHtml(article.description).substring(0, charLimit) + '...'
        : 'Διαβάστε περισσότερα για το θέμα στην πηγή.';

    return `
        <div class="item ${cardBgClass} rounded-[12px] overflow-hidden ${wrapperClasses}" ${cardBgAttr}>
            <div class="${imageWrapperClasses}">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full cursor-pointer">
                    <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                         src="${imgUrl}" alt="${article.title}" loading="lazy"
                         onerror="this.src='/icons/default-image.png'">
                </a>
            </div>
            <div class="${infoWrapperClasses}">
                <div class="title text-[16px] leading-[20px] text-white font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[22px] leading-[26px]' : 'min-h-[50px]'}">
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                       class="hover:text-[#f2d06f] transition-colors duration-300">${article.title}</a>
                </div>
                <div class="description text-[14px] leading-[20px] text-white font-normal font-roboto pb-[20px] opacity-80 flex-grow">
                    ${description}
                </div>
                <div class="source text-[16px] leading-[14px] text-white font-bold font-condensed pb-[20px] border-b border-zinc-800">
                    Πηγή: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer"
                              class="hover:text-[#f2d06f] hover:underline transition-colors"
                              style="color:${accentColor}">${article.source}</a>
                </div>
                <div class="card-footer flex items-center justify-between pt-[20px]">
                    <div class="time text-[14px] leading-[16px] text-white font-bold font-condensed">${timeStr}</div>
                    <div class="flex items-center gap-3">
                        <button onclick="copyArticleLink(this, '${article.link}')"
                                title="Αντιγραφή συνδέσμου"
                                class="copy-btn flex items-center gap-1 text-[12px] leading-[14px] font-bold font-condensed text-zinc-500 hover:text-[#f2d06f] transition-all cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" class="copy-icon w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span class="copy-label">COPY</span>
                        </button>
                        <a href="${article.link}" target="_blank" rel="noopener noreferrer"
                           class="read-more text-[12px] leading-[14px] font-bold font-condensed hover:text-[#f2d06f] transition-all"
                           style="color:${accentColor}">Διαβάστε -></a>
                    </div>
                </div>
            </div>
        </div>`;
}

// ─── "Show all" button ─────────────────────────────────────────────────────────

function loadMoreBtn(categoryKey, totalArticles) {
    if (totalArticles <= INITIAL_VISIBLE_COUNT) return '';
    return `
        <div class="gg-container flex justify-center mt-6">
            <button id="btn-${categoryKey}" onclick="loadAllArticles('${categoryKey}')"
                    class="bg-zinc-800 cursor-pointer text-white font-condensed font-bold py-2 px-6 rounded hover:bg-[#3749bd] transition-colors border border-zinc-700 hover:border-[#3749bd]">
                ΠΡΟΒΟΛΗ ΟΛΩΝ (${totalArticles})
            </button>
        </div>`;
}
