// GET /api/scores: today's football (ESPN) and Euroleague games, with live scores.
//
// Neither source is called from the browser: Euroleague's schedule API sends no
// CORS headers, and one aggregated, edge-cached response keeps both upstreams
// from seeing a request per visitor. Cached 30s while games are live, 5min
// otherwise. ESPN's API is public but unofficial; any source that fails is just
// left out, and the page hides the strip when there are no games.

const TZ = 'Europe/Athens';
const CACHE_VERSION = 2;

const FOOTBALL = [
    ['gre.1',            'Super League'],
    ['uefa.champions',   'Champions League'],
    ['uefa.europa',      'Europa League'],
    ['uefa.europa.conf', 'Conference League'],
    ['uefa.super_cup',   'UEFA Super Cup'],
    ['uefa.nations',     'Nations League'],
    ['fifa.worldq.uefa', 'Προκρ. Μουντιάλ'],
    ['uefa.euroq',       'Προκρ. Euro'],
    ['fifa.friendly',    'Φιλικό'],
    ['fifa.world',       'Μουντιάλ'],
    ['uefa.euro',        'Euro'],
];

// Greek names for the teams Greek readers look for; everything else stays as the source sends it.
const GREEK_NAMES = [
    [/olympiacos|olympiakos/i, 'Ολυμπιακός'], [/panathinaikos/i, 'Παναθηναϊκός'], [/^aek/i, 'ΑΕΚ'],
    [/^paok/i, 'ΠΑΟΚ'], [/^aris/i, 'Άρης'], [/^ofi/i, 'ΟΦΗ'], [/asteras/i, 'Αστέρας Τρίπολης'],
    [/atromitos/i, 'Ατρόμητος'], [/panetolikos/i, 'Παναιτωλικός'], [/^volos/i, 'Βόλος'],
    [/lamia/i, 'Λαμία'], [/levadiakos/i, 'Λεβαδειακός'], [/panserraikos/i, 'Πανσερραϊκός'],
    [/kifisia/i, 'Κηφισιά'], [/^ael|larissa/i, 'ΑΕΛ'], [/^greece$/i, 'Ελλάδα'],
];
const greek = name => (GREEK_NAMES.find(([re]) => re.test(name || '')) || [])[1] || name || '';

// National teams: English country name → Greek, built from the runtime's ICU data
// (Intl.DisplayNames), plus the football names that aren't ISO regions.
const COUNTRY_EXTRA = {
    'England': 'Αγγλία', 'Scotland': 'Σκωτία', 'Wales': 'Ουαλία', 'Northern Ireland': 'Βόρεια Ιρλανδία',
    'Republic of Ireland': 'Ιρλανδία', 'Turkey': 'Τουρκία', 'Türkiye': 'Τουρκία', 'USA': 'ΗΠΑ',
    'United States': 'ΗΠΑ', 'Bosnia-Herzegovina': 'Βοσνία-Ερζεγοβίνη', 'Ivory Coast': 'Ακτή Ελεφαντοστού',
    'Czech Republic': 'Τσεχία', 'Czechia': 'Τσεχία', 'North Macedonia': 'Βόρεια Μακεδονία', 'Kosovo': 'Κόσοβο', 'Netherlands': 'Ολλανδία',
};
let countryMap = null;
function countryGreek(name) {
    if (!countryMap) {
        countryMap = new Map(Object.entries(COUNTRY_EXTRA));
        try {
            const en = new Intl.DisplayNames(['en'], { type: 'region' });
            const el = new Intl.DisplayNames(['el'], { type: 'region' });
            const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (const x of A) for (const y of A) {
                const code = x + y;
                const e = en.of(code), g = el.of(code);
                if (e && g && e !== code && g !== code && !countryMap.has(e)) countryMap.set(e, g);
            }
        } catch { /* no ICU: keep the English names */ }
    }
    return countryMap.get(name) || greek(name);
}
const NATIONAL = new Set(['uefa.nations', 'fifa.worldq.uefa', 'uefa.euroq', 'fifa.friendly', 'fifa.world', 'uefa.euro']);

const athensDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);   // 2026-10-06

async function getJson(url, ms = 8000) {
    const res = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'Mozilla/5.0 CaptainNews' } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

async function football(today) {
    const ymd = today.replace(/-/g, '');
    const leagues = await Promise.allSettled(FOOTBALL.map(async ([code, label]) => {
        const j = await getJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${ymd}`);
        return (j.events || []).map(e => {
            const comp = e.competitions?.[0] || {};
            const side = ha => comp.competitors?.find(c => c.homeAway === ha) || {};
            const home = side('home'), away = side('away');
            const state = e.status?.type?.state;                 // pre | in | post
            return {
                sport: 'football', comp: label, start: e.date,
                state: state === 'in' ? 'live' : state === 'post' ? 'final' : 'scheduled',
                clock: state === 'in' ? (e.status?.type?.shortDetail || e.status?.displayClock || '') : '',
                home: (NATIONAL.has(code) ? countryGreek : greek)(home.team?.displayName || home.team?.shortDisplayName),
                away: (NATIONAL.has(code) ? countryGreek : greek)(away.team?.displayName || away.team?.shortDisplayName),
                homeScore: state === 'pre' ? null : Number(home.score ?? 0),
                awayScore: state === 'pre' ? null : Number(away.score ?? 0),
            };
        });
    }));
    return leagues.flatMap(r => (r.status === 'fulfilled' ? r.value : []))
        .filter(m => athensDay(new Date(m.start)) === today || m.state === 'live');
}

async function euroleague(today) {
    const base = 'https://api-live.euroleague.net/v2/competitions/E/seasons';
    const now = new Date();
    const season = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;   // seasons start in July
    const code = `E${season}`;

    const rounds = (await getJson(`${base}/${code}/rounds`)).data || [];
    const current = rounds.filter(r => new Date(r.minGameStartDate) <= now && now <= new Date(r.maxGameStartDate));
    const games = (await Promise.all(current.map(r =>
        getJson(`${base}/${code}/games?roundNumber=${r.round}`).then(j => j.data || []).catch(() => [])
    ))).flat().filter(g => athensDay(new Date(g.utcDate)) === today);

    return Promise.all(games.map(async g => {
        const started = new Date(g.utcDate) <= now;
        const m = {
            sport: 'basketball', comp: 'Euroleague', start: g.utcDate,
            state: g.played ? 'final' : 'scheduled', clock: '',
            home: greek(g.local?.club?.editorialName || g.local?.club?.name),
            away: greek(g.road?.club?.editorialName || g.road?.club?.name),
            homeScore: g.played ? Number(g.local?.score) : null,
            awayScore: g.played ? Number(g.road?.score) : null,
        };
        if (started && !g.played) {
            try {
                const h = await getJson(`https://live.euroleague.net/api/Header?gamecode=${g.gameCode}&seasoncode=${code}`, 5000);
                m.homeScore = Number(h.ScoreA); m.awayScore = Number(h.ScoreB);
                if (h.Live) { m.state = 'live'; m.clock = [h.Quarter, h.RemainingPartialTime].filter(Boolean).join(' ').trim(); }
                else if (Number(h.ScoreA) || Number(h.ScoreB)) m.state = 'final';
            } catch { /* keep the schedule entry */ }
        }
        return m;
    }));
}

async function build() {
    const today = athensDay(new Date());
    const [fb, el] = await Promise.allSettled([football(today), euroleague(today)]);
    const order = { live: 0, scheduled: 1, final: 2 };
    const matches = [...(fb.value || []), ...(el.value || [])]
        .sort((a, b) => order[a.state] - order[b.state] || new Date(a.start) - new Date(b.start));
    return { updated: new Date().toISOString(), matches };
}

export async function onRequestGet({ request, waitUntil }) {
    const cache = caches.default;
    // Bump CACHE_VERSION when the response format or names change, so old cached copies are ignored.
    const key = new Request(new URL(`/api/scores?cache=${CACHE_VERSION}`, request.url).toString());
    const hit = await cache.match(key);
    if (hit) return hit;

    let body;
    try {
        body = await build();
    } catch {
        body = { updated: new Date().toISOString(), matches: [] };
    }
    const ttl = body.matches.some(m => m.state === 'live') ? 30 : 300;
    const res = new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${ttl}` },
    });
    waitUntil(cache.put(key, res.clone()));
    return res;
}
