const fs = require('fs');
const Parser = require('rss-parser');

// Ρυθμίσεις του Parser για να τραβάει όλα τα πεδία
const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['content', 'content'],
            ['description', 'description'],
            ['media:content', 'mediaContent'],
            ['enclosure', 'enclosure']
        ],
    },
});

// Οι πηγές σου
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

// Συνάρτηση καθαρισμού κειμένου (αφαιρεί HTML tags & links τύπου "Διαβάστε...")
function cleanText(html) {
    if (!html) return "";
    // Αφαίρεση εικόνων
    let text = html.replace(/<img[^>]*>/g, ""); 
    // Αφαίρεση tags
    text = text.replace(/<[^>]+>/g, ""); 
    // Αφαίρεση "Διαβάστε περισσότερα" και συναφών
    text = text.replace(/Διαβάστε περισσότερα.*/gi, "");
    text = text.replace(/Read more.*/gi, "");
    // Αφαίρεση πολλαπλών κενών/νέων γραμμών
    return text.trim().replace(/\s\s+/g, ' ');
}

// Συνάρτηση εύρεσης εικόνας
function findImage(item) {
    // 1. Έλεγχος στο enclosure (τυπικό RSS image)
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    
    // 2. Έλεγχος στο media:content
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
    
    // 3. Regex στο content για img tag
    const htmlContent = item.contentEncoded || item.content || item.description || "";
    const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) return imgMatch[1];

    return ""; // Αν δεν βρει τίποτα
}

async function updateDatabase() {
    let finalData = {};
    const seenTitles = new Set();

    for (const [categoryName, sources] of Object.entries(categories)) {
        console.log(`\n--- Επεξεργασία: ${categoryName} ---`);
        let categoryArticles = [];

        for (const source of sources) {
            try {
                console.log(`Λήψη από: ${source.name}...`);
                
                // Εδώ γίνεται η απευθείας λήψη του XML
                const feed = await parser.parseURL(source.url);

                feed.items.forEach(item => {
                    const normalizedTitle = item.title.trim().toLowerCase();
                    
                    if (!seenTitles.has(normalizedTitle)) {
                        seenTitles.add(normalizedTitle);

                        // Βρες την καλύτερη περιγραφή
                        const rawDesc = item.contentEncoded || item.content || item.description || "";
                        const cleanDesc = cleanText(rawDesc);
                        
                        // Βρες την καλύτερη εικόνα
                        const finalImage = findImage(item);

                        // Ημερομηνία
                        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

                        categoryArticles.push({
                            title: item.title.trim(),
                            description: cleanDesc,
                            image: finalImage,
                            link: item.link,
                            date: pubDate,
                            source: source.name
                        });
                    }
                });

            } catch (error) {
                console.error(`❌ Σφάλμα στο ${source.name}: ${error.message}`);
            }
        }

        // Ταξινόμηση: Πιο πρόσφατα πρώτα
        categoryArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Κράτα μόνο τα 12 πιο πρόσφατα ανά κατηγορία (για να μη βαρύνει το JSON)
        finalData[categoryName] = categoryArticles.slice(0, 12);
    }

    try {
        fs.writeFileSync('news.json', JSON.stringify(finalData, null, 2), 'utf8');
        console.log('\n✅ ΕΠΙΤΥΧΙΑ: Το news.json ενημερώθηκε!');
    } catch (err) {
        console.error('Σφάλμα εγγραφής:', err);
    }
}

updateDatabase();