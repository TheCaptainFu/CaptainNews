const WORKER_URL = 'https://captainnews-worker.g-gsmks.workers.dev';

const categoryPages = {
    greece_news:     'https://captainnews.gr/greece/',
    politics_greece: 'https://captainnews.gr/politics/',
    world_politics:  'https://captainnews.gr/world/',
    sports:          'https://captainnews.gr/sports/',
    technology:      'https://captainnews.gr/technology/',
    music:           'https://captainnews.gr/music/',
};

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function onRequest() {
    try {
        const response = await fetch(WORKER_URL);
        const data = await response.json();

        let urls = '';
        for (const [category, articles] of Object.entries(data)) {
            const pageUrl = categoryPages[category];
            if (!pageUrl || !articles.length) continue;

            // Use the category page URL (must be on our domain)
            // Title = latest article title, date = latest article date
            const latest = articles[0];
            const pubDate = latest.date ? new Date(latest.date).toISOString() : new Date().toISOString();
            urls += `  <url>
    <loc>${pageUrl}</loc>
    <news:news>
      <news:publication>
        <news:name>CaptainNews.gr</news:name>
        <news:language>el</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(latest.title)}</news:title>
    </news:news>
  </url>\n`;
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}</urlset>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (err) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${err.message}</error>`, {
            status: 500,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
