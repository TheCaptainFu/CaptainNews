// ─── Site Configuration ───────────────────────────────────────────────────────

export const WORKER_URL            = 'https://captainnews-worker.g-gsmks.workers.dev';
export const IS_LOCAL              = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const INITIAL_VISIBLE_COUNT = 7;

// ─── Section display order ─────────────────────────────────────────────────────

export const categoryOrder = [
    'greece_news',
    'politics_greece',
    'world_politics',
    'sports',
    'mundial',
    'technology',
    'music',
];

// ─── Category display names ────────────────────────────────────────────────────

export const categoryDisplayNames = {
    greece_news:     'ΕΛΛΑΔΑ ΕΠΙΚΑΙΡΟΤΗΤΑ',
    politics_greece: 'ΠΟΛΙΤΙΚΑ ΕΛΛΑΔΑ',
    world_politics:  'ΠΑΓΚΟΣΜΙΑ ΠΟΛΙΤΙΚΗ',
    sports:          'ΑΘΛΗΤΙΚΑ',
    technology:      'ΤΕΧΝΟΛΟΓΙΑ',
    music:           'ΜΟΥΣΙΚΗ',
    mundial:         'MUNDIAL',
};

// ─── Per-category visual theme ─────────────────────────────────────────────────
// color     : accent color for heading, gradient line, source link, read-more
// cardBg    : card background (hex). Empty string = default dark grey
// sectionBg : full-section background (hex). Empty string = no background

export const categoryAccents = {
    greece_news:     { color: '#4f72ff', cardBg: '',sectionBg: '',        sectionBgImage: '', featuredReverse: false },
    politics_greece: { color: '#ffffff', cardBg: '',sectionBg: '#3749bd', sectionBgImage: '', featuredReverse: true  },
    world_politics:  { color: '#4f72ff', cardBg: '',sectionBg: '',        sectionBgImage: '', featuredReverse: false },
    sports:          { color: '#4f72ff',cardBg: '',sectionBg: '', sectionBgImage: '', featuredReverse: false },
    mundial:         { color: '#ffffff', cardBg: 'rgba(26,18,0,0.82)', sectionBg: '',        sectionBgImage: '/icons/mundial-bg.webp', featuredReverse: true, isNew: true },
    technology:      { color: '#4f72ff', cardBg: '',sectionBg: '',        sectionBgImage: '', featuredReverse: false },
    music:           { color: '#4f72ff', cardBg: '#120d1a', sectionBg: '',        sectionBgImage: '', featuredReverse: false },
};

// ─── Source homepage URLs ──────────────────────────────────────────────────────

export const sourceUrls = {
    'Newsit':        'https://www.newsit.gr',
    'Kathimerini':   'https://www.kathimerini.gr',
    'In.gr':         'https://www.in.gr',
    'Macropolis':    'https://www.macropolis.gr',
    'Gazzetta':      'https://www.gazzetta.gr',
    'Sport24':       'https://www.sport24.gr',
    'Contra':        'https://www.contra.gr',
    'SDNA':          'https://www.sdna.gr',
    'Insomnia':      'https://www.insomnia.gr',
    'The Verge':     'https://www.theverge.com',
    'TechCrunch':    'https://techcrunch.com',
    'Wired':         'https://www.wired.com',
    'Pitchfork':     'https://pitchfork.com',
    'Rolling Stone': 'https://www.rollingstone.com',
    'Billboard':     'https://www.billboard.com',
    'Resident Advisor': 'https://ra.co',
    'Reuters':       'https://www.reuters.com',
    'BBC World':     'https://www.bbc.com/news/world',
    'The Guardian':  'https://www.theguardian.com',
    'Politico':      'https://www.politico.eu',
    'Protothema':    'https://www.protothema.gr',
    'Newsbeast':     'https://www.newsbeast.gr',
    'Thetoc':        'https://www.thetoc.gr',
    'Iefimerida':    'https://www.iefimerida.gr',
    'Skai':          'https://www.skai.gr',
    'Ant1':          'https://www.ant1news.gr',
    'ABC Intl':      'https://abcnews.go.com',
    'The Hill':      'https://thehill.com',
    'VOA News':      'https://www.voanews.com',
    'In.gr World':   'https://www.in.gr',
    'BBC Sport':     'https://www.bbc.com/sport',
    'BBC Tech':      'https://www.bbc.com/news/technology',
    'ESPN':          'https://www.espn.com',
    'Digitallife':   'https://www.digitallife.gr',
    'Pcsteps':       'https://www.pcsteps.gr',
    'Techgear':      'https://www.techgear.gr',
    'Youfly':        'https://www.youfly.gr',
    'In.gr Music':   'https://www.in.gr',
    'Skai Music':    'https://www.skai.gr',
    'Newsbomb Music':'https://www.newsbomb.gr',
    'Musicfollow':   'https://musicfollow.gr',
    'Sky Sports':    'https://www.skysports.com',
    'Hacker News':   'https://news.ycombinator.com',
    'BBC Football':  'https://www.bbc.com/sport/football',
    'Sky Football':  'https://www.skysports.com/football',
    'FourFourTwo':   'https://www.fourfourtwo.com',
    'Goal.com':      'https://www.goal.com',
    'UEFA':          'https://www.uefa.com',
};
