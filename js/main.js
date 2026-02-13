/**
 * CaptainNews.gr - Main News Loader
 */

const categoryDisplayNames = {
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
    "Politico": "https://www.politico.eu"
};

const INITIAL_VISIBLE_COUNT = 7;

async function loadNews() {
    try {
        const response = await fetch('news.json?t=' + new Date().getTime()); 
        if (!response.ok) throw new Error('Failed to load news');
        
        const data = await response.json();
        const mainWrapper = document.getElementById('main-content-wrapper');
        mainWrapper.innerHTML = '';

        const categories = Object.entries(data);

        categories.forEach(([categoryKey, articles], catIndex) => {
            
            const readableTitle = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
            // Default margin logic (we handle filtering margin via CSS/JS later)
            const marginTopClass = 'mt-[40px]'; 
            const totalArticles = articles.length;

            // Added ID to section for filtering
            const categorySection = document.createElement('section');
            categorySection.id = `section-${categoryKey}`; 
            categorySection.className = `category-group mb-10`;
            // Add custom attribute to identify category
            categorySection.setAttribute('data-category', categoryKey);

            let categoryHTML = `
                <div class="gg-container ${marginTopClass} section-header">
                    <div class="title flex items-center justify-between w-full border-b border-zinc-800 pb-[5px]">
                        <div class="flex items-center gap-[5px]">
                            <h2 class="text-[24px] leading-[28px] font-bold text-[#3749bd] font-condensed uppercase">${readableTitle}</h2>
                        </div>
                        <div class="count text-[14px] font-bold text-zinc-500 font-condensed">
                            ${totalArticles} ΑΡΘΡΑ
                        </div>
                    </div>
                </div>
                <div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">
            `;

            articles.forEach((article, artIndex) => {
                const imgUrl = article.image || '/icons/test.avif';
                const timeStr = timeAgo(article.date);
                const sourceHomepage = sourceUrls[article.source] || "#";
                const isFeatured = artIndex === 0;

                const isHidden = artIndex >= INITIAL_VISIBLE_COUNT;
                const hiddenClass = isHidden ? `hidden hidden-item-${categoryKey}` : '';

                const wrapperClasses = isFeatured 
                    ? `col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row group border border-transparent transition-all duration-300 hover:border-[#3749bd] hover:shadow-[0_0_20px_rgba(55,73,189,0.3)] ${hiddenClass}`
                    : `flex flex-col group border border-transparent transition-all duration-300 hover:border-[#3749bd] hover:shadow-[0_0_20px_rgba(55,73,189,0.3)] ${hiddenClass}`;

                const imageWrapperClasses = isFeatured
                    ? "w-full md:w-6/12 aspect-[1.7] max-h-[500px] relative shrink-0 overflow-hidden"
                    : "w-full aspect-[1.7] overflow-hidden";

                const infoWrapperClasses = isFeatured
                    ? "p-[20px] flex flex-col justify-center w-full md:w-6/12"
                    : "p-[20px] flex flex-col flex-grow";

                const charLimit = isFeatured ? 350 : 110;

                categoryHTML += `
                    <div class="item bg-main-grey rounded-[12px] overflow-hidden ${wrapperClasses}">
                        <div class="${imageWrapperClasses}">
                            <a href="${article.link}" target="_blank" class="block w-full h-full cursor-pointer">
                                <img class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110" 
                                     src="${imgUrl}" 
                                     alt="${article.title}" 
                                     onerror="this.src='/icons/test.avif'">
                            </a>
                        </div>
                        <div class="${infoWrapperClasses}">
                            <div class="title text-[16px] leading-[20px] text-white font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[22px] leading-[26px]' : 'min-h-[50px]'}">
                                <a href="${article.link}" target="_blank" class="hover:text-[#f2d06f] transition-colors duration-300">
                                    ${article.title}
                                </a>
                            </div>
                            <div class="description text-[14px] leading-[20px] text-white font-normal font-roboto pb-[20px] opacity-80 flex-grow">
                                ${article.description ? stripHtml(article.description).substring(0, charLimit) + '...' : 'Διαβάστε περισσότερα για το θέμα στην πηγή.'}
                            </div>
                            <div class="source text-[16px] leading-[14px] text-white font-bold font-condensed pb-[20px] border-b border-zinc-800">
                                Πηγή: <a href="${sourceHomepage}" target="_blank" class="text-[#3749bd] hover:text-[#f2d06f] hover:underline transition-colors">${article.source}</a>
                            </div>
                            <div class="card-footer flex items-center justify-between pt-[20px]">
                                <div class="time text-[14px] leading-[16px] text-white font-bold font-condensed">${timeStr}</div>
                                <a href="${article.link}" target="_blank" class="read-more text-[12px] leading-[14px] font-bold font-condensed text-[#3749bd] hover:text-[#f2d06f] transition-all">
                                    Διαβάστε ->
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    });
    
    container.innerHTML = skeletonsHTML;
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================
function renderNews(categories) {
    const colorStyles = getColorStyles();

    let html = '';

    for (const [key, category] of Object.entries(categories)) {
        // Skip if a specific category is selected and this isn't it
        if (selectedCategory !== 'all' && selectedCategory !== key) continue;
        
        const styles = colorStyles[category.color];
        const totalArticles = category.articles.length;
        const articlesToShow = Math.min(visibleCount[key], totalArticles);
        const articles = category.articles.slice(0, articlesToShow);

        if (totalArticles === 0) {
        html += `
            <section class="mb-12" id="category-${key}">
                    <h2 class="text-2xl font-bold ${styles.titleClass} border-b border-zinc-800 pb-3 mb-6">
                    ${category.title}
                </h2>
                <div class="text-center p-8 bg-[#1a1a1a] border border-zinc-800 rounded-lg">
                    <p class="text-zinc-500 mb-2">⚠️ Δεν βρέθηκαν άρθρα για αυτή την κατηγορία</p>
                </div>
            </section>`;
            continue;
        }
        
        html += `
            <section class="mb-12" id="category-${key}">
                <h2 class="text-2xl font-bold ${styles.titleClass} border-b border-zinc-800 pb-3 mb-6 flex items-center gap-2">
                    ${category.title}
                    <span class="text-sm text-zinc-600 font-normal ml-auto">(${articlesToShow}/${totalArticles})</span>
                </h2>
        `;

        articles.forEach((art, index) => {
            const description = art.description ? stripHtml(art.description).substring(0, 120) + '...' : '';
            const longDescription = art.description ? stripHtml(art.description).substring(0, 250) + '...' : '';
            const date = new Date(art.pubDate);
            const relativeTime = getRelativeTime(date);
            const thumbnail = art.thumbnail;
            
            const placeholderIcons = {
                'red': '🚨', 'purple': '🏛️', 'blue': '🌍',
                'green': '⚽', 'lime': '☘️', 'pink': '💻'
            };
            const placeholderIcon = placeholderIcons[category.color] || '📰';
            
            const badgeColors = {
                'red': 'bg-red-600', 'purple': 'bg-purple-600', 'blue': 'bg-blue-600',
                'green': 'bg-green-600', 'lime': 'bg-lime-600', 'pink': 'bg-pink-600'
            };
            const badgeColor = badgeColors[category.color] || 'bg-blue-600';

            // First article = HERO (responsive: fixed image height, flexible text, line-clamp so nothing overflows)
            if (index === 0) {
                html += `
                    <div class="mb-8 bg-[#1a1a1a] rounded-xl border border-zinc-800 ${styles.borderHover} transition-all duration-300 hover:shadow-2xl ${styles.shadow} overflow-hidden">
                        <a href="${art.link}" target="_blank" class="block group">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-0 md:min-h-[280px]">
                                ${thumbnail ? `
                                    <div class="relative w-full h-[200px] md:h-auto md:min-h-[280px] overflow-hidden bg-zinc-900 order-1">
                                        <img 
                                            src="${thumbnail}" 
                                            alt="${art.title}"
                                            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                            loading="eager"
                                            onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900\\'><span class=\\'text-8xl opacity-30\\'>${placeholderIcon}</span></div>'"
                                        />
                                        <div class="absolute top-4 left-4 ${badgeColor} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                            Πρόσφατο
                                        </div>
                                    </div>
                                ` : `
                                    <div class="relative w-full h-[200px] md:min-h-[280px] overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center order-1">
                                        <span class="text-8xl opacity-30 group-hover:scale-110 transition-transform">${placeholderIcon}</span>
                                        <div class="absolute top-4 left-4 ${badgeColor} text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                                            Πρόσφατο
                                        </div>
                                    </div>
                                `}
                                <div class="p-5 md:p-6 lg:p-8 flex flex-col justify-between order-2 min-h-0">
                                    <div class="flex-1 min-h-0">
                                        <h3 class="text-lg md:text-xl lg:text-2xl font-bold text-zinc-100 ${styles.titleHover} transition-colors mb-2 md:mb-3 leading-snug line-clamp-2 md:line-clamp-3">
                                            ${art.title}
                                        </h3>
                                        ${longDescription ? `<p class="text-zinc-400 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4">${longDescription}</p>` : ''}
                                    </div>
                                    <div class="mt-4 pt-4 border-t border-zinc-800 shrink-0">
                                        ${art.source ? `<p class="text-white text-xs md:text-sm mb-2">Πηγή: ${art.source}</p>` : ''}
                                        <div class="flex flex-wrap items-center gap-3">
                                            <span class="text-white text-xs md:text-sm font-medium flex items-center gap-2">
                                                <i class="fa-solid fa-clock"></i> ${relativeTime}
                                            </span>
                                            <button 
                                                onclick="handleShareClick(event, '${art.link.replace(/'/g, "\\'")}')"
                                                class="text-zinc-400 hover:text-white transition-colors p-1.5 md:p-2 hover:bg-zinc-800 rounded-lg"
                                                title="Αντιγραφή link"
                                            >
                                                <i class="fa-solid fa-share-nodes text-xs md:text-sm"></i>
                                            </button>
                                            <span class="${styles.readMore} text-xs md:text-sm font-semibold opacity-100 flex items-center gap-2 ml-auto">
                                                Διαβάστε περισσότερα <i class="fa-solid fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
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

        // Initialize Filter Logic (After content is loaded)
        setupFilterLogic();

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('main-content-wrapper').innerHTML = `<div class="gg-container text-white text-center pt-10">Σφάλμα φόρτωσης.</div>`;
    }
}

// --- FILTER LOGIC ---
function setupFilterLogic() {
    const filterSelect = document.getElementById('category-filter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        const allSections = document.querySelectorAll('.category-group');

        allSections.forEach(section => {
            const category = section.getAttribute('data-category');
            
            if (selected === 'all' || category === selected) {
                section.style.display = 'block';
                // Reset margin top for the first visible element
                const header = section.querySelector('.section-header');
                if (header) header.classList.add('mt-[40px]');
            } else {
                section.style.display = 'none';
            }
        });

        // Remove margin from the very first visible section to look nice
        const visibleSections = Array.from(allSections).filter(s => s.style.display !== 'none');
        if (visibleSections.length > 0) {
            const firstHeader = visibleSections[0].querySelector('.section-header');
            if (firstHeader) firstHeader.classList.remove('mt-[40px]');
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Trigger once to fix initial margins
    const event = new Event('change');
    filterSelect.dispatchEvent(event);
}


// --- BURGER MENU LOGIC ---
const burgerBtn = document.getElementById('burger-btn');
const dropdownMenu = document.getElementById('dropdown-menu');

if (burgerBtn && dropdownMenu) {
    burgerBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        dropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!burgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });
}

// --- HELPER FUNCTIONS ---
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
    const date = new Date(dateString);
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

document.addEventListener('DOMContentLoaded', loadNews);