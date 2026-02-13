/**
 * CaptainNews.gr - Main News Loader (Cloudflare Worker Version)
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
// ΑΝΤΙΚΑΤΑΣΤΗΣΕ ΤΟ ΠΑΡΑΚΑΤΩ ΜΕ ΤΟ URL ΠΟΥ ΣΟΥ ΕΔΩΣΕ ΤΟ CLOUDFLARE
const WORKER_URL = 'https://captainnews-worker.ΤΟ-ΔΙΚΟ-ΣΟΥ-SUBDOMAIN.workers.dev/';

async function loadNews() {
    try {
        // Φόρτωση από τον Worker αντί για το news.json
        const response = await fetch(WORKER_URL + '?t=' + new Date().getTime()); 
        if (!response.ok) throw new Error('Failed to load news from Worker');
        
        const data = await response.json();
        const mainWrapper = document.getElementById('main-content-wrapper');
        
        if (!mainWrapper) return;
        mainWrapper.innerHTML = '';

        const categories = Object.entries(data);

        categories.forEach(([categoryKey, articles], catIndex) => {
            const readableTitle = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
            const marginTopClass = 'mt-[40px]'; 
            const totalArticles = articles.length;

            const categorySection = document.createElement('section');
            categorySection.id = `section-${categoryKey}`; 
            categorySection.className = `category-group mb-10`;
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

        // Αρχικοποίηση του φίλτρου
        setupFilterLogic();

    } catch (error) {
        console.error("Error:", error);
        const mainWrapper = document.getElementById('main-content-wrapper');
        if (mainWrapper) {
            mainWrapper.innerHTML = `<div class="gg-container text-white text-center pt-10 font-condensed uppercase">Σφάλμα φόρτωσης ειδήσεων από τον διακομιστή.</div>`;
        }
    }
}

// --- CUSTOM FILTER LOGIC (With Hover & Hand Cursor Support) ---
function setupFilterLogic() {
    const filterBtn = document.getElementById('filter-btn');
    const filterOptionsContainer = document.getElementById('filter-options');
    const filterOptions = document.querySelectorAll('.filter-option');
    const currentText = document.getElementById('filter-current-text');
    const dropdownContainer = document.getElementById('custom-filter-dropdown');

    if (!filterBtn || !filterOptionsContainer) return;

    // Toggle Menu
    filterBtn.onclick = (e) => {
        e.stopPropagation();
        filterOptionsContainer.classList.toggle('hidden');
        const icon = filterBtn.querySelector('i');
        if (icon) icon.classList.toggle('rotate-180');
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (dropdownContainer && !dropdownContainer.contains(e.target)) {
            filterOptionsContainer.classList.add('hidden');
            const icon = filterBtn.querySelector('i');
            if (icon) icon.classList.remove('rotate-180');
        }
    });

    // Handle Option Click
    filterOptions.forEach(option => {
        option.onclick = () => {
            const selectedValue = option.getAttribute('data-value');
            if (currentText) currentText.innerText = option.innerText;
            filterOptionsContainer.classList.add('hidden');

            const allSections = document.querySelectorAll('.category-group');
            allSections.forEach(section => {
                const category = section.getAttribute('data-category');
                if (selectedValue === 'all' || category === selectedValue) {
                    section.style.display = 'block';
                    const header = section.querySelector('.section-header');
                    if (header) header.classList.add('mt-[40px]');
                } else {
                    section.style.display = 'none';
                }
            });

            // Clean up margins for first item
            const visibleSections = Array.from(allSections).filter(s => s.style.display !== 'none');
            if (visibleSections.length > 0) {
                const firstHeader = visibleSections[0].querySelector('.section-header');
                if (firstHeader) firstHeader.classList.remove('mt-[40px]');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    });
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
