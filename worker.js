// ============================================================
//  CaptainNews Worker — v7
//  - Όλες οι κατηγορίες παράλληλα (δεν κρεμάει)
//  - Χωρίς image scraping (CPU safe)
//  - Images μόνο από RSS feed data
// ============================================================

const categories = {
    "greece_news": [
        { name: "Protothema",  url: "https://www.protothema.gr/rss/" },
        { name: "Newsbeast",   url: "https://www.newsbeast.gr/feed" },
        { name: "Newsit",      url: "https://www.newsit.gr/feed/" },
        { name: "In.gr",       url: "https://www.in.gr/feed/" },
    ],
    "politics_greece": [
        { name: "Protothema",  url: "https://www.protothema.gr/politics/rss/" },
        { name: "Newsit",      url: "https://www.newsit.gr/category/politikh/feed/" },
        { name: "In.gr",       url: "https://www.in.gr/politics/feed/" },
    ],
    "world_politics": [
        { name: "BBC World",   url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
        { name: "ABC Intl",    url: "https://abcnews.go.com/abcnews/internationalheadlines" },
        { name: "The Hill",    url: "https://thehill.com/homenews/feed/" },
        { name: "In.gr World", url: "https://www.in.gr/world/feed/" }
    ],
    "sports": [
        { name: "Newsbeast",   url: "https://www.newsbeast.gr/sports/feed" },
        { name: "Newsit",      url: "https://www.newsit.gr/category/athlitika/feed/" },
        { name: "In.gr",       url: "https://www.in.gr/sports/feed/" },
    ],
    "technology": [
        { name: "Techgear",    url: "https://www.techgear.gr/feed/" },
        { name: "Techblog",    url: "https://techblog.gr/feed/" },
        { name: "Techmaniacs", url: "https://techmaniacs.gr/feed/" },
        { name: "IGuru",       url: "https://iguru.gr/feed/" },
    ],
    "music": [
        { name: "Mad TV",      url: "https://mad.tv/feed/" },
        { name: "Tralala",     url: "https://www.tralala.gr/feed/" },
    ]
};

const FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    "Accept-Language": "en-US,en;q=0.9,el;q=0.8"
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
};

const MAX_PER_CAT    = 30;
const MAX_PER_SOURCE = 15;
const FETCH_MS       = 8000;

// ─── Fetch με timeout ───
async function safeFetch(url, ms = FETCH_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { headers: FETCH_HEADERS, signal: ctrl.signal });
        clearTimeout(t);
        return res;
    } catch (e) {
        clearTimeout(t);
        throw e;
    }
}

// ─── XML helpers ───
const unwrap = s => (s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();

function getTag(xml, tag) {
    const t = tag.replace(":", "\\:");
    const m = xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`, "i"));
    return m ? unwrap(m[1]) : null;
}

function extractLink(item) {
    const a = item.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (a) return a[1].trim();
    const r = item.match(/<link>\s*(https?:\/\/[^<\s]+)\s*<\/link>/i);
    if (r) return r[1].trim();
    const g = item.match(/<guid[^>]*>\s*(https?:\/\/[^<\s]+)\s*<\/guid>/i);
    if (g) return g[1].trim();
    return null;
}

// ─── Image extraction από RSS data μόνο ───
const goodImg = url =>
    url &&
    typeof url === "string" &&
    url.startsWith("http") &&
    !/\/(1x1|pixel|spacer|blank|tracking)\./i.test(url) &&
    !/\.svg(\?|$)/i.test(url);

function extractImage(item) {
    const mt = item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    if (mt && goodImg(mt[1])) return mt[1];

    const mc = item.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    if (mc && goodImg(mc[1])) return mc[1];

    const e1 = item.match(/<enclosure[^>]+type=["']image\/[^"']*["'][^>]+url=["']([^"']+)["']/i)
            || item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']*["']/i);
    if (e1 && goodImg(e1[1])) return e1[1];

    const e2 = item.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    if (e2 && goodImg(e2[1])) return e2[1];

    const og = item.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || item.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (og && goodImg(og[1])) return og[1];

    const ds = item.match(/data-src=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i);
    if (ds && goodImg(ds[1])) return ds[1];

    const ss = item.match(/srcset=["'](https?:\/\/[^"'\s,]+)/i);
    if (ss && goodImg(ss[1])) return ss[1];

    for (const m of item.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi))
        if (goodImg(m[1]) && !/logo|icon|avatar|pixel|1x1|blank|spinner/i.test(m[1])) return m[1];

    return null;
}

// ─── Strip HTML ───
function strip(html) {
    return (html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/gm, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#\d+;/g, "")
        .replace(/\s{2,}/g, " ").trim();
}

// ─── Parse ένα feed ───
async function parseFeed(source) {
    let xml;
    try {
        const res = await safeFetch(source.url);
        if (!res?.ok) { console.log(`SKIP ${source.name} → ${res?.status}`); return { articles: [], failed: `${source.name} → HTTP ${res?.status}` }; }
        xml = await res.text();
    } catch (e) { console.log(`FAIL ${source.name}: ${e.message}`); return { articles: [], failed: `${source.name} → ${e.message}` }; }

    if (!xml || xml.length < 100) { console.log(`EMPTY ${source.name}`); return { articles: [], failed: `${source.name} → empty response` }; }

    const isAtom = /<entry\b/i.test(xml);
    const tag = isAtom ? "entry" : "item";
    const items = xml.match(new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "g")) || [];

    if (!items.length) { console.log(`NO_ITEMS ${source.name}`); return { articles: [], failed: `${source.name} → no items found` }; }

    const articles = [];
    for (const item of items.slice(0, MAX_PER_SOURCE)) {
        const title = getTag(item, "title");
        if (!title?.trim()) continue;
        const link = extractLink(item);
        if (!link) continue;

        const desc = strip(
            getTag(item, "content:encoded") || getTag(item, "content") ||
            getTag(item, "summary")         || getTag(item, "description") || ""
        ).slice(0, 250);

        const dateStr = getTag(item, "pubDate") || getTag(item, "published") ||
                        getTag(item, "updated") || getTag(item, "dc:date") || "";
        const date = isNaN(new Date(dateStr)) ? new Date() : new Date(dateStr);

        articles.push({
            title:       strip(title),
            link,
            image:       extractImage(item) || "",
            description: desc,
            date:        date.toISOString(),
            source:      source.name
        });
    }

    console.log(`OK ${source.name}: ${articles.length}`);
    return { articles, failed: null };
}

// ─── Fetch όλες οι κατηγορίες ΠΑΡΑΛΛΗΛΑ ───
async function fetchAll() {
    const catEntries = Object.entries(categories);

    const failed = [];

    const catResults = await Promise.allSettled(
        catEntries.map(([cat, sources]) =>
            Promise.allSettled(sources.map(parseFeed)).then(results => {
                const catFailed = [];
                let all = [];
                results.forEach(r => {
                    if (r.status === "fulfilled") {
                        if (r.value.failed) catFailed.push(r.value.failed);
                        all = all.concat(r.value.articles || []);
                    }
                });
                all.sort((a, b) => new Date(b.date) - new Date(a.date));
                const seen = new Set();
                const articles = all
                    .filter(a => !seen.has(a.link) && seen.add(a.link))
                    .slice(0, MAX_PER_CAT);
                console.log(`DONE ${cat}: ${articles.length}`);
                return [cat, articles, catFailed];
            })
        )
    );

    const out = {};
    catResults.forEach(r => {
        if (r.status === "fulfilled") {
            const [cat, articles, catFailed] = r.value;
            out[cat] = articles;
            failed.push(...catFailed);
        }
    });
    return { data: out, failed };
}

// ─── Worker entry ───
export default {
    async fetch(req, env) {
        if (req.method === "OPTIONS")
            return new Response(null, { status: 204, headers: CORS_HEADERS });

        const path = new URL(req.url).pathname;
        const token = new URL(req.url).searchParams.get("token");
        if (path === "/update" && token === env.UPDATE_TOKEN) {
            try {
                const { data, failed } = await fetchAll();
                const now  = new Date().toISOString();

                await env.NEWS_KV.put("latest_news", JSON.stringify(data), { metadata: { updated: now } });
                const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
                return new Response(JSON.stringify({
                    status: "ok",
                    total: Object.values(counts).reduce((a, b) => a + b, 0),
                    per_category: counts,
                    failed: failed.length ? failed : "none",
                    updated_at: now
                }, null, 2), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
            } catch (e) {
                return new Response(JSON.stringify({ status: "error", message: e.message }), {
                    status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS }
                });
            }
        }

        if (path === "/status") {
            const [raw, ts] = await Promise.all([
                env.NEWS_KV.get("latest_news"),
                env.NEWS_KV.get("last_updated")
            ]);
            if (!raw) return new Response(
                JSON.stringify({ status: "empty", hint: "Call /update first" }),
                { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
            );
            const counts = Object.fromEntries(Object.entries(JSON.parse(raw)).map(([k, v]) => [k, v.length]));
            return new Response(
                JSON.stringify({ status: "ok", last_updated: ts, per_category: counts }),
                { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
            );
        }

        // Default: serve from KV
        const raw = await env.NEWS_KV.get("latest_news");
        if (!raw) return new Response(
            JSON.stringify({ error: "No data. Call /update first." }),
            { status: 503, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
        );
        return new Response(raw, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
                ...CORS_HEADERS
            }
        });
    },

    // Cron: κάθε 5 λεπτά
    // async scheduled(event, env, ctx) {
    //     ctx.waitUntil(
    //         fetchAll().then(async ({ data, failed }) => {
    //             await env.NEWS_KV.put("latest_news",  JSON.stringify(data));
    //             await env.NEWS_KV.put("last_updated", new Date().toISOString());
    //             console.log("Cron OK:", Object.entries(data).map(([k, v]) => `${k}:${v.length}`).join(" "));
    //             if (failed.length) console.log("Cron FAILED:", failed.join(", "));
    //         }).catch(e => console.error("Cron failed:", e.message))
    //     );
    // }
};
