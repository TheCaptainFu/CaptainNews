// ─── Header search over the articles already loaded on the page ───────────────

import { categoryDisplayNames } from './config.js?v=88';
import { timeAgo } from './utils.js?v=88';

const MAX_RESULTS = 30;

// Accent-, case- and final-sigma-insensitive, so "απεργια" matches "ΑΠΕΡΓΊΑ".
const normalize = s => String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/ς/g, 'σ');

const escapeHtml = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// DOMParser documents are inert: no image loads or handlers fire.
const toText = html => new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent || '';

const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '#');

function buildIndex(data) {
    const seen = new Set();
    const index = [];
    for (const [category, articles] of Object.entries(data)) {
        for (const a of articles) {
            if (!a.link || seen.has(a.link)) continue;
            seen.add(a.link);
            index.push({
                ...a,
                category,
                titleNorm: normalize(a.title),
                bodyNorm:  normalize(`${toText(a.description)} ${a.source}`),
            });
        }
    }
    return index;
}

function search(index, query) {
    const terms = normalize(query).split(/\s+/).filter(t => t.length > 1);
    if (!terms.length) return [];
    return index
        .filter(a => terms.every(t => a.titleNorm.includes(t) || a.bodyNorm.includes(t)))
        .map(a => ({ a, inTitle: terms.filter(t => a.titleNorm.includes(t)).length }))
        .sort((x, y) => y.inTitle - x.inTitle || new Date(y.a.date) - new Date(x.a.date))
        .slice(0, MAX_RESULTS)
        .map(r => r.a);
}

function resultHtml(a) {
    const img = a.image ? escapeHtml(safeUrl(a.image)) : '/icons/default-image.png?v=2';
    const cat = categoryDisplayNames[a.category] || '';
    return `
        <a href="${escapeHtml(safeUrl(a.link))}" target="_blank" rel="noopener noreferrer"
           class="flex items-center gap-3 p-2 rounded-[8px] hover:bg-zinc-800 transition-colors">
            <img src="${img}" alt="" width="72" height="48" loading="lazy"
                 class="w-[72px] h-[48px] shrink-0 rounded-[6px] object-cover bg-zinc-800"
                 onerror="this.src='/icons/default-image.png?v=2'">
            <div class="min-w-0">
                <div class="text-white font-condensed font-bold text-[15px] leading-[19px] line-clamp-2">${escapeHtml(a.title)}</div>
                <div class="text-zinc-400 font-condensed text-[11px] mt-[3px] truncate">
                    ${escapeHtml(a.source)}${cat ? ` · ${escapeHtml(cat)}` : ''} · ${escapeHtml(timeAgo(a.date))}
                </div>
            </div>
        </a>`;
}

function buildOverlay() {
    const el = document.createElement('div');
    el.id = 'search-overlay';
    el.className = 'fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Αναζήτηση ειδήσεων');
    el.innerHTML = `
        <div class="search-panel mx-auto mt-[16px] md:mt-[90px] w-[calc(100%-24px)] max-w-[680px] bg-zinc-900 border border-zinc-800 rounded-[12px] shadow-2xl overflow-hidden">
            <div class="flex items-center gap-3 px-4 h-[56px] border-b border-zinc-800">
                <i class="fa-solid fa-magnifying-glass text-zinc-500"></i>
                <input id="search-input" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" spellcheck="false"
                       placeholder="Αναζήτηση ειδήσεων…"
                       class="flex-1 min-w-0 bg-transparent text-white font-condensed text-[17px] outline-none placeholder:text-zinc-500">
                <button id="search-close" aria-label="Κλείσιμο αναζήτησης" class="text-zinc-400 hover:text-white cursor-pointer p-1">
                    <i class="fa-solid fa-xmark text-[18px]"></i>
                </button>
            </div>
            <div id="search-results" class="max-h-[70vh] overflow-y-auto p-2"></div>
        </div>`;
    document.body.appendChild(el);
    return el;
}

export function initSearch(data) {
    const btn = document.getElementById('search-btn');
    if (!btn || !data) return;

    // Built on first open, not on page load: most visitors never search.
    let index = null;
    const overlay = buildOverlay();
    const input   = overlay.querySelector('#search-input');
    const results = overlay.querySelector('#search-results');

    const hint = `<div class="text-zinc-500 font-condensed text-[14px] px-3 py-6 text-center">Γράψε π.χ. «απεργία», «Μητσοτάκης», «Ολυμπιακός»</div>`;

    function render() {
        const q = input.value.trim();
        if (normalize(q).replace(/\s/g, '').length < 2) { results.innerHTML = hint; return; }
        index ??= buildIndex(data);
        const found = search(index, q);
        results.innerHTML = found.length
            ? `<div class="text-zinc-500 font-condensed text-[12px] px-2 pb-1">${found.length === MAX_RESULTS ? `${MAX_RESULTS}+` : found.length} αποτελέσματα</div>` + found.map(resultHtml).join('')
            : `<div class="text-zinc-500 font-condensed text-[14px] px-3 py-6 text-center">Δεν βρέθηκε τίποτα για «${escapeHtml(q)}»</div>`;
    }

    function open() {
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        render();
        input.focus();
        input.select();
    }

    function close() {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        btn.focus();
    }

    btn.addEventListener('click', open);
    input.addEventListener('input', render);
    overlay.querySelector('#search-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
        const isOpen = !overlay.classList.contains('hidden');
        if (e.key === 'Escape' && isOpen) close();
        if (e.key === '/' && !isOpen && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
            e.preventDefault();
            open();
        }
    });
}
