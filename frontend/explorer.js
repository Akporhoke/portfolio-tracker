/* ============================================
   GAZE — STOCK EXPLORER (Part 3)

   Load this AFTER app.js and settings-extras.js:
   <script src="app.js"></script>
   <script src="settings-extras.js"></script>
   <script src="explorer.js"></script>

   Uses GET /api/stocks (the route added to
   stocks.js). Prices are only fetched when you
   tap a stock, never for the whole list.
   ============================================ */

(function () {

    'use strict';

    const PAGE_SIZE = 30;

    const ex = {
        q: '',
        market: '',
        sector: '',
        sp500: false,

        page: 0,
        pages: 1,
        total: 0,

        items: [],

        loading: false,
        error: false,
        started: false,

        reqId: 0,
        selected: null,
        priceReqId: 0
    };

    const byId = id => document.getElementById(id);


    /* ----------------------------------------
       STYLES (injected, so no CSS edit needed)
       ---------------------------------------- */

    function ensureStyles() {

        if (byId('explorerStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'explorerStyles';

        style.textContent = `

            .ex-search {
                width: 100%;
                height: 44px;
                padding: 0 14px;
                margin-bottom: 10px;
                border: 1px solid rgba(128, 128, 128, 0.25);
                border-radius: 12px;
                background: var(--bg-card);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 14px;
                box-sizing: border-box;
            }

            .ex-search:focus {
                outline: none;
                border-color: #087F73;
                box-shadow: 0 0 0 3px rgba(8, 127, 115, 0.12);
            }

            .ex-filters {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .ex-filters select {
                flex: 1;
                min-width: 0;
                height: 40px;
                padding: 0 10px;
                border: 1px solid rgba(128, 128, 128, 0.25);
                border-radius: 10px;
                background: var(--bg-card);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 12px;
            }

            .ex-chip {
                height: 40px;
                padding: 0 12px;
                border: 1px solid rgba(128, 128, 128, 0.25);
                border-radius: 10px;
                background: var(--bg-card);
                color: var(--text-secondary);
                font-family: inherit;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
                cursor: pointer;
            }

            .ex-chip.active {
                background: #087F73;
                border-color: #087F73;
                color: #fff;
            }

            .ex-count {
                margin: 0 2px 10px;
                font-size: 12px;
                color: var(--text-secondary);
            }

            .ex-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ex-row {
                cursor: pointer;
            }

            .ex-row:active {
                transform: scale(0.99);
            }

            .ex-row .stock-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .ex-badge {
                margin-left: 6px;
                padding: 2px 6px;
                border-radius: 999px;
                background: rgba(8, 127, 115, 0.14);
                color: #087F73;
                font-size: 9px;
                font-weight: 700;
                vertical-align: middle;
            }

            .ex-more {
                margin-top: 12px;
            }

            .ex-note {
                padding: 28px 0;
                text-align: center;
                font-size: 13px;
                color: var(--text-secondary);
            }

            .ex-note button {
                margin-top: 10px;
                padding: 8px 16px;
                border: 1px solid #087F73;
                border-radius: 10px;
                background: transparent;
                color: #087F73;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .ex-modal-name {
                margin: 0;
                font-size: 14px;
                color: var(--text-secondary);
                text-align: center;
            }

            .ex-modal-change {
                margin: 6px 0 0;
                font-size: 13px;
                font-weight: 600;
            }

            .ex-modal-change.positive {
                color: #00a651;
            }

            .ex-modal-change.negative {
                color: var(--error);
            }

            .ex-modal-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
        `;

        document.head.appendChild(style);
    }


    /* ----------------------------------------
       HELPERS
       ---------------------------------------- */

    function fmt(value) {

        if (typeof formatNumber === 'function') {
            return formatNumber(value);
        }

        return Number(value).toLocaleString(
            'en-US',
            { maximumFractionDigits: 2 }
        );
    }


    function cleanName(name) {

        return String(name || '')
            .replace(/\s+(Common Stock|Ordinary Shares)$/i, '')
            .trim();
    }


    function currencyOf(market) {
        return market === 'US' ? '$' : '₦';
    }


    function compact(value) {

        const n = Number(value);

        if (!(n > 0)) {
            return '';
        }

        const units = [
            [1e12, 'T'],
            [1e9, 'B'],
            [1e6, 'M']
        ];

        for (const [size, letter] of units) {

            if (n >= size) {
                return String(
                    parseFloat((n / size).toFixed(2))
                ) + letter;
            }
        }

        return fmt(n);
    }


    function safe(text) {

        return typeof escapeHtml === 'function'
            ? escapeHtml(text)
            : String(text ?? '');
    }


    /* ----------------------------------------
       LOAD
       ---------------------------------------- */

    async function load(reset) {

        if (ex.loading && !reset) {
            return;
        }

        const myReq = ++ex.reqId;

        if (reset) {
            ex.page = 0;
            ex.pages = 1;
            ex.total = 0;
            ex.items = [];
        }

        ex.loading = true;
        ex.error = false;
        render();

        const params = new URLSearchParams({
            page: String(ex.page + 1),
            limit: String(PAGE_SIZE)
        });

        if (ex.q) {
            params.set('q', ex.q);
        }

        if (ex.market) {
            params.set('market', ex.market);
        }

        if (ex.sector) {
            params.set('sector', ex.sector);
        }

        if (ex.sp500) {
            params.set('sp500', 'true');
        }

        try {

            const res =
                await fetch(`${API_BASE}/stocks?${params}`);

            if (!res.ok) {
                throw new Error(`Status ${res.status}`);
            }

            const data = await res.json();

            // A newer request replaced this one
            if (myReq !== ex.reqId) {
                return;
            }

            const results =
                Array.isArray(data.results)
                    ? data.results
                    : [];

            ex.items = ex.items.concat(results);
            ex.page = Number(data.page) || ex.page + 1;
            ex.pages = Number(data.pages) || 1;
            ex.total = Number(data.total) || 0;
            ex.error = false;

        } catch (err) {

            if (myReq !== ex.reqId) {
                return;
            }

            console.error('[Explorer] load failed:', err);
            ex.error = true;

        } finally {

            if (myReq === ex.reqId) {
                ex.loading = false;
                render();
            }
        }
    }


    /* ----------------------------------------
       RENDER
       ---------------------------------------- */

    function render() {

        const list = byId('exList');
        const count = byId('exCount');
        const more = byId('exMore');

        if (!list || !count || !more) {
            return;
        }

        // Count line
        if (ex.loading && ex.items.length === 0) {
            count.textContent = 'Loading…';
        } else if (ex.error) {
            count.textContent = '';
        } else if (ex.total === 0) {
            count.textContent = 'No stocks match';
        } else {
            count.textContent =
                `${fmt(ex.total)} stocks`;
        }

        // List
        if (ex.loading && ex.items.length === 0) {

            if (typeof ensureSkeletonStyles === 'function') {
                ensureSkeletonStyles();
            }

            list.innerHTML =
                typeof skeletonRowsHtml === 'function'
                    ? skeletonRowsHtml(5)
                    : '';

            more.classList.add('hidden');
            return;
        }

        if (ex.error && ex.items.length === 0) {

            list.innerHTML = `
                <div class="ex-note">
                    Couldn’t load stocks. Check your connection.
                    <br>
                    <button type="button" id="exRetry">Try again</button>
                </div>
            `;

            more.classList.add('hidden');
            return;
        }

        if (ex.items.length === 0) {

            list.innerHTML = `
                <div class="ex-note">
                    No stocks match your search. Try fewer filters.
                </div>
            `;

            more.classList.add('hidden');
            return;
        }

        list.innerHTML = ex.items
            .map((stock, i) => {

                const sign = currencyOf(stock.market);

                const cap =
                    compact(stock.marketCap);

                const color =
                    typeof API_COLORS !== 'undefined'
                        ? API_COLORS[i % API_COLORS.length]
                        : '#087F73';

                return `
                    <div
                        class="stock-item ex-row"
                        data-i="${i}"
                        role="button"
                        tabindex="0"
                    >
                        <div
                            class="stock-avatar"
                            style="background: ${color}"
                        >
                            ${safe((stock.ticker || '?')[0])}
                        </div>

                        <div class="stock-info">
                            <p class="stock-ticker">
                                ${safe(stock.ticker)}
                                ${
                                    stock.isSP500
                                        ? '<span class="ex-badge">S&amp;P 500</span>'
                                        : ''
                                }
                            </p>
                            <p class="stock-name">
                                ${safe(cleanName(stock.name))}
                            </p>
                        </div>

                        <div class="stock-price">
                            <p class="stock-value">
                                ${cap ? sign + cap : '—'}
                            </p>
                            <p class="stock-name">
                                ${safe(stock.market)}
                            </p>
                        </div>
                    </div>
                `;
            })
            .join('');

        // Load more button
        const hasMore = ex.page < ex.pages;

        more.classList.toggle('hidden', !hasMore);
        more.disabled = ex.loading;
        more.textContent =
            ex.loading
                ? 'Loading…'
                : 'Load more';
    }


    /* ----------------------------------------
       DETAIL SHEET
       ---------------------------------------- */

    function statRow(label, value) {

        return `
            <div class="stat-row">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${safe(value)}</span>
            </div>
        `;
    }


    async function openDetail(index) {

        const stock = ex.items[index];

        if (!stock) {
            return;
        }

        ex.selected = stock;

        const myPriceReq = ++ex.priceReqId;
        const sign = currencyOf(stock.market);

        byId('exModalTicker').textContent = stock.ticker;
        byId('exModalName').textContent = cleanName(stock.name);
        byId('exModalPrice').textContent = 'Loading…';

        const changeEl = byId('exModalChange');
        changeEl.textContent = '';
        changeEl.className = 'ex-modal-change';

        const cap = compact(stock.marketCap);

        byId('exModalStats').innerHTML =
            statRow('Market', stock.market === 'US'
                ? 'United States'
                : 'Nigeria (NGX)') +
            statRow('Sector', stock.sector || '—') +
            statRow('Industry', stock.industry || '—') +
            statRow('Market cap', cap ? sign + cap : '—') +
            statRow('S&P 500', stock.isSP500 ? 'Yes' : 'No');

        byId('explorerModal').classList.add('active');

        // Live price, fetched only now
        let data = null;

        if (typeof getStockPrice === 'function') {
            data = await getStockPrice(
                stock.ticker,
                stock.market
            );
        }

        // Another stock was opened meanwhile
        if (myPriceReq !== ex.priceReqId) {
            return;
        }

        const price =
            data && (data.price ?? data.currentPrice);

        if (price == null) {
            byId('exModalPrice').textContent = 'Unavailable';
            return;
        }

        byId('exModalPrice').textContent =
            `${sign}${fmt(price)}`;

        const pct = Number(data.changePercent);

        if (Number.isFinite(pct)) {

            changeEl.textContent =
                `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}% today`;

            changeEl.className =
                `ex-modal-change ${pct >= 0 ? 'positive' : 'negative'}`;
        }
    }


    function closeDetail() {

        byId('explorerModal')
            .classList.remove('active');

        ex.priceReqId++;
    }


    function startAdd(kind) {

        const stock = ex.selected;

        if (!stock) {
            return;
        }

        closeDetail();

        openAddStockModal();

        const tabBtn = document.querySelector(
            `.modal-tab-btn[data-form="${kind}"]`
        );

        if (tabBtn) {
            tabBtn.click();
        }

        const ids =
            kind === 'watchlist'
                ? ['watchTicker', 'watchSector', 'watchMarket']
                : ['addTicker', 'addSector', 'addMarket'];

        selectStock(
            stock.ticker,
            stock.sector || '',
            stock.market,
            ids[0],
            ids[1],
            ids[2]
        );

        // If the sector is not in the dropdown, show
        // "Select sector" instead of a blank box
        const sectorSelect = byId(ids[1]);

        if (sectorSelect && sectorSelect.selectedIndex === -1) {
            sectorSelect.selectedIndex = 0;
        }
    }


    /* ----------------------------------------
       INIT
       ---------------------------------------- */

    function init() {

        ensureStyles();

        let searchTimer = null;

        const search = byId('exSearch');

        if (search) {

            search.addEventListener('input', () => {

                clearTimeout(searchTimer);

                searchTimer = setTimeout(() => {
                    ex.q = search.value.trim();
                    load(true);
                }, 350);
            });
        }

        const market = byId('exMarket');

        if (market) {
            market.addEventListener('change', () => {
                ex.market = market.value;
                load(true);
            });
        }

        const sector = byId('exSector');

        if (sector) {
            sector.addEventListener('change', () => {
                ex.sector = sector.value;
                load(true);
            });
        }

        const chip = byId('exSp500');

        if (chip) {
            chip.addEventListener('click', () => {
                ex.sp500 = !ex.sp500;
                chip.classList.toggle('active', ex.sp500);
                load(true);
            });
        }

        const more = byId('exMore');

        if (more) {
            more.addEventListener('click', () => load(false));
        }

        const list = byId('exList');

        if (list) {

            list.addEventListener('click', event => {

                if (event.target.closest('#exRetry')) {
                    load(true);
                    return;
                }

                const row = event.target.closest('.ex-row');

                if (row) {
                    openDetail(Number(row.dataset.i));
                }
            });
        }

        const modal = byId('explorerModal');

        if (modal) {
            modal.addEventListener('click', event => {
                if (event.target === modal) {
                    closeDetail();
                }
            });
        }

        const close = byId('exModalClose');

        if (close) {
            close.addEventListener('click', closeDetail);
        }

        const addWatch = byId('exAddWatch');

        if (addWatch) {
            addWatch.addEventListener(
                'click',
                () => startAdd('watchlist')
            );
        }

        const addPortfolio = byId('exAddPortfolio');

        if (addPortfolio) {
            addPortfolio.addEventListener(
                'click',
                () => startAdd('portfolio')
            );
        }
    }


    // Load the first page the first time Explorer opens
    const originalSwitchTab = window.switchTab;

    if (typeof originalSwitchTab === 'function') {

        window.switchTab = function (tabName, ...rest) {

            const result =
                originalSwitchTab.call(this, tabName, ...rest);

            if (tabName === 'explorer' && !ex.started) {
                ex.started = true;
                load(true);
            }

            return result;
        };
    }


    document.addEventListener('DOMContentLoaded', init);

})();
