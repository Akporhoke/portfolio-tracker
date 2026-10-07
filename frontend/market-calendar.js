/* ============================================
   GAZE — MARKET CALENDAR (Phase 1: UI foundation)
   Real date math. Market data comes from a provider
   function, so Phase 4 only swaps the provider.
   ============================================ */

(function () {
    'use strict';

    const MARKETS = [
        { id: 'NGX', label: 'NGX',        flag: '🇳🇬', cls: 'ngx' },
        { id: 'US',  label: 'US Markets', flag: '🇺🇸', cls: 'us'  }
    ];

    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // UI window: previous / current / next only.
    const MIN_OFFSET = -1;
    const MAX_OFFSET = 1;

    /* ---------- TEMPORARY TEST DATA ----------
       UI development only. Replaced by GET /api/market-calendar
       in Phase 4. Never treat this as real market truth.
       Weekends come from real weekday math, not this list. */
    const USE_TEST_DATA = false;
    const TEST_HOLIDAYS = {
        NGX: { '2026-10-01': { name: 'Independence Day', type: 'National holiday' } },
        US:  { '2026-11-26': { name: 'Thanksgiving Day', type: 'Market holiday' } }
    };

    /* ---------- Date helpers ---------- */

    const pad = (n) => String(n).padStart(2, '0');
    const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstWeekday = (y, m) => new Date(y, m, 1).getDay();

    function todayParts() {
        const t = new Date();
        return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
    }

    function monthFromOffset(offset) {
        const t = todayParts();
        const dt = new Date(t.y, t.m + offset, 1);
        return { y: dt.getFullYear(), m: dt.getMonth() };
    }

    /* ---------- Session provider ----------
       Returns { 'YYYY-MM-DD': { NGX: session, US: session } }
       session = { status: 'trading'|'closed'|'early_close',
                   reason: { type, name } | null } */

    function weekendOrTrading(y, m, d) {
        const wd = new Date(y, m, d).getDay();
        return (wd === 0 || wd === 6)
            ? { status: 'closed', reason: { type: 'Weekend', name: 'Weekend' } }
            : { status: 'trading', reason: null };
    }

    async function localTestProvider(y, m) {
        const out = {};
        for (let d = 1; d <= daysInMonth(y, m); d++) {
            const key = dateKey(y, m, d);
            out[key] = {};
            MARKETS.forEach((mk) => {
                const holiday = USE_TEST_DATA && TEST_HOLIDAYS[mk.id] && TEST_HOLIDAYS[mk.id][key];
                out[key][mk.id] = holiday
                    ? { status: 'closed', reason: holiday }
                    : weekendOrTrading(y, m, d);
            });
        }
        return out;
    }

    async function apiProvider(y, m) {
    const base = (typeof API_BASE !== 'undefined') ? API_BASE : '/api';
    const res = await fetch(`${base}/market-calendar?month=${y}-${pad(m + 1)}`);
    if (!res.ok) throw new Error('Calendar request failed');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Calendar error');
    return data.days;
}

let provider = apiProvider;

    /* ---------- State ---------- */

    const state = { offset: 0, selected: null, sessions: null, loading: false, error: false };

    let root = null;

    /* ---------- Data loading ---------- */

    async function load() {
        const { y, m } = monthFromOffset(state.offset);
        state.loading = true;
        state.error = false;
        render();
        try {
            state.sessions = await provider(y, m);
        } catch (err) {
            console.error('Market calendar load failed:', err);
            state.sessions = null;
            state.error = true;
        }
        state.loading = false;
        render();
    }

    function defaultSelection() {
        const t = todayParts();
        const { y, m } = monthFromOffset(state.offset);
        return (t.y === y && t.m === m) ? dateKey(y, m, t.d) : dateKey(y, m, 1);
    }

    function go(delta) {
        const next = state.offset + delta;
        if (next < MIN_OFFSET || next > MAX_OFFSET) return;
        state.offset = next;
        state.selected = defaultSelection();
        load();
    }

    /* ---------- Rendering ---------- */

    function statusText(session) {
        if (!session) return { label: 'Unavailable', cls: 'unknown' };
        if (session.status === 'trading') return { label: 'Trading', cls: 'trading' };
        if (session.status === 'early_close') return { label: 'Early close', cls: 'early' };
        return { label: 'Closed', cls: 'closed' };
    }

    function dotsHtml(key) {
        const day = state.sessions && state.sessions[key];
        return MARKETS.map((mk) => {
            const s = day && day[mk.id];
            const open = s && s.status !== 'closed';
            return `<span class="mc-dot ${mk.cls}${open ? '' : ' off'}"></span>`;
        }).join('');
    }

    function cellAria(key, d, monthName) {
        const day = state.sessions && state.sessions[key];
        const parts = MARKETS.map((mk) => {
            const s = day && day[mk.id];
            return `${mk.label} ${statusText(s).label.toLowerCase()}`;
        });
        return `${monthName} ${d}: ${parts.join(', ')}`;
    }

    function gridHtml(y, m) {
        const t = todayParts();
        const monthName = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long' });
        let html = WEEKDAYS.map((w) => `<div class="mc-weekday">${w}</div>`).join('');

        for (let i = 0; i < firstWeekday(y, m); i++) {
            html += '<div class="mc-day empty" aria-hidden="true"></div>';
        }

        for (let d = 1; d <= daysInMonth(y, m); d++) {
            const key = dateKey(y, m, d);
            const isToday = t.y === y && t.m === m && t.d === d;
            const isSel = state.selected === key;
            html += `
                <button type="button" class="mc-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}"
                        data-date="${key}" aria-label="${cellAria(key, d, monthName)}"
                        aria-pressed="${isSel}" ${isToday ? 'aria-current="date"' : ''}>
                    <span class="mc-day-num">${d}</span>
                    <span class="mc-dots">${dotsHtml(key)}</span>
                </button>`;
        }
        return html;
    }

    function detailsHtml() {
        if (!state.selected || !state.sessions) return '';
        const [yy, mm, dd] = state.selected.split('-').map(Number);
        const title = new Date(yy, mm - 1, dd).toLocaleDateString('en-US',
            { weekday: 'long', month: 'long', day: 'numeric' });
        const day = state.sessions[state.selected];

        const cards = MARKETS.map((mk) => {
            const s = day && day[mk.id];
            const st = statusText(s);
            const reason = s && s.reason
                ? `<p class="mc-reason">${s.reason.name}</p>
                   <p class="mc-type">${s.reason.type}</p>`
                : '';
            return `
                <div class="mc-market-card ${mk.cls}">
                    <div class="mc-market-head">
                        <span class="mc-market-name">${mk.flag} ${mk.label}</span>
                        <span class="mc-badge ${st.cls}">${st.label}</span>
                    </div>
                    ${reason}
                </div>`;
        }).join('');

        return `<h3 class="mc-details-title">${title}</h3>${cards}`;
    }

    function render() {
        if (!root) return;
        const { y, m } = monthFromOffset(state.offset);
        const title = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const body = state.loading
            ? '<p class="mc-status-msg">Loading calendar…</p>'
            : state.error
                ? '<p class="mc-status-msg">Could not load the calendar. Check your connection and try again.</p>'
                : `<div class="mc-grid">${gridHtml(y, m)}</div>
                   <div class="mc-legend">
                       <span><i class="mc-dot ngx"></i> NGX trading</span>
                       <span><i class="mc-dot us"></i> US trading</span>
                       <span><i class="mc-dot off"></i> Closed</span>
                   </div>
                   <div class="mc-details" aria-live="polite">${detailsHtml()}</div>`;

        root.innerHTML = `
            <div class="mc-header">
                <button type="button" class="mc-nav" data-nav="-1" aria-label="Previous month"
                        ${state.offset <= MIN_OFFSET ? 'disabled' : ''}>‹</button>
                <h3 class="mc-title">${title}</h3>
                <button type="button" class="mc-nav" data-nav="1" aria-label="Next month"
                        ${state.offset >= MAX_OFFSET ? 'disabled' : ''}>›</button>
            </div>
            ${body}`;
    }

    /* ---------- Events ---------- */

    function onClick(e) {
        const nav = e.target.closest('[data-nav]');
        if (nav) { go(Number(nav.dataset.nav)); return; }

        const cell = e.target.closest('.mc-day[data-date]');
        if (cell) {
            state.selected = cell.dataset.date;
            render();
        }
    }

    function init() {
        root = document.getElementById('marketCalendarRoot');
        if (!root) return;
        root.addEventListener('click', onClick);
        state.offset = 0;
        state.selected = defaultSelection();
        load();

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) load();
        });
    }

    /* Phase 4 calls setProvider with the API-backed function */
    window.GazeMarketCalendar = {
        refresh: load,
        setProvider(fn) { provider = fn; load(); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
