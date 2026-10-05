// ─── String ────────────────────────────────────────────────────────────────────

// DOMParser documents are inert: unlike innerHTML on a live element, no images
// load and no onerror/onload handlers from a feed's HTML can run.
export function stripHtml(html) {
    return new DOMParser().parseFromString(String(html ?? ''), 'text/html').body.textContent || '';
}

// ─── Date ──────────────────────────────────────────────────────────────────────

export function timeAgo(dateString) {
    if (!dateString) return 'Άγνωστη ημερομηνία';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Άγνωστη ημερομηνία';

    const seconds = Math.floor((Date.now() - date) / 1000);
    const intervals = [
        [31536000, 'χρόνο',  'χρόνια'],
        [2592000,  'μήνα',   'μήνες'],
        [86400,    'μέρα',   'μέρες'],
        [3600,     'ώρα',    'ώρες'],
        [60,       'λεπτό',  'λεπτά'],
    ];

    for (const [secs, singular, plural] of intervals) {
        const n = Math.floor(seconds / secs);
        if (n >= 1) return `Πριν από ${n} ${n === 1 ? singular : plural}`;
    }

    return 'Μόλις τώρα';
}
