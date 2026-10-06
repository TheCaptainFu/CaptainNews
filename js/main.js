// ─── Imports ───────────────────────────────────────────────────────────────────

import { WORKER_URL, IS_LOCAL, categoryOrder } from './config.js?v=78';
import { buildSection } from './templates.js?v=78';
import { initSearch } from './search.js?v=78';
import { escapeHtml, safeUrl } from './utils.js?v=78';
import { dedupeNews } from './dedupe.js?v=78';

// ─── News loader ───────────────────────────────────────────────────────────────

// functions/_middleware.js embeds the news JSON into the page on the edge.
function readEmbeddedNews() {
    const el = document.getElementById('news-data');
    if (!el) return null;
    try {
        return JSON.parse(el.textContent);
    } catch {
        return null;
    }
}

async function fetchNews() {
    const url      = IS_LOCAL ? `/news.json?t=${Date.now()}` : WORKER_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load news');
    return response.json();
}

async function loadNews() {
    const mainWrapper = document.getElementById('main-content-wrapper');
    if (!mainWrapper) return;

    try {
        const data = dedupeNews(readEmbeddedNews() ?? await fetchNews(), categoryOrder);
        mainWrapper.innerHTML = '';

        const orderedKeys = [
            ...categoryOrder.filter(k => k in data),
            ...Object.keys(data).filter(k => !categoryOrder.includes(k)),
        ];

        for (const categoryKey of orderedKeys) {
            mainWrapper.appendChild(buildSection(categoryKey, data[categoryKey]));
        }

        setupFilterLogic();
        populateTicker(data);
        initSearch(data);

    } catch (err) {
        console.error('loadNews error:', err);
        mainWrapper.innerHTML = `<div class="gg-container text-white text-center pt-10">Σφάλμα φόρτωσης.</div>`;
    }
}

// ─── Ticker ────────────────────────────────────────────────────────────────────

function populateTicker(data) {
    const ticker = document.getElementById('ticker-content');
    if (!ticker) return;

    let headlines = Object.values(data).flatMap(articles => articles.slice(0, 4));
    headlines.sort((a, b) => new Date(b.date) - new Date(a.date));
    headlines = headlines.slice(0, 24);

    const sep   = '<span class="text-zinc-700 mx-6 select-none">⚓</span>';
    const items = headlines.map(a =>
        `<a href="${escapeHtml(safeUrl(a.link))}" target="_blank" rel="noopener noreferrer"
            class="text-zinc-300 hover:text-[#f2d06f] text-[11px] font-condensed font-bold uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap">
            ${escapeHtml(a.title)}
         </a>`
    ).join(sep);

    ticker.innerHTML = items + sep + items;
}

// ─── Category filter ───────────────────────────────────────────────────────────

function setupFilterLogic() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    const pills = filterContainer.querySelectorAll('.filter-pill');
    const mainWrapper = document.getElementById('main-content-wrapper');

    if (!mainWrapper || mainWrapper.style.display === 'none') return;

    function applyFilter(selected) {
        pills.forEach(p =>
            p.classList.toggle('active', p.getAttribute('data-category') === selected)
        );

        const allSections = document.querySelectorAll('.category-group');
        allSections.forEach(section => {
            const visible = selected === 'all' || section.getAttribute('data-category') === selected;
            section.style.display = visible ? 'block' : 'none';
            section.querySelector('.section-header')?.classList.toggle('mt-[20px]', visible);
        });

        const firstVisible = Array.from(allSections).find(s => s.style.display !== 'none');
        firstVisible?.querySelector('.section-header')?.classList.remove('mt-[20px]');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    pills.forEach(pill =>
        pill.addEventListener('click', e => {
            e.preventDefault();
            applyFilter(pill.getAttribute('data-category'));
        })
    );

    applyFilter(document.body.dataset.category || 'all');
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const burgerBtn    = document.getElementById('burger-btn');
const sidebarMenu  = document.getElementById('sidebar-menu');
const menuOverlay  = document.getElementById('menu-overlay');
const closeSidebar = document.getElementById('close-sidebar');

function openSidebar() {
    sidebarMenu?.classList.remove('translate-x-full');
    menuOverlay?.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}

function closeSidebarFn() {
    sidebarMenu?.classList.add('translate-x-full');
    menuOverlay?.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
}

burgerBtn?.addEventListener('click', e => { e.stopPropagation(); openSidebar(); });
closeSidebar?.addEventListener('click', closeSidebarFn);
menuOverlay?.addEventListener('click', closeSidebarFn);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebarFn(); });

// ─── Header weather + clock ────────────────────────────────────────────────────
// Open-Meteo is free, keyless and CORS-enabled, so the browser calls it directly
// and it doesn't count against the Cloudflare Worker request limits.

(() => {
    const el = document.getElementById('header-info');
    if (!el) return;

    let temp = null;
    const clock = () => new Date().toLocaleTimeString('el-GR', {
        timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const render = () => {
        el.textContent = temp === null ? clock() : `${temp}° ATH · ${clock()}`;
    };

    render();
    setInterval(render, 15000);

    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.98&longitude=23.73&current=temperature_2m&timezone=Europe%2FAthens')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(d => { temp = Math.round(Number(d.current.temperature_2m)); render(); })
        .catch(e => console.error('header weather:', e));
})();

// ─── Ticker scroll hide/show ───────────────────────────────────────────────────

let lastScrollY = 0;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y <= 10)               document.body.classList.remove('ticker-hidden');
    else if (y > lastScrollY + 5) document.body.classList.add('ticker-hidden');
    else if (y < lastScrollY - 5) document.body.classList.remove('ticker-hidden');
    lastScrollY = y;
}, { passive: true });

// ─── Global helpers (called from inline onclick in templates) ──────────────────

// The link comes from the button's data-link attribute, never from an inline
// JS string, so a quote in a feed URL can't break out of the onclick handler.
window.copyArticleLink = btn => {
    navigator.clipboard.writeText(btn.dataset.link || '').then(() => {
        const label = btn.querySelector('.copy-label');
        const icon  = btn.querySelector('.copy-icon');
        icon.innerHTML    = '<polyline points="20 6 9 17 4 12"></polyline>';
        label.textContent = 'COPIED!';
        const hoverColor = getComputedStyle(btn).getPropertyValue('--card-hover-color').trim();
        if (hoverColor) btn.style.setProperty('--card-link-color', hoverColor);
        setTimeout(() => {
            icon.innerHTML    = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
            label.textContent = 'COPY';
            btn.style.removeProperty('--card-link-color');
        }, 2000);
    });
};

// One card per click: card width + the flex gap between cards.
window.scrollCarousel = (categoryKey, dir) => {
    const track = document.getElementById(`carousel-${categoryKey}`);
    const card  = track?.firstElementChild;
    if (!card) return;
    const step = card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
};

// "+N πηγές": small popover listing the other sources of a merged story.
// Built with DOM APIs from the button's data attribute (feed data, untrusted).
(() => {
    let pop = null;
    const close = () => { pop?.remove(); pop = null; };

    window.showSources = btn => {
        const wasOpenForThis = pop && pop.dataset.for === btn.dataset.sources;
        close();
        if (wasOpenForThis) return;

        let items = [];
        try { items = JSON.parse(btn.dataset.sources || '[]'); } catch { return; }

        pop = document.createElement('div');
        pop.dataset.for = btn.dataset.sources;
        pop.setAttribute('role', 'dialog');
        pop.className = 'fixed z-[90] w-[min(320px,calc(100vw-24px))] bg-zinc-900 text-white border border-zinc-700 rounded-[10px] shadow-2xl p-[10px]';

        const head = document.createElement('div');
        head.className = 'text-zinc-400 font-condensed font-bold text-[11px] uppercase tracking-widest px-[6px] pb-[6px]';
        head.textContent = 'Το ίδιο θέμα από';
        pop.appendChild(head);

        for (const it of items) {
            const a = document.createElement('a');
            a.href = safeUrl(it.link);
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'block px-[6px] py-[6px] rounded-[6px] hover:bg-zinc-800 transition-colors';
            const src = document.createElement('div');
            src.className = 'text-[#f2d06f] font-condensed font-bold text-[12px]';
            src.textContent = it.source;
            const title = document.createElement('div');
            title.className = 'text-[13px] leading-[17px] font-condensed line-clamp-2';
            title.textContent = it.title;
            a.append(src, title);
            pop.appendChild(a);
        }
        document.body.appendChild(pop);

        const r = btn.getBoundingClientRect();
        const left = Math.min(Math.max(12, r.left), window.innerWidth - pop.offsetWidth - 12);
        const below = r.bottom + 6 + pop.offsetHeight < window.innerHeight;
        pop.style.left = `${left}px`;
        pop.style.top  = `${below ? r.bottom + 6 : Math.max(12, r.top - pop.offsetHeight - 6)}px`;
    };

    document.addEventListener('click', e => {
        if (pop && !pop.contains(e.target) && !e.target.closest('.more-sources')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
})();

window.loadAllArticles = categoryKey => {
    document.querySelectorAll(`.hidden-item-${categoryKey}`).forEach(el => el.classList.remove('hidden'));
    document.getElementById(`btn-${categoryKey}`)?.remove();
};

// ─── Install banner (PWA) ───────────────────────────────────────────────────────
// beforeinstallprompt only fires on Chromium browsers (Android/desktop Chrome,
// Edge) that already meet the install criteria — iOS Safari has no equivalent
// API, so there's no reliable way to trigger a custom prompt there.
(() => {
    const banner    = document.getElementById('install-banner');
    const btn       = document.getElementById('install-btn');
    const dismiss   = document.getElementById('install-dismiss');
    const menuBtn   = document.getElementById('install-menu-btn');
    if ((!banner || !btn || !dismiss) && !menuBtn) return;

    const DISMISS_KEY  = 'installBannerDismissedAt';
    const DISMISS_DAYS = 14;

    function wasDismissedRecently() {
        const ts = Number(localStorage.getItem(DISMISS_KEY));
        return ts && (Date.now() - ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    }

    let deferredPrompt = null;

    async function triggerInstall() {
        banner?.classList.add('hidden');
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        if (banner && !wasDismissedRecently()) banner.classList.remove('hidden');
    });

    btn?.addEventListener('click', triggerInstall);
    menuBtn?.addEventListener('click', triggerInstall);

    dismiss?.addEventListener('click', () => {
        banner.classList.add('hidden');
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    });

    window.addEventListener('appinstalled', () => banner?.classList.add('hidden'));
})();

// ─── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadNews);
