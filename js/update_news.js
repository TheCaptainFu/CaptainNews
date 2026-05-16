const fs = require('fs');
const Parser = require('rss-parser');

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

const categories = {
    "greece_news": [
        { name: 'Protothema', url: 'https://www.protothema.gr/rss/' },
        { name: 'Newsbeast',  url: 'https://www.newsbeast.gr/feed' },
        { name: 'Newsit',     url: 'https://www.newsit.gr/feed/' },
        { name: 'In.gr',      url: 'https://www.in.gr/feed/' },
    ],
    "politics_greece": [
        { name: 'Protothema', url: 'https://www.protothema.gr/politics/rss/' },
        { name: 'Newsit',     url: 'https://www.newsit.gr/category/politikh/feed/' },
        { name: 'In.gr',      url: 'https://www.in.gr/politics/feed/' },
    ],
    "world_politics": [
        { name: 'BBC World',   url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
        { name: 'ABC Intl',    url: 'https://abcnews.go.com/abcnews/internationalheadlines' },
        { name: 'The Hill',    url: 'https://thehill.com/homenews/feed/' },
        { name: 'In.gr World', url: 'https://www.in.gr/world/feed/' },
    ],
    "sports": [
        { name: 'Newsbeast', url: 'https://www.newsbeast.gr/sports/feed' },
        { name: 'Newsit',    url: 'https://www.newsit.gr/category/athlitika/feed/' },
        { name: 'In.gr',     url: 'https://www.in.gr/sports/feed/' },
    ],
    "technology": [
        { name: 'Techgear',    url: 'https://www.techgear.gr/feed/' },
        { name: 'Techblog',    url: 'https://techblog.gr/feed/' },
        { name: 'Techmaniacs', url: 'https://techmaniacs.gr/feed/' },
        { name: 'IGuru',       url: 'https://iguru.gr/feed/' },
    ],
    "music": [
        { name: 'Mad TV',  url: 'https://mad.tv/feed/' },
        { name: 'Tralala', url: 'https://www.tralala.gr/feed/' },
    ]
};

function cleanText(html) {
    if (!html) return "";
    let text = html.replace(/<img[^>]*>/g, ""); 
    text = text.replace(/<[^>]+>/g, ""); 
    text = text.replace(/Διαβάστε περισσότερα.*/gi, "");
    text = text.replace(/Read more.*/gi, "");
    return text.trim().replace(/\s\s+/g, ' ');
}

function findImage(item) {
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) return item.mediaContent.$.url;
    const htmlContent = item.contentEncoded || item.content || item.description || "";
    const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) return imgMatch[1];
    return "";
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
                const feed = await parser.parseURL(source.url);

                feed.items.forEach(item => {
                    const normalizedTitle = item.title.trim().toLowerCase();
                    if (!seenTitles.has(normalizedTitle)) {
                        seenTitles.add(normalizedTitle);
                        const rawDesc = item.contentEncoded || item.content || item.description || "";
                        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
                        categoryArticles.push({
                            title:       item.title.trim(),
                            description: cleanText(rawDesc),
                            image:       findImage(item),
                            link:        item.link,
                            date:        pubDate,
                            source:      source.name
                        });
                    }
                });
            } catch (error) {
                console.error(`❌ Σφάλμα στο ${source.name}: ${error.message}`);
            }
        }

        categoryArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        finalData[categoryName] = categoryArticles.slice(0, 30);
    }

    try {
        fs.writeFileSync('news.json', JSON.stringify(finalData, null, 2), 'utf8');
        console.log('\n✅ ΕΠΙΤΥΧΙΑ: Το news.json ενημερώθηκε!');
    } catch (err) {
        console.error('Σφάλμα εγγραφής:', err);
    }
}

updateDatabase();