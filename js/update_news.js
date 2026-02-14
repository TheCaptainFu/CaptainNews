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
        { name: 'Skai',       url: 'https://www.skai.gr/feed' },
        { name: 'Ant1',       url: 'https://www.ant1news.gr/feed' },
        { name: 'Protothema', url: 'https://www.protothema.gr/rss/' },
        { name: 'Thetoc',     url: 'https://www.thetoc.gr/rss' },
        { name: 'Newsbeast',  url: 'https://www.newsbeast.gr/feed' },
        { name: 'Iefimerida', url: 'https://www.iefimerida.gr/rss.xml' }
    ],
    "politics_greece": [
        { name: 'Newsit',      url: 'https://www.newsit.gr/category/politikh/feed/' },
        { name: 'Kathimerini', url: 'https://www.kathimerini.gr/politics/feed/' },
        { name: 'In.gr',       url: 'https://www.in.gr/politics/feed/' },
        { name: 'Protothema',  url: 'https://www.protothema.gr/politics/rss/' },
        { name: 'Thetoc',      url: 'https://www.thetoc.gr/politics/rss' },
        { name: 'Iefimerida',  url: 'https://www.iefimerida.gr/politics/rss.xml' }
    ],
    "world_politics": [
        { name: 'BBC World',   url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
        { name: 'ABC Intl',    url: 'https://abcnews.go.com/abcnews/internationalheadlines' },
        { name: 'The Hill',    url: 'https://thehill.com/homenews/feed/' },
        { name: 'VOA News',    url: 'https://www.voanews.com/api/zmt_qeqpoe' },
        { name: 'Kathimerini', url: 'https://www.kathimerini.gr/world/feed/' },
        { name: 'In.gr World', url: 'https://www.in.gr/world/feed/' }
    ],
    "sports": [
        { name: 'Gazzetta', url: 'https://www.gazzetta.gr/rss' },
        { name: 'Sport24',  url: 'https://www.sport24.gr/?widget=rssfeed&view=feed&contentId=12' },
        { name: 'Contra',   url: 'https://www.contra.gr/?widget=rssfeed&view=feed&contentId=12' },
        { name: 'SDNA',     url: 'https://www.sdna.gr/rss/all' },
        { name: 'BBC Sport',url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
        { name: 'ESPN',     url: 'https://www.espn.com/espn/rss/news' }
    ],
    "technology": [
        { name: 'Insomnia',    url: 'https://www.insomnia.gr/rss/news.xml/' },
        { name: 'Techgear',    url: 'https://www.techgear.gr/feed/' },
        { name: 'Digitallife', url: 'https://www.digitallife.gr/feed/' },
        { name: 'Pcsteps',     url: 'https://www.pcsteps.gr/feed/' },
        { name: 'The Verge',   url: 'https://www.theverge.com/rss/index.xml' },
        { name: 'TechCrunch',  url: 'https://techcrunch.com/feed/' }
    ],
    "music": [
        { name: 'In.gr Music',   url: 'https://www.in.gr/music/feed/' },
        { name: 'Pitchfork',     url: 'https://pitchfork.com/rss/news/' },
        { name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/music-news/feed/' },
        { name: 'Billboard',     url: 'https://www.billboard.com/feed/' },
        { name: 'Musicfollow',   url: 'https://musicfollow.gr/feed/' },
        { name: 'Resident Advisor', url: 'https://ra.co/xml/news.xml' }
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