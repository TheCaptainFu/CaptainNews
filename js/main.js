/**
 * CaptainNews.gr - Main News Loader
 */

const categoryDisplayNames = {
    "greece_news": "ΕΛΛΑΔΑ ΕΠΙΚΑΙΡΟΤΗΤΑ",
    "politics_greece": "ΠΟΛΙΤΙΚΑ ΕΛΛΑΔΑ",
    "world_politics": "ΠΑΓΚΟΣΜΙΑ ΠΟΛΙΤΙΚΗ",
    "sports": "ΑΘΛΗΤΙΚΑ",
    "technology": "ΤΕΧΝΟΛΟΓΙΑ",
    "music": "ΜΟΥΣΙΚΗ"
};

const sourceUrls = {
    "Newsit": "https://www.newsit.gr",
    "Kathimerini": "https://www.kathimerini.gr",
    "In.gr": "https://www.in.gr",
    "Macropolis": "https://www.macropolis.gr",
    "Gazzetta": "https://www.gazzetta.gr",
    "Sport24": "https://www.sport24.gr",
    "Contra": "https://www.contra.gr",
    "SDNA": "https://www.sdna.gr",
    "Insomnia": "https://www.insomnia.gr",
    "The Verge": "https://www.theverge.com",
    "TechCrunch": "https://techcrunch.com",
    "Wired": "https://www.wired.com",
    "Pitchfork": "https://pitchfork.com",
    "Rolling Stone": "https://www.rollingstone.com",
    "Billboard": "https://www.billboard.com",
    "Resident Advisor": "https://ra.co",
    "Reuters": "https://www.reuters.com",
    "BBC World": "https://www.bbc.com/news/world",
    "The Guardian": "https://www.theguardian.com",
    "Politico": "https://www.politico.eu",
    "Protothema": "https://www.protothema.gr",
    "Newsbeast": "https://www.newsbeast.gr",
    "Thetoc": "https://www.thetoc.gr",
    "Iefimerida": "https://www.iefimerida.gr",
    "Skai": "https://www.skai.gr",
    "Ant1": "https://www.ant1news.gr",
    "ABC Intl": "https://abcnews.go.com",
    "The Hill": "https://thehill.com",
    "VOA News": "https://www.voanews.com",
    "In.gr World": "https://www.in.gr",
    "BBC Sport": "https://www.bbc.com/sport",
    "BBC Tech": "https://www.bbc.com/news/technology",
    "ESPN": "https://www.espn.com",
    "Digitallife": "https://www.digitallife.gr",
    "Pcsteps": "https://www.pcsteps.gr",
    "Techgear": "https://www.techgear.gr",
    "Youfly": "https://www.youfly.gr",
    "In.gr Music": "https://www.in.gr",
    "Skai Music": "https://www.skai.gr",
    "Newsbomb Music": "https://www.newsbomb.gr",
    "Musicfollow": "https://musicfollow.gr",
    "Sky Sports": "https://www.skysports.com",
    "Hacker News": "https://news.ycombinator.com"
};

const WORKER_URL = 'https://captainnews-worker.g-gsmks.workers.dev';
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const INITIAL_VISIBLE_COUNT = 7;

const categoryAccents = {
    sports: { color: '#16a34a', cardClass: 'card-sports' },
    music:  { color: '#7c3aed', cardClass: 'card-music'  },
};

async function loadNews() {
    // Guard: only run on pages that have the news wrapper
    const mainWrapper = document.getElementById('main-content-wrapper');
    if (!mainWrapper) return;

    try {
        const url = IS_LOCAL ? '/news.json?t=' + new Date().getTime() : WORKER_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load news');
        
        const data = await response.json();
        mainWrapper.innerHTML = '';

        const categories = Object.entries(data);

        categories.forEach(([categoryKey, articles], index) => {

            const readableTitle = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
            const marginTopClass = 'mt-[20px]';
            const totalArticles = articles.length;

            const categorySection = document.createElement('section');
            categorySection.id = `section-${categoryKey}`;
            categorySection.className = `category-group mb-10`;
            categorySection.setAttribute('data-category', categoryKey);

            const accent = categoryAccents[categoryKey];
            const accentColor = accent ? accent.color : '#4f72ff';

            if (accent) {
                const hex = accent.color.replace('#', '');
                const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
                categorySection.style.background = `linear-gradient(to right, rgba(${r},${g},${b},0.07) 0%, transparent 55%)`;
                categorySection.style.borderLeft = `3px solid rgba(${r},${g},${b},0.35)`;
                categorySection.style.paddingLeft = '6px';
            }

            let categoryHTML = `
                <div class="gg-container ${marginTopClass} section-header">
                    <div class="w-full">
                        <div class="flex items-baseline justify-between pb-[8px]">
                            <h2 class="text-[22px] leading-[22px] md:text-[28px] md:leading-[28px] lg:text-[36px] lg:leading-[36px] font-bold font-condensed uppercase" style="color:${accentColor}">${readableTitle}</h2>
                            <span class="text-[13px] font-bold font-condensed whitespace-nowrap" style="color:${accentColor}aa">${totalArticles} ΑΡΘΡΑ</span>
                        </div>
                        <div class="h-[3px] w-full rounded-full" style="background: linear-gradient(to right, ${accentColor}, transparent)"></div>
                    </div>
                </div>
                <div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">
            `;

            articles.forEach((article, artIndex) => {
                const imgUrl = article.image || '/icons/default-image.png';
                const timeStr = timeAgo(article.date);
                const sourceHomepage = sourceUrls[article.source] || "#";
                const isFeatured = artIndex === 0;

                const isHidden = artIndex >= INITIAL_VISIBLE_COUNT;
                const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';

                const baseHover = accent
                    ? ''
                    : 'hover:border-[#3749bd] hover:shadow-[0_0_20px_rgba(55,73,189,0.3)]';
                const wrapperClasses = isFeatured
                    ? `col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row group border border-transparent transition-all duration-300 ${baseHover} ${hiddenClass}`
                    : `flex flex-col group border border-transparent transition-all duration-300 ${baseHover} ${hiddenClass}`;

                // Mobile-friendly max-height for featured image
                const imageWrapperClasses = isFeatured
                    ? "w-full md:w-6/12 aspect-[1.7] max-h-[280px] md:max-h-[500px] relative shrink-0 overflow-hidden"
                    : "w-full aspect-[1.7] overflow-hidden";

                const infoWrapperClasses = isFeatured
                    ? "p-[20px] flex flex-col justify-center w-full md:w-6/12"
                    : "p-[20px] flex flex-col flex-grow";

                const charLimit = isFeatured ? 350 : 110;

                categoryHTML += `
                    <div class="item ${accent ? accent.cardClass : 'bg-main-grey'} rounded-[12px] overflow-hidden ${wrapperClasses}">
                        <div class="${imageWrapperClasses}">
                            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="block w-full h-full cursor-pointer">
                                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                     src="${imgUrl}"
                                     alt="${article.title}"
                                     loading="lazy"
                                     onerror="this.src='/icons/default-image.png'">
                            </a>
                        </div>
                        <div class="${infoWrapperClasses}">
                            <div class="title text-[16px] leading-[20px] text-white font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[22px] leading-[26px]' : 'min-h-[50px]'}">
                                <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="hover:text-[#f2d06f] transition-colors duration-300">
                                    ${article.title}
                                </a>
                            </div>
                            <div class="description text-[14px] leading-[20px] text-white font-normal font-roboto pb-[20px] opacity-80 flex-grow">
                                ${article.description ? stripHtml(article.description).substring(0, charLimit) + '...' : 'Διαβάστε περισσότερα για το θέμα στην πηγή.'}
                            </div>
                            <div class="source text-[16px] leading-[14px] text-white font-bold font-condensed pb-[20px] border-b border-zinc-800">
                                Πηγή: <a href="${sourceHomepage}" target="_blank" rel="noopener noreferrer" class="hover:text-[#f2d06f] hover:underline transition-colors" style="color:${accentColor}">${article.source}</a>
                            </div>
                            <div class="card-footer flex items-center justify-between pt-[20px]">
                                <div class="time text-[14px] leading-[16px] text-white font-bold font-condensed">${timeStr}</div>
                                <div class="flex items-center gap-3">
                                    <button onclick="copyArticleLink(this, '${article.link}')" title="Αντιγραφή συνδέσμου" class="copy-btn flex items-center gap-1 text-[12px] leading-[14px] font-bold font-condensed text-zinc-500 hover:text-[#f2d06f] transition-all cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="copy-icon w-[13px] h-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                        <span class="copy-label">COPY</span>
                                    </button>
                                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="read-more text-[12px] leading-[14px] font-bold font-condensed hover:text-[#f2d06f] transition-all" style="color:${accentColor}">
                                        Διαβάστε ->
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            categoryHTML += `</div>`;

            if (totalArticles > INITIAL_VISIBLE_COUNT) {
                categoryHTML += `
                    <div class="gg-container flex justify-center mt-6">
                        <button id="btn-${categoryKey}" onclick="loadAllArticles('${categoryKey}')" class="bg-zinc-800 cursor-pointer text-white font-condensed font-bold py-2 px-6 rounded hover:bg-[#3749bd] transition-colors border border-zinc-700 hover:border-[#3749bd]">
                            ΠΡΟΒΟΛΗ ΟΛΩΝ (${totalArticles})
                        </button>
                    </div>
                `;
            }

            categorySection.innerHTML = categoryHTML;
            mainWrapper.appendChild(categorySection);
        });

        setupFilterLogic();
        populateTicker(data);

    } catch (error) {
        console.error("Error:", error);
        mainWrapper.innerHTML = `<div class="gg-container text-white text-center pt-10">Σφάλμα φόρτωσης.</div>`;
    }
}

// --- TICKER ---
function populateTicker(data) {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    let headlines = [];
    for (const articles of Object.values(data)) {
        headlines = headlines.concat(articles.slice(0, 4));
    }
    headlines.sort((a, b) => new Date(b.date) - new Date(a.date));
    headlines = headlines.slice(0, 24);

    const sep = '<span class="text-zinc-700 mx-6 select-none">⚓</span>';
    const items = headlines.map(a =>
        `<a href="${a.link}" target="_blank" rel="noopener noreferrer"
            class="text-zinc-300 hover:text-[#f2d06f] text-[11px] font-condensed font-bold uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap">
            ${a.title}
         </a>`
    ).join(sep);

    // Duplicate for seamless loop
    ticker.innerHTML = items + sep + items;
}

// --- FILTER LOGIC ---
function setupFilterLogic() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    const pills = filterContainer.querySelectorAll('.filter-pill');

    function applyFilter(selected) {
        // Update active pill
        pills.forEach(p => {
            if (p.getAttribute('data-category') === selected) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        // Show/hide sections
        const allSections = document.querySelectorAll('.category-group');
        allSections.forEach(section => {
            const category = section.getAttribute('data-category');
            if (selected === 'all' || category === selected) {
                section.style.display = 'block';
                const header = section.querySelector('.section-header');
                if (header) header.classList.add('mt-[40px]');
            } else {
                section.style.display = 'none';
            }
        });

        // Remove top margin from first visible section
        const visibleSections = Array.from(allSections).filter(s => s.style.display !== 'none');
        if (visibleSections.length > 0) {
            const firstHeader = visibleSections[0].querySelector('.section-header');
            if (firstHeader) firstHeader.classList.remove('mt-[40px]');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    pills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault();
            applyFilter(pill.getAttribute('data-category'));
        });
    });

    // Apply default on load — category pages set data-category on body
    const defaultCategory = document.body.dataset.category || 'all';
    applyFilter(defaultCategory);
}

// --- SIDEBAR MENU LOGIC ---
const burgerBtn = document.getElementById('burger-btn');
const sidebarMenu = document.getElementById('sidebar-menu');
const menuOverlay = document.getElementById('menu-overlay');
const closeSidebar = document.getElementById('close-sidebar');

function openSidebar() {
    if (sidebarMenu && menuOverlay) {
        sidebarMenu.classList.remove('translate-x-full');
        menuOverlay.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebarFn() {
    if (sidebarMenu && menuOverlay) {
        sidebarMenu.classList.add('translate-x-full');
        menuOverlay.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }
}

if (burgerBtn) {
    burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar();
    });
}

if (closeSidebar) {
    closeSidebar.addEventListener('click', closeSidebarFn);
}

if (menuOverlay) {
    menuOverlay.addEventListener('click', closeSidebarFn);
}

// Close on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebarFn();
});

// --- HELPER FUNCTIONS ---
window.copyArticleLink = function(btn, url) {
    navigator.clipboard.writeText(url).then(() => {
        const label = btn.querySelector('.copy-label');
        const icon = btn.querySelector('.copy-icon');

        // Switch to checkmark icon
        icon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        label.textContent = 'COPIED!';
        btn.classList.add('text-[#f2d06f]');
        btn.classList.remove('text-zinc-500');

        setTimeout(() => {
            icon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
            label.textContent = 'COPY';
            btn.classList.remove('text-[#f2d06f]');
            btn.classList.add('text-zinc-500');
        }, 2000);
    });
};

window.loadAllArticles = function(categoryKey) {
    const hiddenItems = document.querySelectorAll(`.hidden-item-${categoryKey}`);
    hiddenItems.forEach(item => item.classList.remove('hidden'));
    const btn = document.getElementById(`btn-${categoryKey}`);
    if (btn) btn.remove();
};

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function timeAgo(dateString) {
    if (!dateString) return "Άγνωστη ημερομηνία";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Άγνωστη ημερομηνία";

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return "Πριν από " + interval + (interval === 1 ? " χρόνο" : " χρόνια");
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return "Πριν από " + interval + (interval === 1 ? " μήνα" : " μήνες");
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return "Πριν από " + interval + (interval === 1 ? " μέρα" : " μέρες");
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return "Πριν από " + interval + (interval === 1 ? " ώρα" : " ώρες");
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return "Πριν από " + interval + (interval === 1 ? " λεπτό" : " λεπτά");
    return "Μόλις τώρα";
}

// --- TICKER SCROLL HIDE/SHOW ---
(function () {
    let lastY = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y <= 10) {
            document.body.classList.remove('ticker-hidden');
        } else if (y > lastY + 5) {
            document.body.classList.add('ticker-hidden');
        } else if (y < lastY - 5) {
            document.body.classList.remove('ticker-hidden');
        }
        lastY = y;
    }, { passive: true });
})();

document.addEventListener('DOMContentLoaded', loadNews);