import { WORKER_URL, IS_LOCAL, categoryOrder } from './config.js';
import { buildSection } from './templates.js';

// ─── News loader ───────────────────────────────────────────────────────────────

async function loadNews() {
    const mainWrapper = document.getElementById('main-content-wrapper');
    if (!mainWrapper) return;

    try {
        const url      = IS_LOCAL ? `/news.json?t=${Date.now()}` : WORKER_URL;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load news');

        const data = await response.json();
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
        `<a href="${a.link}" target="_blank" rel="noopener noreferrer"
            class="text-zinc-300 hover:text-[#f2d06f] text-[11px] font-condensed font-bold uppercase tracking-wide transition-colors cursor-pointer whitespace-nowrap">
            ${a.title}
         </a>`
    ).join(sep);

    ticker.innerHTML = items + sep + items;
}

// ─── Category filter ───────────────────────────────────────────────────────────

function setupFilterLogic() {
    const filterContainer = document.getElementById('category-filter');
    if (!filterContainer) return;

    const pills = filterContainer.querySelectorAll('.filter-pill');

    function applyFilter(selected) {
        pills.forEach(p =>
            p.classList.toggle('active', p.getAttribute('data-category') === selected)
        );

        const allSections = document.querySelectorAll('.category-group');
        allSections.forEach(section => {
            const visible = selected === 'all' || section.getAttribute('data-category') === selected;
            section.style.display = visible ? 'block' : 'none';
            section.querySelector('.section-header')?.classList.toggle('mt-[40px]', visible);
        });

        const firstVisible = Array.from(allSections).find(s => s.style.display !== 'none');
        firstVisible?.querySelector('.section-header')?.classList.remove('mt-[40px]');

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

window.copyArticleLink = (btn, url) => {
    navigator.clipboard.writeText(url).then(() => {
        const label = btn.querySelector('.copy-label');
        const icon  = btn.querySelector('.copy-icon');
        icon.innerHTML    = '<polyline points="20 6 9 17 4 12"></polyline>';
        label.textContent = 'COPIED!';
        btn.classList.replace('text-zinc-500', 'text-[#f2d06f]');
        setTimeout(() => {
            icon.innerHTML    = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
            label.textContent = 'COPY';
            btn.classList.replace('text-[#f2d06f]', 'text-zinc-500');
        }, 2000);
    });
};

window.loadAllArticles = categoryKey => {
    document.querySelectorAll(`.hidden-item-${categoryKey}`).forEach(el => el.classList.remove('hidden'));
    document.getElementById(`btn-${categoryKey}`)?.remove();
};

// ─── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', loadNews);
