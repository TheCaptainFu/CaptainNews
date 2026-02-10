const fs = require('fs');

// Οργάνωση πηγών ανά κατηγορία
const categories = {
    "politics_greece": [
        { name: 'Newsit', url: 'https://www.newsit.gr/category/politikh/feed/' },
        { name: 'Kathimerini', url: 'https://www.kathimerini.gr/politics/feed/' },
        { name: 'In.gr', url: 'https://www.in.gr/politics/feed/' },
        { name: 'Macropolis', url: 'https://www.macropolis.gr/?i=portal.el.rss' }
    ],
    "sports": [
        { name: 'Gazzetta', url: 'https://www.gazzetta.gr/rss' },
        { name: 'Sport24', url: 'https://www.sport24.gr/?widget=rssfeed&view=feed&contentId=12' },
        { name: 'Contra', url: 'https://www.contra.gr/?widget=rssfeed&view=feed&contentId=12' },
        { name: 'SDNA', url: 'https://www.sdna.gr/rss/all' }
    ],
    "technology": [
        { name: 'Insomnia', url: 'https://www.insomnia.gr/rss/news.xml/' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss' }
    ],
    "music": [
        { name: 'Pitchfork', url: 'https://pitchfork.com/rss/news/' },
        { name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/feed/' },
        { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
        { name: 'Resident Advisor', url: 'https://ra.co/xml/news.xml' }
    ],
    "world_politics": [
        { name: 'Reuters', url: 'https://www.reutersagency.com/feed/' },
        { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
        { name: 'The Guardian', url: 'https://www.theguardian.com/politics/rss' },
        { name: 'Politico', url: 'https://www.politico.eu/feed/' }
    ]
};

async function updateDatabase() {
    let finalData = {};
    const seenTitles = new Set();

    // Loop σε κάθε κατηγορία
    for (const [categoryName, sources] of Object.entries(categories)) {
        console.log(`--- Επεξεργασία κατηγορίας: ${categoryName} ---`);
        let categoryArticles = [];

        for (const source of sources) {
            try {
                console.log(`Λήψη δεδομένων από: ${source.name}...`);
                const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.status === 'ok') {
                    data.items.forEach(item => {
                        const normalizedTitle = item.title.trim().toLowerCase();
                        
                        // Check for duplicates globally or per category (εδώ είναι ανά εκτέλεση)
                        if (!seenTitles.has(normalizedTitle)) {
                            seenTitles.add(normalizedTitle);

                            // --- ΕΞΥΠΝΗ ΑΝΙΧΝΕΥΣΗ ΕΙΚΟΝΑΣ ---
                            let finalImage = "";
                            if (item.thumbnail) {
                                finalImage = item.thumbnail;
                            } else if (item.enclosure && item.enclosure.link) {
                                finalImage = item.enclosure.link;
                            } else {
                                const searchIn = (item.description || "") + (item.content || "");
                                const imgMatch = searchIn.match(/<img[^>]+src="([^">]+)"/);
                                if (imgMatch && imgMatch[1]) {
                                    finalImage = imgMatch[1];
                                }
                            }

                            categoryArticles.push({
                                title: item.title.trim(),
                                image: finalImage,
                                link: item.link,
                                date: item.pubDate,
                                source: source.name
                            });
                        }
                    });
                }
            } catch (error) {
                console.error(`Σφάλμα στο ${source.name}:`, error.message);
            }
        }

        // Ταξινόμηση ανά ημερομηνία για τη συγκεκριμένη κατηγορία
        categoryArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        finalData[categoryName] = categoryArticles;
    }

    // Εγγραφή στο news.json
    try {
        fs.writeFileSync('news.json', JSON.stringify(finalData, null, 5), 'utf8');
        console.log('-----------------------------------');
        console.log(`ΕΠΙΤΥΧΙΑ: Το news.json ενημερώθηκε με όλες τις κατηγορίες!`);
    } catch (err) {
        console.error('Σφάλμα κατά την εγγραφή:', err);
    }
}

updateDatabase();