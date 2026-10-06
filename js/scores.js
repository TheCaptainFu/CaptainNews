// ─── Today's scores strip inside the Αθλητικά section ──────────────────────────
// Data from /api/scores (functions/api/scores.js). Hidden when there are no
// games today; refreshes every 60s only while a game is live and the tab is visible.

import { escapeHtml } from './utils.js?v=84';

const REFRESH_MS = 60_000;
const COMP_KEY   = 'scoresCompetition';

// Dropdown order: Greek league and Euroleague first, then European clubs, then national teams.
const COMP_ORDER = ['Super League', 'Euroleague', 'Champions League', 'Europa League', 'Conference League',
    'UEFA Super Cup', 'Nations League', 'Προκρ. Μουντιάλ', 'Προκρ. Euro', 'Μουντιάλ', 'Euro', 'Φιλικό'];

const savedComp = () => { try { return localStorage.getItem(COMP_KEY) || 'all'; } catch { return 'all'; } };
const saveComp  = v => { try { localStorage.setItem(COMP_KEY, v); } catch { /* private mode */ } };
const timeFmt = new Intl.DateTimeFormat('el-GR', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function status(m) {
    if (m.state === 'live') {
        return `<span class="flex items-center gap-[5px] text-[#dc2626]">
                    <span class="w-[6px] h-[6px] rounded-full bg-[#dc2626] animate-pulse"></span>${escapeHtml(m.clock || 'LIVE')}
                </span>`;
    }
    if (m.state === 'final') return '<span class="text-zinc-500">ΤΕΛ</span>';
    return `<span class="text-zinc-600">${escapeHtml(timeFmt.format(new Date(m.start)))}</span>`;
}

function row(name, score, winner) {
    return `<div class="flex items-center justify-between gap-[10px]">
                <span class="truncate ${winner ? 'font-bold' : ''}">${escapeHtml(name)}</span>
                <span class="tabular-nums font-bold">${score ?? ''}</span>
            </div>`;
}

function chip(m, showComp) {
    const done = m.state === 'final';
    const icon = `<i class="fa-solid ${m.sport === 'basketball' ? 'fa-basketball' : 'fa-futbol'} mr-[4px]"></i>`;
    const live = m.state === 'live';
    return `
        <div class="shrink-0 snap-start w-[172px] rounded-[10px] bg-white px-[12px] py-[9px] font-condensed text-[14px] leading-[19px] text-black ${live ? 'shadow-[inset_3px_0_0_#dc2626,0_1px_3px_rgba(0,0,0,0.08)]' : 'shadow-[0_1px_3px_rgba(0,0,0,0.08)]'}">
            <div class="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide pb-[5px]">
                <span class="truncate text-zinc-400">${showComp ? `${icon}${escapeHtml(m.comp)}` : ''}</span>${status(m)}
            </div>
            ${row(m.home, m.homeScore, done && m.homeScore > m.awayScore)}
            ${row(m.away, m.awayScore, done && m.awayScore > m.homeScore)}
        </div>`;
}

// Mouse drag-to-scroll for desktop (touch devices already swipe natively).
// Snap is paused while dragging so the row follows the pointer, then snaps on release.
function enableDragScroll(el) {
    let startX = 0, startScroll = 0, dragging = false, moved = false;
    el.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        dragging = true; moved = false;
        startX = e.clientX; startScroll = el.scrollLeft;
    });
    el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) < 4) return;
        if (!moved) { moved = true; el.style.scrollSnapType = 'none'; el.classList.replace('cursor-grab', 'cursor-grabbing'); el.setPointerCapture(e.pointerId); }
        el.scrollLeft = startScroll - dx;
    });
    const end = () => {
        if (!dragging) return;
        dragging = false;
        el.style.scrollSnapType = '';
        el.classList.replace('cursor-grabbing', 'cursor-grab');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    // A drag shouldn't count as a click on whatever is under the pointer.
    el.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
}

export function initScores() {
    const section = document.getElementById('section-sports');
    const header  = section?.querySelector('.section-header');
    // Category pages keep the other sections in the DOM but hidden: don't fetch there.
    if (!header || section.style.display === 'none') return;

    const box = document.createElement('div');
    box.id = 'live-scores';
    box.className = 'gg-container pb-[16px] hidden';
    header.insertAdjacentElement('afterend', box);

    function render(matches) {
        if (!matches.length) { box.innerHTML = ''; return; }
        const counts = new Map();
        for (const m of matches) counts.set(m.comp, (counts.get(m.comp) || 0) + 1);
        const comps = [...counts.keys()].sort((x, y) =>
            (COMP_ORDER.indexOf(x) + 1 || 99) - (COMP_ORDER.indexOf(y) + 1 || 99));
        let selected = savedComp();
        if (selected !== 'all' && !counts.has(selected)) selected = 'all';
        const shown = selected === 'all' ? matches : matches.filter(m => m.comp === selected);

        const options = [`<option value="all">Όλες οι διοργανώσεις (${matches.length})</option>`,
            ...comps.map(c => `<option value="${escapeHtml(c)}"${c === selected ? ' selected' : ''}>${escapeHtml(c)} (${counts.get(c)})</option>`)].join('');
        const liveCount = shown.filter(m => m.state === 'live').length;
        const lead = liveCount
            ? `<span class="flex items-center gap-[6px] text-[#dc2626]"><span class="w-[7px] h-[7px] rounded-full bg-[#dc2626] animate-pulse"></span>${liveCount} LIVE</span>`
            : '<span>ΣΗΜΕΡΑ</span>';
        // The fade on the right edge hints that the row scrolls; it uses a mask so it
        // works on any section background.
        box.innerHTML = `
            <div class="flex items-center justify-between gap-3 pt-[4px] pb-[8px] font-condensed font-bold text-[12px] uppercase tracking-widest text-zinc-500">
                ${lead}
                <label class="relative flex items-center cursor-pointer text-zinc-700 hover:text-black">
                    <select aria-label="Διοργάνωση" class="scores-comp appearance-none bg-transparent pr-[16px] text-right font-condensed font-bold text-[12px] uppercase tracking-wide cursor-pointer outline-none">${options}</select>
                    <i class="fa-solid fa-chevron-right rotate-90 absolute right-0 text-[9px] pointer-events-none"></i>
                </label>
            </div>
            <div class="scores-row no-scrollbar flex gap-[10px] overflow-x-auto snap-x pb-[4px] cursor-grab select-none [mask-image:linear-gradient(to_right,black_88%,transparent)]">
                ${shown.map(m => chip(m, selected === 'all')).join('')}
            </div>`;
        enableDragScroll(box.querySelector('.scores-row'));
        box.querySelector('.scores-comp').addEventListener('change', e => {
            saveComp(e.target.value);
            render(matches);
        });
    }

    let timer = null;
    let staleWhileHidden = false;
    async function load() {
        clearTimeout(timer);
        timer = null;
        staleWhileHidden = false;
        let data;
        try {
            const res = await fetch('/api/scores');
            if (!res.ok) throw new Error(res.status);
            data = await res.json();
        } catch {
            box.classList.add('hidden');
            return;
        }
        const matches = data.matches || [];
        box.classList.toggle('hidden', !matches.length);
        render(matches);
        if (matches.some(m => m.state === 'live')) {
            timer = setTimeout(() => {
                timer = null;
                if (document.hidden) staleWhileHidden = true; else load();
            }, REFRESH_MS);
        }
    }

    document.addEventListener('visibilitychange', () => { if (!document.hidden && staleWhileHidden) load(); });
    load();
}
