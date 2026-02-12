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

async function loadNews() {
    try {
        const response = await fetch('news.json');
        if (!response.ok) throw new Error('Failed to load news');
        
        const data = await response.json();
        const mainWrapper = document.getElementById('main-content-wrapper');
        mainWrapper.innerHTML = '';

        const categories = Object.entries(data);

        categories.forEach(([categoryKey, articles], catIndex) => {
            
            const readableTitle = categoryDisplayNames[categoryKey] || categoryKey.toUpperCase();
            const marginTopClass = catIndex === 0 ? '' : 'mt-[40px]';

            const categorySection = document.createElement('section');
            categorySection.className = `category-group mb-10`;

            let categoryHTML = `
                <div class="gg-container ${marginTopClass}">
                    <div class="title flex items-center gap-[5px] w-full border-b border-zinc-800 pb-[5px]">
                        <h2 class="text-[24px] leading-[28px] font-bold text-red-500 font-condensed uppercase">${readableTitle}</h2>
                    </div>
                </div>
                <div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] pt-[10px]">
            `;

            // Προσθέτουμε το index εδώ (artIndex)
            articles.forEach((article, artIndex) => {
                const imgUrl = article.image || '/icons/test.avif';
                const timeStr = timeAgo(article.date);

                // --- ΛΟΓΙΚΗ ΓΙΑ ΤΟ ΠΡΩΤΟ ΑΡΘΡΟ ---
                const isFeatured = artIndex === 0;

                // Κλάσεις για το Wrapper του άρθρου
                // Αν είναι featured: πιάνει 3 στήλες και γίνεται row (οριζόντιο) σε μεγάλες οθόνες
                // Αν όχι: πιάνει 1 στήλη και είναι col (κάθετο)
                const wrapperClasses = isFeatured 
                    ? "col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row" 
                    : "flex flex-col";

                // Κλάσεις για την εικόνα
                // Στο featured δίνουμε πλάτος 5/12 (περίπου 40%)
                const imageWrapperClasses = isFeatured
                    ? "w-full md:w-6/12 h-[250px] md:h-auto relative shrink-0"
                    : "w-full h-[230px]";

                // Κλάσεις για το κείμενο (Info)
                const infoWrapperClasses = isFeatured
                    ? "p-[20px] flex flex-col justify-center w-full md:w-7/12"
                    : "p-[20px] flex flex-col flex-grow";

                // Όριο χαρακτήρων (δείχνουμε περισσότερο κείμενο στο μεγάλο άρθρο)
                const charLimit = isFeatured ? 350 : 110;

                categoryHTML += `
                    <div class="item bg-main-grey rounded-[12px] overflow-hidden ${wrapperClasses}">
                        
                        <div class="${imageWrapperClasses}">
                            <img class="w-full h-full object-cover" src="${imgUrl}" alt="${article.title}" onerror="this.src='/icons/test.avif'">
                        </div>

                        <div class="${infoWrapperClasses}">
                            <div class="title text-[16px] leading-[20px] text-white font-bold font-condensed pb-[10px] ${isFeatured ? 'text-[22px] leading-[26px]' : 'min-h-[50px]'}">
                                ${article.title}
                            </div>
                            <div class="description text-[14px] leading-[20px] text-white font-normal font-roboto pb-[20px] opacity-80 flex-grow">
                                ${article.description ? stripHtml(article.description).substring(0, charLimit) + '...' : 'Διαβάστε περισσότερα για το θέμα στην πηγή.'}
                            </div>
                            
                            <div class="source text-[16px] leading-[14px] text-white font-bold font-condensed pb-[20px] border-b border-zinc-800">
                                Πηγή: <span class="text-red-500">${article.source}</span>
                            </div>
                            
                            <div class="card-footer flex items-center justify-between pt-[20px]">
                                <div class="time text-[14px] leading-[16px] text-white font-bold font-condensed">${timeStr}</div>
                                <a href="${article.link}" target="_blank" class="read-more text-[12px] leading-[14px] font-bold font-condensed text-red-500 hover:text-white transition-all">
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
            categorySection.innerHTML = categoryHTML;
            mainWrapper.appendChild(categorySection);
        });

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('main-content-wrapper').innerHTML = `<div class="gg-container text-white text-center pt-10">Σφάλμα φόρτωσης.</div>`;
    }
}

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