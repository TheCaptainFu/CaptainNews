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