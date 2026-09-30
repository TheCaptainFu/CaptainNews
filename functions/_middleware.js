// Server-side injects the news into the static HTML pages so crawlers see real
// headlines + links instead of empty skeletons, and embeds the same data as
// JSON so js/main.js doesn't need a second request to the Worker.
//
// Only runs on the page routes listed in _routes.json (npm run build:routes),
// never on CSS/JS/images, so it doesn't burn the Workers free-tier requests.
//
// Data source, in order:
//   - localhost → /news.json (same as js/main.js does locally)
//   - env.NEWS_KV binding (Pages → Settings → Functions → KV bindings)
//   - the public Worker URL as fallback (costs one extra Worker request)

import categoriesConfig from '../categories.json';

const WORKER_URL   = 'https://captainnews-worker.g-gsmks.workers.dev';
const HOME_PER_CAT = 10;

const pathToCategory = Object.fromEntries(
    Object.entries(categoriesConfig).map(([key, cfg]) => [cfg.path, key])
);

const escapeHtml = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '#');

async function loadNewsJson(request, env) {
    const url = new URL(request.url);
    if (['localhost', '127.0.0.1'].includes(url.hostname)) {
        const res = await env.ASSETS.fetch(new URL('/news.json', url));
        return res.ok ? res.text() : null;
    }
    if (env.NEWS_KV) return env.NEWS_KV.get('latest_news');
    const res = await fetch(WORKER_URL);
    return res.ok ? res.text() : null;
}

function articleList(articles) {
    return '<ul>' + articles.map(a =>
        `<li><a href="${escapeHtml(safeUrl(a.link))}">${escapeHtml(a.title)}</a> — ${escapeHtml(a.source)}` +
        (a.date ? ` <time datetime="${escapeHtml(a.date)}">${escapeHtml(a.date.slice(0, 10))}</time>` : '') +
        `</li>`
    ).join('') + '</ul>';
}

function headlinesHtml(data, categoryKey) {
    const keys = categoryKey ? [categoryKey] : Object.keys(categoriesConfig);
    const blocks = keys
        .filter(k => data[k]?.length)
        .map(k => {
            const articles = categoryKey ? data[k] : data[k].slice(0, HOME_PER_CAT);
            return `<section><h2>${escapeHtml(categoriesConfig[k].displayName)}</h2>${articleList(articles)}</section>`;
        });
    // sr-only: same headlines the JS renders visibly moments later, so users
    // never see an unstyled list flash; main.js clears this on render.
    return `<div class="sr-only" id="ssr-headlines">${blocks.join('')}</div>`;
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const response = await next();

    const type = response.headers.get('content-type') || '';
    if (request.method !== 'GET' || !response.ok || !type.includes('text/html')) return response;

    let raw;
    try {
        raw = await loadNewsJson(request, env);
    } catch (e) {
        console.error('ssr: news load failed', e);
        return response;
    }
    if (!raw) return response;

    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return response;
    }

    const path = new URL(request.url).pathname.replace(/index\.html$/, '');
    const categoryKey = pathToCategory[path.endsWith('/') ? path : path + '/'] || null;

    const embedded = `<script id="news-data" type="application/json">${raw.replace(/</g, '\\u003c')}</script>`;

    const rewritten = new HTMLRewriter()
        .on('main#main-content-wrapper', {
            element(el) { el.append(headlinesHtml(data, categoryKey), { html: true }); },
        })
        .on('script[src*="/js/main.js"], script[src^="js/main.js"]', {
            element(el) { el.before(embedded, { html: true }); },
        })
        .transform(response);

    const headers = new Headers(rewritten.headers);
    headers.set('Cache-Control', 'no-cache, must-revalidate');
    return new Response(rewritten.body, { status: rewritten.status, headers });
}
