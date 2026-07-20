const Parser = require('rss-parser');
const fs     = require('fs');
const path   = require('path');

const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
    customFields: {
        item: [
            ['media:thumbnail', 'mediaThumbnail'],
            ['media:content',   'mediaContent'],
            ['enclosure',       'enclosure'],
        ]
    }
});

const categories = {
    "greece_news": [
        { name: "Protothema", url: "https://www.protothema.gr/rss/" },
        { name: "Newsbeast",  url: "https://www.newsbeast.gr/feed" },
        { name: "Newsit",     url: "https://www.newsit.gr/feed/" },
        { name: "In.gr",      url: "https://www.in.gr/feed/" },
    ],
    "politics_greece": [
        { name: "Protothema", url: "https://www.protothema.gr/politics/rss/" },
        { name: "Newsit",     url: "https://www.newsit.gr/category/politikh/feed/" },
        { name: "In.gr",      url: "https://www.in.gr/politics/feed/" },
    ],
    "world_politics": [
        { name: "BBC World",   url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
        { name: "ABC Intl",    url: "https://abcnews.go.com/abcnews/internationalheadlines" },
        { name: "The Hill",    url: "https://thehill.com/homenews/feed/" },
        { name: "In.gr World", url: "https://www.in.gr/world/feed/" },
    ],
    "sports": [
        { name: "Newsbeast", url: "https://www.newsbeast.gr/sports/feed" },
        { name: "Newsit",    url: "https://www.newsit.gr/category/athlitika/feed/" },
        { name: "In.gr",     url: "https://www.in.gr/sports/feed/" },
    ],
    "technology": [
        { name: "Techgear",    url: "https://www.techgear.gr/feed/" },
        { name: "Techblog",    url: "https://techblog.gr/feed/" },
        { name: "Techmaniacs", url: "https://techmaniacs.gr/feed/" },
        { name: "IGuru",       url: "https://iguru.gr/feed/" },
    ],
    "music": [
        { name: "Mad TV",  url: "https://mad.tv/feed/" },
        { name: "Tralala", url: "https://www.tralala.gr/feed/" },
    ],
};

const MAX_PER_CAT    = 30;
const MAX_PER_SOURCE = 15;

function extractImage(item) {
    const t = item.mediaThumbnail;
    if (t) {
        const url = typeof t === 'string' ? t : (t?.$?.url || t?.url);
        if (url && url.startsWith('http')) return url;
    }
    const mc = item.mediaContent;
    if (mc) {
        const url = typeof mc === 'string' ? mc : (mc?.$ ?.url || mc?.url);
        if (url && url.startsWith('http')) return url;
    }
    if (item.enclosure?.url?.startsWith('http')) return item.enclosure.url;
    return '';
}

async function fetchCategory(catKey, sources) {
    const results = await Promise.allSettled(
        sources.map(async src => {
            try {
                const feed = await parser.parseURL(src.url);
                const articles = feed.items.slice(0, MAX_PER_SOURCE).map(item => ({
                    title:       (item.title || '').replace(/<[^>]+>/g, '').trim(),
                    link:        item.link || item.guid || '',
                    image:       extractImage(item),
                    description: (item.contentSnippet || item.summary || item.content || '').slice(0, 250),
                    date:        item.isoDate || item.pubDate || new Date().toISOString(),
                    source:      src.name,
                })).filter(a => a.title && a.link);
                console.log(`  OK  ${src.name}: ${articles.length}`);
                return articles;
            } catch (e) {
                console.log(`  ERR ${src.name}: ${e.message}`);
                return [];
            }
        })
    );

    let all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    const seen = new Set();
    return all.filter(a => !seen.has(a.link) && seen.add(a.link)).slice(0, MAX_PER_CAT);
}

async function main() {
    console.log('Fetching news...\n');
    const out = {};

    for (const [cat, sources] of Object.entries(categories)) {
        console.log(`[${cat}]`);
        out[cat] = await fetchCategory(cat, sources);
        console.log(`  → ${out[cat].length} articles\n`);
    }

    const total = Object.values(out).reduce((s, a) => s + a.length, 0);
    fs.writeFileSync(
        path.join(__dirname, 'news.json'),
        JSON.stringify(out, null, 2),
        'utf8'
    );
    console.log(`Done! ${total} total articles saved to news.json`);
}

main().catch(console.error);
