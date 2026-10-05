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
    'gossip',
    'gaming',
    'cinema',
    'strikes'
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
    cinema:          'CINE',
    gaming:          'GAMING',
    strikes:         'ΑΠΕΡΓΙΕΣ',
};

// ─── Per-category visual theme ─────────────────────────────────────────────────
// color          : accent color for heading, gradient line, source link
// cardBg         : card background (hex/rgba). Empty = default dark grey
// sectionBg      : full-section solid background. Empty = none
// sectionBgImage : full-section background image URL. Empty = none
// featuredReverse: true = image δεξιά στο featured άρθρο
// isNew          : true = εμφανίζει "NEW" badge στον τίτλο και το pill
// sectionLayout  : 'default' | 'magazine' | 'carousel' | 'poster' | 'bento' | 'timeline'
//   default  → 1 featured full-width + grid 3 στήλες
//   magazine → 1 μεγάλο αριστερά + στοίβα μικρών δεξιά
//   carousel → οριζόντια σειρά που σέρνεται (μόνο στην αρχική· στη σελίδα κατηγορίας γίνεται default)
//   poster   → ψηλές κάρτες που σέρνονται, με μεγάλο τίτλο πάνω στη φωτογραφία (μόνο στην αρχική· στη σελίδα κατηγορίας γίνεται bento)
//   bento    → 1 μεγάλη + 4 μικρές κάρτες με τίτλο πάνω στη φωτογραφία, και από κάτω grid
//   timeline → κάθετη γραμμή χρόνου, ομαδοποιημένη ανά μέρα (ΣΗΜΕΡΑ / ΧΘΕΣ / …)
// cardPadding    : false = αφαιρεί το εσωτερικό padding του card (default: true)
// titleColor     : χρώμα τίτλου άρθρου. Το ίδιο χρησιμοποιείται και στο "Πηγή" text και στο "πριν X ώρες"
// descriptionColor: χρώμα περιγραφής άρθρου. Το ίδιο χρησιμοποιείται και στο κουμπί "COPY"
// hoverColor     : χρώμα hover για όλα τα anchors/κουμπιά του card (τίτλος, πηγή, share, COPY)

export const categoryAccents = {
    greece_news: {
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
        hoverColor: '#3749bd'
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
        hoverColor: '#3749bd'
    },

    sports: {
        color: '#000000',
        cardBg: 'transparent',
        sectionBg: '#F7F3EE',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'poster',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#f2d06f'
    },

    technology: {
        color: '#000000',
        cardBg: 'none',
        sectionBg: '#E6ECF2',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'magazine',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#3749bd'
    },

    music: {
        color: '#000000',
        cardBg: 'none',
        sectionBg: '#F7F3EE',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: 'black',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#3749bd'
    },

    gossip: {
        color: '#ec4899',
        cardBg: 'none',
        sectionBg: '#FCB0BA',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'bento',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#ec4899'
    },

    cinema: {
        color: '#F7F3EE',
        cardBg: 'none',
        sectionBg: '#dc2626',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'carousel',
        cardPadding: true,
        titleColor: '#F7F3EE',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#000000'
    },

    gaming: {
        color: '#3749BD',
        cardBg: 'none',
        sectionBg: '#F7F3EE',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: false,
        sectionLayout: 'default',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#3749bd'
    },

    strikes: {
        color: '#b91c1c',
        cardBg: 'none',
        sectionBg: '#F7F3EE',
        sectionBgImage: '',
        featuredReverse: false,
        isNew: true,
        sectionLayout: 'timeline',
        cardPadding: true,
        titleColor: '#000000',
        descriptionColor: 'rgba(0,0,0,0.8)',
        hoverColor: '#b91c1c'
    },
};

// ─── Source homepage URLs ──────────────────────────────────────────────────────

export const sourceUrls = {
    'ABC Intl':      'https://abcnews.go.com',
    'BBC World':     'https://www.bbc.com/news/world',
    'Cinepivates':   'https://cinepivates.gr',
    'CNN.gr':        'https://www.cnn.gr',
    'Efsyn':         'https://www.efsyn.gr',
    'Ertnews':       'https://www.ertnews.gr',
    'FreeCinema':    'https://freecinema.gr',
    'Gameslife':     'https://gameslife.gr',
    'Iefimerida':    'https://www.iefimerida.gr',
    'IGuru':         'https://iguru.gr',
    'In.gr':         'https://www.in.gr',
    'In.gr World':   'https://www.in.gr',
    'Mad TV':        'https://mad.tv',
    'Monopoli':      'https://www.monopoli.gr/tag/mousiki/',
    'Naftemporiki':  'https://www.naftemporiki.gr',
    'Newsbeast':     'https://www.newsbeast.gr',
    'Newsit':        'https://www.newsit.gr',
    'Popaganda':     'https://popaganda.gr/category/art/music/',
    'Protothema':    'https://www.protothema.gr',
    'Ragequit':      'https://ragequit.gr',
    'Techblog':      'https://techblog.gr',
    'Techgear':      'https://www.techgear.gr',
    'Techmaniacs':   'https://techmaniacs.gr',
    'The Guardian':  'https://www.theguardian.com/politics',
    'The Hill':      'https://thehill.com',
    'Unboxholics':   'https://unboxholics.com',
    'VG24':          'https://www.vg24.gr',
};
