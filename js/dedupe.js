// ─── Duplicate handling for the news data (pure: no DOM, testable in Node) ────
//
// 1. Drops English translations that some Greek sources publish alongside the
//    Greek article (Unboxholics: /en/news/... next to /news/...).
// 2. An article that appears in several categories is kept only in the most
//    specific one (the general "greece_news" loses to e.g. sports).
// 3. The same story from different sources is merged into one article that
//    carries the others in `related`, rendered as a small "+N πηγές".
//    Merging rather than deleting means a wrong match never hides a story.

const GENERIC_CATEGORIES = ['greece_news'];

const MIN_TOKENS     = 4;            // very short titles are too ambiguous to compare
const MAX_HOURS_APART = 36;
const SIMILARITY     = 0.45;         // tuned against real feed data

const STOPWORDS = new Set((
    'και του της την των στο στη στην στον στα στις στους για απο με που ειναι θα να τα το τον τη οι ' +
    'η ο σε ως μετα κατα προσ οτι δεν ενα ενασ μια τι πωσ ολα νεα νεο νεεσ σημερα αυτο αυτη ' +
    'the and for with from that this into over after his her their its are was were has have will'
).split(' '));

export function normalizeUrl(u) {
    try {
        const x = new URL(u);
        return (x.hostname.replace(/^www\./, '') + x.pathname).replace(/\/+$/, '').toLowerCase();
    } catch {
        return String(u || '');
    }
}

const isEnglishEdition = u => {
    try { return /^\/en\//i.test(new URL(u).pathname); } catch { return false; }
};

function tokens(title) {
    const words = String(title || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/ς/g, 'σ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w))
        .map(w => w.slice(0, 6));            // crude stemming for Greek inflection
    return [...new Set(words)];
}

// Cosine similarity of IDF-weighted token sets: shared rare words ("Καρβέλας",
// "Λασίθι") count a lot, shared common ones ("Nations League", "στάση") little.
function similarity(a, b, idf) {
    const B = new Set(b);
    let dot = 0, na = 0, nb = 0;
    for (const t of a) { const w = idf.get(t) ** 2; na += w; if (B.has(t)) dot += w; }
    for (const t of b) nb += idf.get(t) ** 2;
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function dedupeNews(data, categoryOrder = []) {
    // 1. English editions
    const cleaned = {};
    for (const [cat, articles] of Object.entries(data || {})) {
        cleaned[cat] = (articles || []).filter(a => a && a.link && !isEnglishEdition(a.link));
    }

    // 2. Same article in several categories → keep the most specific one
    const priority = [
        ...categoryOrder.filter(c => !GENERIC_CATEGORIES.includes(c)),
        ...Object.keys(cleaned).filter(c => !categoryOrder.includes(c) && !GENERIC_CATEGORIES.includes(c)),
        ...GENERIC_CATEGORIES,
    ];
    const owner = new Map();
    for (const cat of priority) {
        for (const a of cleaned[cat] || []) {
            const key = normalizeUrl(a.link);
            if (!owner.has(key)) owner.set(key, cat);
        }
    }
    for (const cat of Object.keys(cleaned)) {
        const seen = new Set();
        cleaned[cat] = cleaned[cat].filter(a => {
            const key = normalizeUrl(a.link);
            if (owner.get(key) !== cat || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // 3. Same story from different sources → merge
    const all = Object.values(cleaned).flat();
    const df = new Map();
    const tokenCache = new Map(all.map(a => [a, tokens(a.title)]));
    for (const toks of tokenCache.values()) for (const t of toks) df.set(t, (df.get(t) || 0) + 1);
    const idf = new Map([...df].map(([t, n]) => [t, Math.log(1 + all.length / n)]));

    const out = {};
    for (const [cat, articles] of Object.entries(cleaned)) {
        const parent = articles.map((_, i) => i);
        const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        const sources = articles.map(a => new Set([a.source]));

        for (let i = 0; i < articles.length; i++) {
            const ti = tokenCache.get(articles[i]);
            if (ti.length < MIN_TOKENS) continue;
            for (let j = i + 1; j < articles.length; j++) {
                const tj = tokenCache.get(articles[j]);
                if (tj.length < MIN_TOKENS) continue;
                const hours = Math.abs(new Date(articles[i].date) - new Date(articles[j].date)) / 36e5;
                if (!(hours <= MAX_HOURS_APART)) continue;
                const ri = find(i), rj = find(j);
                if (ri === rj) continue;
                // never merge two articles of the same source: those are follow-ups
                if ([...sources[rj]].some(s => sources[ri].has(s))) continue;
                if (similarity(ti, tj, idf) >= SIMILARITY) {
                    parent[rj] = ri;
                    for (const s of sources[rj]) sources[ri].add(s);
                }
            }
        }

        const groups = new Map();
        articles.forEach((a, i) => { const r = find(i); (groups.get(r) || groups.set(r, []).get(r)).push(a); });

        // The kept card is the newest article that has an image (newest overall otherwise);
        // the rest become its `related` list. Output keeps newest-first order.
        out[cat] = [...groups.values()].map(group => {
            const byDate = [...group].sort((x, y) => new Date(y.date) - new Date(x.date));
            const main = byDate.find(a => a.image) || byDate[0];
            const related = byDate.filter(a => a !== main)
                .map(({ title, link, source, date }) => ({ title, link, source, date }));
            return related.length ? { ...main, related } : main;
        }).sort((x, y) => new Date(y.date) - new Date(x.date));
    }
    return out;
}
