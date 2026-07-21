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
    'technology',
    'music',
    'gossip'
];

// ─── Category display names ────────────────────────────────────────────────────

export const categoryDisplayNames = {
    greece_news:     'ΕΛΛΑΔΑ ΕΠΙΚΑΙΡΟΤΗΤΑ',
    politics_greece: 'ΠΟΛΙΤΙΚΑ ΕΛΛΑΔΑ',
    world_politics:  'ΠΑΓΚΟΣΜΙΑ ΠΟΛΙΤΙΚΗ',
    sports:          'ΑΘΛΗΤΙΚΑ',
    technology:      'ΤΕΧΝΟΛΟΓΙΑ',
    music:           'ΜΟΥΣΙΚΗ',
    gossip:          'GOSSIP',
};

// ─── Per-category visual theme ─────────────────────────────────────────────────
// color          : accent color for heading, gradient line, source link, read-more
// cardBg         : card background (hex/rgba). Empty = default dark grey
// sectionBg      : full-section solid background. Empty = none
// sectionBgImage : full-section background image URL. Empty = none
// featuredReverse: true = image δεξιά στο featured άρθρο
// isNew          : true = εμφανίζει "NEW" badge στον τίτλο και το pill
// sectionLayout  : 'default' | 'magazine'
//   default  → 1 featured full-width + grid 3 στήλες
//   magazine → 1 μεγάλο αριστερά + στοίβα μικρών δεξιά
// cardPadding    : false = αφαιρεί το εσωτερικό padding του card (default: true)
// titleColor     : χρώμα τίτλου άρθρου. Το ίδιο χρησιμοποιείται και στο "Πηγή" text και στο "πριν X ώρες"
// descriptionColor: χρώμα περιγραφής άρθρου. Το ίδιο χρησιμοποιείται και στο κουμπί "COPY"
// hoverColor     : χρώμα hover για όλα τα anchors/κουμπιά του card (τίτλος, πηγή, COPY, Διαβάστε ->)

export const categoryAccents = {
    greece_news: {
        color: '#3749bd',
        cardBg: 'none',
        sectionBg: '#000000',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: '#ffffff',
        descriptionColor: 'rgba(255,255,255,0.8)',
        hoverColor: '#f2d06f'
    },

    politics_greece: {
        color: '#ffffff',
        cardBg: 'none',
        sectionBg: '#151F38',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'magazine',
        cardPadding: true,
        titleColor: '#ffffff',
        descriptionColor: 'rgba(255,255,255,0.8)',
        hoverColor: '#f2d06f'
    },

    world_politics:  {
        color: '#000000',
        cardBg: 'transparent',
        sectionBg: '#FFEECC',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#f2d06f'
    },

    sports: {
        color: '#000000',
        cardBg: 'transparent',
        sectionBg: '#F7F3EE',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#f2d06f'
    },

    technology: {
        color: '#ffffff',
        cardBg: 'none',
        sectionBg: '#000000',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'magazine',
        cardPadding: true,
        titleColor: '#ffffff',
        descriptionColor: 'rgba(255,255,255,0.7)',
        hoverColor: '#f2d06f'
    },

    music: {
        color: '#000000',
        cardBg: 'none',
        sectionBg: '#E6ECF2',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: 'black',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#f2d06f'
    },

    gossip: {
        color: '#ec4899',
        cardBg: 'none',
        sectionBg: '#FCB0BA',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#ec4899'
    },
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
