/* ============================================
   GAZE — DIVIDEND DATA FOR THE MARKET CALENDAR
   Load BEFORE market-calendar.js
   Reads only from Gaze's own API: /api/dividends
   ============================================ */

(function () {
    'use strict';

    const pad = (n) => String(n).padStart(2, '0');

    const esc = (s) =>
        String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    function apiBase() {
        return (typeof API_BASE !== 'undefined') ? API_BASE : '/api';
    }

    function fmtDate(key) {
        if (!key) return null;
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-GB',
            { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function fmtAmount(rec) {
        if (rec.dividendPerShare == null) return 'Amount not reported';
        const n = Number(rec.dividendPerShare);
        if (!Number.isFinite(n)) return 'Amount not reported';
        const sign = rec.currency === 'USD' ? '$' : '₦';
        return `${sign}${n.toLocaleString('en-US',
            { minimumFractionDigits: 2, maximumFractionDigits: 4 })} per share`;
    }

    function typeLabel(t) {
        if (t === 'interim') return 'Interim dividend';
        if (t === 'final') return 'Final dividend';
        return 'Dividend';
    }

    const EVENT_LABELS = {
        'ex-dividend': 'Ex-dividend date',
        record: 'Record date',
        payment: 'Payment date'
    };

    /* ---------- Data ---------- */

    async function fetchMonth(y, m) {
        const res = await fetch(`${apiBase()}/dividends?month=${y}-${pad(m + 1)}`);
        if (!res.ok) throw new Error(`Dividends HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.events)) {
            throw new Error(data.error || 'Unexpected dividends response');
        }
        const byDate = {};
        data.events.forEach((e) => {
            if (!e.date) return;
            if (!byDate[e.date]) byDate[e.date] = [];
            byDate[e.date].push(e);
        });
        return byDate;
    }

    async function fetchHistory(symbol) {
        const res = await fetch(`${apiBase()}/dividends/${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error(`History HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.records)) {
            throw new Error(data.error || 'Unexpected history response');
        }
        return data.records;
    }

    /* ---------- Rendering pieces ---------- */

    function markHtml(list) {
        return list && list.length
            ? '<span class="dv-mark" title="Dividend event"></span>'
            : '';
    }

    function ariaText(list) {
        if (!list || !list.length) return '';
        return `, ${list.length} dividend event${list.length > 1 ? 's' : ''}`;
    }

    function eventCardHtml(e) {
        const meta = [fmtAmount(e), typeLabel(e.dividendType), e.financialPeriod]
            .filter(Boolean).join(' · ');
        const dates = [
            `Ex-dividend: ${fmtDate(e.exDividendDate) || 'not reported'}`,
            `Record: ${fmtDate(e.recordDate) || 'not reported'}`,
            `Payment: ${fmtDate(e.paymentDate) || 'not reported'}`
        ].join(' · ');

        return `
            <div class="mc-market-card dv-card">
                <div class="mc-market-head">
                    <span class="mc-market-name">${esc(e.symbol)}</span>
                    <span class="dv-tag">${esc(EVENT_LABELS[e.eventType] || 'Event')}</span>
                </div>
                ${e.companyName ? `<p class="mc-reason">${esc(e.companyName)}</p>` : ''}
                <p class="dv-meta">${esc(meta)}</p>
                <p class="mc-type">${esc(dates)}</p>
                                <p class="mc-type">${esc(dates)}</p>
                ${e.rawDeclaredText ? `<p class="mc-type">Provider note: ${esc(e.rawDeclaredText)}</p>` : ''}
                <button type="button" class="dv-link" data-history="${esc(e.symbol)}">
                    View dividend history
                </button>
            </div>`;
    }

    function sectionHtml(list, failed) {
        if (failed) {
            return `<div class="dv-section">
                        <h4 class="dv-heading">Dividends</h4>
                        <p class="dv-empty">Dividend data is unavailable right now.</p>
                    </div>`;
        }
        if (!list || !list.length) return '';
        return `<div class="dv-section">
                    <h4 class="dv-heading">Dividends</h4>
                    ${list.map(eventCardHtml).join('')}
                </div>`;
    }

    function historyHtml(symbol, records, loading, failed) {
        let body;
        if (loading) {
            body = '<p class="mc-status-msg">Loading dividend history…</p>';
        } else if (failed) {
            body = '<p class="mc-status-msg">Could not load the dividend history.</p>';
        } else if (!records || !records.length) {
            body = '<p class="mc-status-msg">No dividend history recorded for this company yet.</p>';
        } else {
            body = records.map((r) => {
                const meta = [typeLabel(r.dividendType), r.financialPeriod]
                    .filter(Boolean).join(' · ');
                return `
                    <div class="mc-market-card dv-card">
                        <div class="mc-market-head">
                            <span class="mc-market-name">${esc(fmtDate(r.exDividendDate) || 'Date not reported')}</span>
                            <span class="dv-tag">${esc(fmtAmount(r))}</span>
                        </div>
                        <p class="dv-meta">${esc(meta)}</p>
                        <p class="mc-type">Ex-dividend date · Payment: ${esc(fmtDate(r.paymentDate) || 'not reported')}</p>
                    </div>`;
            }).join('');
        }

        return `
            <div class="mc-header">
                <button type="button" class="dv-back" data-history-back>‹ Calendar</button>
                <h3 class="mc-title">${esc(symbol)}</h3>
                <span style="width:36px"></span>
            </div>
            ${body}
            <p class="dv-note">Dividend data comes from Kobo Terminal and may be incomplete or change.</p>`;
    }

    window.GazeDividends = {
        fetchMonth,
        fetchHistory,
        markHtml,
        ariaText,
        sectionHtml,
        historyHtml
    };
})();