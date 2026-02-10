async function loadNews() {
    try {
        // Φόρτωση του αρχείου news.json
        const response = await fetch('news.json');
        const data = await response.json();
        
        const container = document.getElementById('news-app');
        container.innerHTML = ''; // Καθαρισμός αν υπάρχει κάτι

        // Loop σε κάθε κατηγορία (sports, technology, κλπ)
        for (const [categoryName, articles] of Object.entries(data)) {
            
            // 1. Δημιουργία Τίτλου Κατηγορίας
            const sectionHeader = `
                <div class="title gg-container flex items-center gap-[5px] mt-10">
                    <div class="bg-white w-1 h-6 mb-4"></div>
                    <h2 class="text-white text-2xl font-bold mb-4 uppercase">${categoryName.replace('_', ' ')}</h2>
                </div>
            `;
            
            // 2. Δημιουργία Grid για τα άρθρα
            const gridStart = `<div class="gg-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">`;
            const gridEnd = `</div>`;
            
            // 3. Δημιουργία των Cards των άρθρων
            let articlesHTML = '';
            articles.forEach(article => {
                // Υπολογισμός ώρας (απλοποιημένο)
                const articleDate = new Date(article.date).toLocaleDateString('el-GR');
                
                // Αν δεν υπάρχει εικόνα, βάζουμε ένα placeholder
                const imgUrl = article.image || 'https://via.placeholder.com/400x230?text=CaptainNews';

                articlesHTML += `
                    <div class="item bg-zinc-900 p-4 rounded-lg">
                        <div class="image">
                            <img class="w-full h-[230px] object-cover rounded shadow-md" src="${imgUrl}" alt="${article.title}">
                        </div>
                        <div class="source text-blue-400 text-xs font-bold mt-3 uppercase">${article.source}</div>
                        <div class="title text-white font-bold text-lg leading-tight mt-2 mb-4 h-[60px] overflow-hidden">
                            ${article.title}
                        </div>
                        <div class="card-footer flex justify-between items-center border-t border-zinc-800 pt-3">
                            <div class="time text-zinc-400 text-sm">${articleDate}</div>
                            <a href="${article.link}" target="_blank" class="read-more bg-white text-black px-4 py-1 rounded text-sm font-bold hover:bg-gray-200 transition">
                                Διαβάστε
                            </a>
                        </div>
                    </div>
                `;
            });

            // Προσθήκη όλων στο κύριο container
            container.innerHTML += sectionHeader + gridStart + articlesHTML + gridEnd;
        }

    } catch (error) {
        console.error("Σφάλμα κατά τη φόρτωση των ειδήσεων:", error);
        document.getElementById('news-app').innerHTML = `<p class="text-white text-center">Αποτυχία φόρτωσης ειδήσεων.</p>`;
    }
}

// Εκτέλεση της συνάρτησης μόλις φορτώσει η σελίδα
document.addEventListener('DOMContentLoaded', loadNews);