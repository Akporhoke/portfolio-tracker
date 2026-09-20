/* ============================================
   STATE MANAGEMENT
   ============================================ */

const state = {
    userId: 'user-1',
    userName: 'Orhoke',

    portfolio: {
        stocks: []
    },

    watchlist: {
        stocks: []
    },

    sold: {
        stocks: []
    },

    activity: [],

    settings: {
        goalAmount: 1000000
    },

    isOnline: navigator.onLine,
    lastUpdated: new Date(),
    currentTab: 'home',
    currentPeriod: '7',

    localActivity: [],
    activityClearedAt: null,

    exchangeRate: {
        usdToNgn: 1650,
        ngnToUsd: 0.000606,
        timestamp: new Date()
    },

    displayCurrency:
        localStorage.getItem('portfolioTrackerCurrency') || 'NGN',

    initialLoadComplete: false,

    portfolioSearch: '',
    portfolioSort: 'ticker-asc',

    watchlistSearch: '',
    watchlistSort: 'date-desc'
};


/* ============================================
   CONFIGURATION
   ============================================ */

const API_BASE = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
)
    ? 'http://localhost:5000/api'
    : 'https://portfolio-tracker-plwj.onrender.com/api';

console.log('API_BASE:', API_BASE);

const REFRESH_INTERVAL = 300000;
const TOAST_DURATION = 3000;
const UNDO_TOAST_DURATION = 6000;

const API_COLORS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
    'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
    'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
];


/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Portfolio Tracker loaded');

    initializeTime();
    setupEventListeners();
    setupTabNavigation();
    loadFromLocalStorage();
    loadLocalActivity();
    setupClearActivityButton();

    renderSkeletons();

    fetchAllData();

    setupNetworkListeners();
    
    syncCurrencyToggleUI();

    setInterval(fetchAllData, REFRESH_INTERVAL);
});


/* ============================================
   TIME & NETWORK
   ============================================ */

function initializeTime() {
    const updateTime = () => {
        const el = document.getElementById('currentTime');

        if (!el) return;

        const now = new Date();

        const hours =
            String(now.getHours()).padStart(2, '0');

        const minutes =
            String(now.getMinutes()).padStart(2, '0');

        el.textContent =
            `${hours}:${minutes}`;
    };

    updateTime();

    setInterval(
        updateTime,
        60000
    );
}


function setupNetworkListeners() {
    window.addEventListener('online', () => {
        state.isOnline = true;

        const warning =
            document.getElementById('networkWarning');

        const banner =
            document.getElementById('offlineBanner');

        if (warning) {
            warning.classList.add('hidden');
        }

        if (banner) {
            banner.classList.add('hidden');
        }

        showToast(
            'Connection restored',
            'success'
        );

        fetchAllData();
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;

        const warning =
            document.getElementById('networkWarning');

        const banner =
            document.getElementById('offlineBanner');

        if (warning) {
            warning.classList.remove('hidden');
        }

        if (banner) {
            banner.classList.remove('hidden');
        }

        showToast(
            'You are offline',
            'warning'
        );
    });
}


/* ============================================
   MODAL TAB SWITCHING
   ============================================ */

function setupModalTabs() {
    document
        .querySelectorAll('.modal-tab-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                e => {

                    const formType =
                        e.currentTarget.dataset.form;

                    document
                        .querySelectorAll(
                            '.modal-tab-btn'
                        )
                        .forEach(b =>
                            b.classList.remove(
                                'active'
                            )
                        );

                    e.currentTarget.classList.add(
                        'active'
                    );

                    document
                        .querySelectorAll(
                            '.modal-form'
                        )
                        .forEach(f =>
                            f.classList.remove(
                                'active'
                            )
                        );

                    const form =
                        document.getElementById(
                            `${formType}Form`
                        );

                    if (form) {
                        form.classList.add(
                            'active'
                        );
                    }
                }
            );
        });
}


/* ============================================
   EVENT LISTENERS
   ============================================ */

function setupEventListeners() {

    const addBtn =
        document.getElementById('addBtn');

    if (addBtn) {
        addBtn.addEventListener(
            'click',
            openAddStockModal
        );
    }


    const closeAddModal =
        document.getElementById('closeAddModal');

    if (closeAddModal) {
        closeAddModal.addEventListener(
            'click',
            closeAddStockModal
        );
    }


    const addPortfolio =
        document.getElementById('addToPortfolio');

    if (addPortfolio) {
        addPortfolio.addEventListener(
            'click',
            () => addStock('portfolio')
        );
    }


    const addWatchlist =
        document.getElementById('addToWatchlist');

    if (addWatchlist) {
        addWatchlist.addEventListener(
            'click',
            () => addStock('watchlist')
        );
    }


    const addTicker =
        document.getElementById('addTicker');

    if (addTicker) {
        addTicker.addEventListener(
            'input',
            e =>
                handleAutocomplete(
    e,
    'autocompleteDropdown',
    'addTicker',
    'addSector',
    'addMarket'
)
        );
    }


    const watchTicker =
        document.getElementById('watchTicker');

    if (watchTicker) {
        watchTicker.addEventListener(
            'input',
            e =>
   handleAutocomplete(
    e,
    'autocompleteDropdown2',
    'watchTicker',
    'watchSector',
    'watchMarket'
)
);
    }


    document
        .querySelectorAll('.duration-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                e => {

                    document
                        .querySelectorAll(
                            '.duration-btn'
                        )
                        .forEach(b =>
                            b.classList.remove(
                                'active'
                            )
                        );

                    e.currentTarget.classList.add(
                        'active'
                    );

                    const duration =
                        document.getElementById(
                            'watchDuration'
                        );

                    if (duration) {
                        duration.value =
                            e.currentTarget.dataset.duration;
                    }
                }
            );
        });


    const quantity =
        document.getElementById('addQuantity');

    if (quantity) {
        quantity.addEventListener(
            'input',
            validateQuantity
        );
    }


    const price =
        document.getElementById('addPrice');

    if (price) {
        price.addEventListener(
            'input',
            validatePrice
        );
    }


    const activityFilter =
        document.getElementById(
            'activityFilter'
        );

    if (activityFilter) {
        activityFilter.addEventListener(
            'change',
            filterActivity
        );
    }


    document
        .querySelectorAll('.toggle')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                e => {

                    document
                        .querySelectorAll(
                            '.toggle'
                        )
                        .forEach(b =>
                            b.classList.remove(
                                'active'
                            )
                        );

                    e.currentTarget.classList.add(
                        'active'
                    );

                    state.currentPeriod =
                        e.currentTarget.dataset.period;

                }
            );
        });


    const closeMarket =
        document.getElementById(
            'closeMarketModal'
        );

    if (closeMarket) {
        closeMarket.addEventListener(
            'click',
            closeMarketModal
        );
    }


    const saveSetting =
        document.getElementById(
            'saveSetting'
        );

    if (saveSetting) {
        saveSetting.addEventListener(
            'click',
            saveSettings
        );
    }


    document
        .querySelectorAll('.currency-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                e => {

                    const currency =
                        e.currentTarget.dataset.currency;

                    if (
                        !currency ||
                        currency ===
                        state.displayCurrency
                    ) {
                        return;
                    }

                    state.displayCurrency =
                        currency;

                    localStorage.setItem(
                        'portfolioTrackerCurrency',
                        currency
                    );

                    syncCurrencyToggleUI();
                    updatePortfolioCard();
                }
            );
        });


    const confirmCancel =
        document.getElementById(
            'confirmCancel'
        );

    if (confirmCancel) {
        confirmCancel.addEventListener(
            'click',
            closeConfirmModal
        );
    }


    setupModalTabs();
    setupPortfolioCardListeners();
    setupSearchAndSortListeners();
}


/* ============================================
   SEARCH & SORT
   ============================================ */

function setupSearchAndSortListeners() {

    const pSearch =
        document.getElementById(
            'portfolioSearchInput'
        );

    const pSort =
        document.getElementById(
            'portfolioSortSelect'
        );

    const wSearch =
        document.getElementById(
            'watchlistSearchInput'
        );

    const wSort =
        document.getElementById(
            'watchlistSortSelect'
        );

    const wMarket =
        document.getElementById(
            'watchlistMarketSelect'
        );


    /*
     * PORTFOLIO SEARCH
     */
    if (pSearch) {

        pSearch.addEventListener(
            'input',
            e => {

                state.portfolioSearch =
                    e.target.value;

                renderPortfolio();
            }
        );
    }


    /*
     * PORTFOLIO SORT
     */
    if (pSort) {

        pSort.addEventListener(
            'change',
            e => {

                state.portfolioSort =
                    e.target.value;

                renderPortfolio();
            }
        );
    }


    /*
     * WATCHLIST SEARCH
     */
    if (wSearch) {

        wSearch.addEventListener(
            'input',
            e => {

                state.watchlistSearch =
                    e.target.value;

                renderWatchlist();
            }
        );
    }


    /*
     * WATCHLIST SORT
     */
    if (wSort) {

        wSort.addEventListener(
            'change',
            e => {

                state.watchlistSort =
                    e.target.value;

                renderWatchlist();
            }
        );
    }


    /*
     * WATCHLIST MARKET FILTER
     */
    if (wMarket) {

        wMarket.addEventListener(
            'change',
            e => {

                state.watchlistMarket =
                    e.target.value;

                renderWatchlist();
            }
        );
    }
}


function applyPortfolioSearchAndSort(stocks) {

    let result = [...stocks];

    const q =
        state.portfolioSearch
            .trim()
            .toUpperCase();

    if (q) {
        result =
            result.filter(
                s =>
                    String(
                        s.ticker || ''
                    )
                        .toUpperCase()
                        .includes(q)
            );
    }


    switch (state.portfolioSort) {

        case 'ticker-asc':

            result.sort(
                (a, b) =>
                    String(a.ticker)
                        .localeCompare(
                            String(b.ticker)
                        )
            );

            break;


        case 'value-desc':

            result.sort(
                (a, b) =>
                    (
                        (b.currentPrice || 0) *
                        (b.quantity || 0)
                    ) -
                    (
                        (a.currentPrice || 0) *
                        (a.quantity || 0)
                    )
            );

            break;


        case 'gain-desc': {

            const pct = s => {

                if (
                    !s.buyPrice ||
                    !s.currentPrice
                ) {
                    return 0;
                }

                return (
                    (
                        (s.currentPrice -
                        s.buyPrice) /
                        s.buyPrice
                    ) * 100
                );
            };

            result.sort(
                (a, b) =>
                    pct(b) - pct(a)
            );

            break;
        }
    }

    return result;
}


function applyWatchlistSearchAndSort(stocks) {

    let result = [...stocks];


    /*
     * SEARCH
     */
    const q =
        state.watchlistSearch
            .trim()
            .toUpperCase();


    if (q) {

        result =
            result.filter(
                s =>
                    String(
                        s.ticker || ''
                    )
                        .toUpperCase()
                        .includes(q)
            );
    }


    /*
     * MARKET FILTER
     *
     * Default = all markets
     */
    const market =
        state.watchlistMarket ||
        'all';


    if (market !== 'all') {

        result =
            result.filter(
                s =>
                    String(
                        s.market || ''
                    )
                        .toUpperCase() ===
                    market
            );
    }


    /*
     * SORT
     */
    switch (state.watchlistSort) {

        /*
         * NEWEST FIRST
         */
        case 'date-desc':

            result.sort(
                (a, b) =>
                    new Date(
                        b.dateAdded || 0
                    ) -
                    new Date(
                        a.dateAdded || 0
                    )
            );

            break;


        /*
         * TICKER A-Z
         */
        case 'ticker-asc':

            result.sort(
                (a, b) =>
                    String(
                        a.ticker || ''
                    ).localeCompare(
                        String(
                            b.ticker || ''
                        )
                    )
            );

            break;


        /*
         * CONFIDENCE HIGH → LOW
         *
         * Stocks with N/A confidence
         * always go to the bottom.
         */
        case 'confidence-desc':

            result.sort(
                (a, b) => {

                    const aScore =
                        Number(
                            a.confidenceLevel?.score
                        );

                    const bScore =
                        Number(
                            b.confidenceLevel?.score
                        );

                    const aValid =
                        Number.isFinite(
                            aScore
                        );

                    const bValid =
                        Number.isFinite(
                            bScore
                        );


                    if (
                        !aValid &&
                        !bValid
                    ) {
                        return 0;
                    }


                    if (!aValid) {
                        return 1;
                    }


                    if (!bValid) {
                        return -1;
                    }


                    return bScore - aScore;
                }
            );

            break;


        /*
         * CONFIDENCE LOW → HIGH
         *
         * N/A still stays at the bottom.
         */
        case 'confidence-asc':

            result.sort(
                (a, b) => {

                    const aScore =
                        Number(
                            a.confidenceLevel?.score
                        );

                    const bScore =
                        Number(
                            b.confidenceLevel?.score
                        );

                    const aValid =
                        Number.isFinite(
                            aScore
                        );

                    const bValid =
                        Number.isFinite(
                            bScore
                        );


                    if (
                        !aValid &&
                        !bValid
                    ) {
                        return 0;
                    }


                    if (!aValid) {
                        return 1;
                    }


                    if (!bValid) {
                        return -1;
                    }


                    return aScore - bScore;
                }
            );

            break;
    }


    return result;
}


/* ============================================
   PULL TO REFRESH
   ============================================ */





/* ============================================
   PORTFOLIO CARD LISTENERS
   ============================================ */

function setupPortfolioCardListeners() {

    const nseCard =
        document.getElementById('nseCard');

    const usCard =
        document.getElementById('usCard');


    if (nseCard) {
        nseCard.addEventListener(
            'click',
            () => openMarketModal('NGX')
        );
    }


    if (usCard) {
        usCard.addEventListener(
            'click',
            () => openMarketModal('US')
        );
    }
}


function setupTabNavigation() {

    document
        .querySelectorAll('.tab-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                e => {

                    const tab =
                        e.currentTarget.dataset.tab;

                    if (tab) {
                        switchTab(tab);
                    }
                }
            );
        });
}


/* ============================================
   TAB SWITCHING
   ============================================ */

function switchTab(tabName) {

    state.currentTab =
        tabName;


    document
        .querySelectorAll('.tab-content')
        .forEach(t =>
            t.classList.remove(
                'active'
            )
        );


    const tab =
        document.getElementById(
            `${tabName}Tab`
        );


    if (tab) {
        tab.classList.add(
            'active'
        );
    }


    document
        .querySelectorAll('.tab-btn')
        .forEach(btn => {

            btn.classList.remove(
                'active'
            );

            if (
                btn.dataset.tab ===
                tabName
            ) {
                btn.classList.add(
                    'active'
                );
            }
        });


    if (tabName === 'watchlist') {

        renderWatchlist();

    } else if (tabName === 'portfolio') {

        renderPortfolio();

    } else if (tabName === 'sold') {

        renderSold();
    }
}


/* ============================================
   SECURITY
   ============================================ */

function escapeHtml(str) {

    if (
        str === null ||
        str === undefined
    ) {
        return '';
    }

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#39;'
        );
}


function sanitizeTicker(raw) {

    return String(raw || '')
        .toUpperCase()
        .replace(
            /[^A-Z0-9.]/g,
            ''
        );
}


/* ============================================
   CONFIDENCE SCORE HELPERS
   ============================================ */

function getConfidenceScore(stock) {

    if (
        !stock ||
        stock.confidenceLevel == null
    ) {
        return null;
    }


    if (
        typeof stock.confidenceLevel ===
            'object' &&
        stock.confidenceLevel.score != null
    ) {

        const score =
            Number(
                stock.confidenceLevel.score
            );

        return Number.isFinite(score)
            ? score
            : null;
    }


    if (
        typeof stock.confidenceLevel ===
            'number'
    ) {

        return Number.isFinite(
            stock.confidenceLevel
        )
            ? stock.confidenceLevel
            : null;
    }


    return null;
}


function getConfidenceSignal(stock) {

    if (
        !stock ||
        !stock.confidenceLevel
    ) {
        return null;
    }


    if (
        typeof stock.confidenceLevel ===
            'object' &&
        stock.confidenceLevel.signal
    ) {

        return stock.confidenceLevel.signal;
    }


    return null;
}


function getConfidenceBreakdown(stock) {

    if (
        !stock ||
        !stock.confidenceLevel ||
        typeof stock.confidenceLevel !==
            'object'
    ) {
        return null;
    }

    return (
        stock.confidenceLevel.breakdown ||
        null
    );
}


/* ============================================
   API CALLS
   ============================================ */

async function fetchAllData() {

    if (!state.isOnline) {
        return;
    }

    showSyncIndicator(true);


    try {

        const portfolioRes =
            await fetch(
                `${API_BASE}/portfolio/${state.userId}`
            );


        if (!portfolioRes.ok) {

            throw new Error(
                `Portfolio request failed: ${portfolioRes.status}`
            );
        }


        const data =
            await portfolioRes.json();


        /*
         * IMPORTANT:
         *
         * Backend returns the portfolio document
         * directly:
         *
         * {
         *   userId,
         *   stocks: [],
         *   watchlist: [],
         *   sold: [],
         *   activity: [],
         *   settings: {}
         * }
         *
         * The frontend state uses:
         *
         * state.portfolio.stocks
         * state.watchlist.stocks
         * state.sold.stocks
         */


        state.portfolio = {
    stocks:
        Array.isArray(data.portfolio)
            ? data.portfolio
            : []
};


        state.watchlist = {
            stocks:
                Array.isArray(data.watchlist)
                    ? data.watchlist
                    : []
        };


        state.sold = {
            stocks:
                Array.isArray(data.sold)
                    ? data.sold
                    : []
        };


        state.activity =
            Array.isArray(data.activity)
                ? data.activity
                : [];


        state.settings =
            data.settings || {
                goalAmount: 1000000
            };


        if (data.exchangeRate) {

            state.exchangeRate =
                data.exchangeRate;

            console.log(
                `📊 Exchange rate updated: 1 USD = ₦${data.exchangeRate.usdToNgn}`
            );
        }


        /*
         * Save the correctly structured state.
         */
        saveToLocalStorage();


        console.log(
            '📦 Portfolio loaded:',
            state.portfolio.stocks.length,
            'stocks'
        );

        console.log(
            '👀 Watchlist loaded:',
            state.watchlist.stocks.length,
            'stocks'
        );

        console.log(
            '💰 Sold loaded:',
            state.sold.stocks.length,
            'stocks'
        );


    } catch (err) {

        console.error(
            'Error fetching portfolio:',
            err
        );

        showToast(
            'Failed to load portfolio data',
            'error'
        );


    } finally {

        showSyncIndicator(false);

        state.initialLoadComplete =
            true;

        updateUI();

        state.lastUpdated =
            new Date();

        updateLastUpdatedTime();
    }
}


/* ============================================
   ADD STOCK
   ============================================ */

async function addStock(type) {

    let ticker;
    let quantity;
    let price;
    let sector;
    let notes;
    let watchingDuration;
    let market;


    /* ----------------------------------------
       PORTFOLIO
       ---------------------------------------- */

    if (type === 'portfolio') {

        ticker =
            sanitizeTicker(
                document.getElementById(
                    'addTicker'
                ).value
            );


        quantity =
            parseInt(
                document.getElementById(
                    'addQuantity'
                ).value
            );


        price =
            parseFloat(
                document.getElementById(
                    'addPrice'
                ).value
            );


        sector =
            document.getElementById(
                'addSector'
            ).value;


        market =
            document.getElementById(
                'addMarket'
            )?.value ||
            'NGX';


        notes =
            document.getElementById(
                'addNotes'
            ).value;


        if (
            !validateForm(
                ticker,
                quantity,
                price,
                sector,
                market
            )
        ) {
            return;
        }


        try {

            /*
             * FIX:
             * Backend route is:
             *
             * POST /portfolio/:userId/stocks
             *
             * NOT:
             * /add-stock
             */

            const res =
                await fetch(
                    `${API_BASE}/portfolio/${state.userId}/stocks`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                ticker,
                                quantity,
                                buyPrice:
                                    price,
                                sector,
                                notes,
                                market
                            })
                    }
                );


            if (res.ok) {

                showToast(
                    `✓ ${ticker} added to ${market} portfolio`,
                    'success'
                );


                closeAddStockModal();
                clearForm();

                await fetchAllData();


            } else {

                const error =
                    await res
                        .json()
                        .catch(
                            () => ({})
                        );


                showToast(
                    error.message ||
                    error.error ||
                    'Failed to add stock',
                    'error'
                );
            }


        } catch (err) {

            console.error(
                'Error adding stock:',
                err
            );

            showToast(
                'Network error. Please try again.',
                'error'
            );
        }
    }


    /* ----------------------------------------
       WATCHLIST
       ---------------------------------------- */

    else if (type === 'watchlist') {

        ticker =
            sanitizeTicker(
                document.getElementById(
                    'watchTicker'
                ).value
            );


        sector =
            document.getElementById(
                'watchSector'
            ).value;


        watchingDuration =
            document.getElementById(
                'watchDuration'
            ).value;


        market =
            document.getElementById(
                'watchMarket'
            )?.value ||
            'NGX';


        notes =
            document.getElementById(
                'watchNotes'
            ).value;


        if (!ticker) {

            document.getElementById(
                'watchTickerError'
            ).textContent =
                '✕ Please enter a ticker';

            return;
        }


        if (
            !market ||
            !['NGX', 'US'].includes(
                market
            )
        ) {

            document.getElementById(
                'watchMarketError'
            ).textContent =
                '✕ Please select a market';

            return;
        }


        try {

            /*
             * FIX:
             *
             * Backend route:
             * POST /portfolio/:userId/watchlist
             */

           console.log('🔎 addStock userId:', state.userId);
console.log(
    '🔎 addStock URL:',
    `${API_BASE}/portfolio/${state.userId}/add-watchlist`
);

const res =
    await fetch(
        `${API_BASE}/portfolio/${state.userId}/add-watchlist`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticker,
                watchingDuration,
                sector: sector || null,
                notes,
                market
            })
        }
    );

            if (res.ok) {

                showToast(
                    `✓ ${ticker} added to watchlist`,
                    'success'
                );


                closeAddStockModal();
                clearForm();

                await fetchAllData();


            } else {

                const error =
                    await res
                        .json()
                        .catch(
                            () => ({})
                        );


                showToast(
                    error.message ||
                    error.error ||
                    'Failed to add to watchlist',
                    'error'
                );
            }


        } catch (err) {

            console.error(
                'Error adding to watchlist:',
                err
            );

            showToast(
                'Network error. Please try again.',
                'error'
            );
        }
    }
}


/* ============================================
   WATCHLIST DELETE
   ============================================ */

function deleteFromWatchlist(ticker) {

    openConfirmModal(
        'Remove from Watchlist',

        `Remove ${escapeHtml(ticker)} from your watchlist?`,

        'You can add it back anytime.',

        () =>
            performDeleteFromWatchlist(
                ticker
            )
    );
}


async function performDeleteFromWatchlist(
    ticker
) {

    try {

        const res =
            await fetch(
                `${API_BASE}/portfolio/${state.userId}/remove-watchlist`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            ticker
                        })
                }
            );


        if (res.ok) {

            showToast(
                `✓ ${ticker} removed from watchlist`,
                'success'
            );


            logLocalActivity({
                type: 'rejected',

                title:
                    `${ticker} rejected`,

                description:
                    'Removed from watchlist'
            });


            closeConfirmModal();

            await fetchAllData();


        } else {

            const error =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );


            showToast(
                error.message ||
                'Failed to remove from watchlist',
                'error'
            );
        }


    } catch (err) {

        console.error(
            'Error deleting from watchlist:',
            err
        );

        showToast(
            'Failed to remove from watchlist',
            'error'
        );
    }
}


/* ============================================
   LOCAL ACTIVITY
   ============================================ */

function logLocalActivity({
    type,
    title,
    description
}) {

    state.localActivity.unshift({
        type,
        title,
        description,
        date:
            new Date().toISOString()
    });


    saveLocalActivity();

    renderActivity();
}


function saveLocalActivity() {

    localStorage.setItem(
        'portfolioTrackerLocalActivity',

        JSON.stringify(
            state.localActivity
        )
    );
}


function loadLocalActivity() {

    const saved =
        localStorage.getItem(
            'portfolioTrackerLocalActivity'
        );


    if (saved) {

        try {

            state.localActivity =
                JSON.parse(saved);


        } catch (err) {

            console.error(
                'Error parsing local activity:',
                err
            );

            state.localActivity = [];
        }
    }


    const clearedAt =
        localStorage.getItem(
            'portfolioTrackerActivityClearedAt'
        );


    if (clearedAt) {
        state.activityClearedAt =
            clearedAt;
    }
}


/* ============================================
   CLEAR ALL ACTIVITY
   ============================================ */

function setupClearActivityButton() {

    let btn =
        document.getElementById(
            'clearActivityBtn'
        );


    if (!btn) {

        const filterEl =
            document.getElementById(
                'activityFilter'
            );


        if (!filterEl) {
            return;
        }


        btn =
            document.createElement(
                'button'
            );


        btn.id =
            'clearActivityBtn';

        btn.type =
            'button';

        btn.className =
            'btn-clear-activity';

        btn.textContent =
            'Clear all';

        btn.style.marginLeft =
            '8px';


        filterEl.insertAdjacentElement(
            'afterend',
            btn
        );
    }


    btn.addEventListener(
        'click',
        clearAllActivity
    );
}


function clearAllActivity() {

    if (
        (
            getCombinedActivity() ||
            []
        ).length === 0
    ) {

        showToast(
            'No activity to clear',
            'warning'
        );

        return;
    }


    openConfirmModal(

        'Clear Activity',

        'Clear all recent activity?',

        'This clears it from view on this device. You can undo right after.',

        () => {

            const previousLocalActivity =
                JSON.parse(
                    JSON.stringify(
                        state.localActivity
                    )
                );


            const previousClearedAt =
                state.activityClearedAt;


            const now =
                new Date().toISOString();


            state.localActivity = [];

            saveLocalActivity();


            state.activityClearedAt =
                now;


            localStorage.setItem(
                'portfolioTrackerActivityClearedAt',
                now
            );


            renderActivity();

            closeConfirmModal();


            showToast(
                '✓ Activity cleared',
                'success',

                {
                    label: 'Undo',

                    onClick: () => {

                        state.localActivity =
                            previousLocalActivity;

                        saveLocalActivity();


                        state.activityClearedAt =
                            previousClearedAt;


                        if (
                            previousClearedAt
                        ) {

                            localStorage.setItem(
                                'portfolioTrackerActivityClearedAt',
                                previousClearedAt
                            );

                        } else {

                            localStorage.removeItem(
                                'portfolioTrackerActivityClearedAt'
                            );
                        }


                        renderActivity();


                        showToast(
                            '✓ Activity restored',
                            'success'
                        );
                    }
                },

                UNDO_TOAST_DURATION
            );
        }
    );
}

function updateGreeting() {

    const greetingEl =
        document.getElementById(
            'greetingText'
        );

    if (!greetingEl) return;

    const hour =
        new Date().getHours();

    let greeting;

    if (hour < 12) {
        greeting = 'Good Morning,';
    } else if (hour < 17) {
        greeting = 'Good Afternoon,';
    } else {
        greeting = 'Good Evening,';
    }

    greetingEl.textContent =
        greeting;
}


/*
 * Set greeting immediately
 */
updateGreeting();


/*
 * Keep it live while the app is open.
 * Checks once every minute.
 */
setInterval(
    updateGreeting,
    60 * 1000
);


/* ============================================
   WATCHLIST → PORTFOLIO
   ============================================ */

function openWatchlistToPortfolioModal(
    ticker
) {

    openConfirmModal(

        'Convert to Portfolio',

        `Add ${escapeHtml(ticker)} to your portfolio?`,

        'Quantity and price required to proceed',

        () => {

            const quantity =
                prompt(
                    `How many shares of ${ticker}?`
                );


            if (
                !quantity ||
                quantity <= 0
            ) {
                return;
            }


            const price =
                prompt(
                    `Entry price per share for ${ticker}?`
                );


            if (
                !price ||
                price <= 0
            ) {
                return;
            }


            moveWatchlistToPortfolio(
                ticker,
                parseInt(quantity),
                parseFloat(price)
            );
        }
    );
}


async function moveWatchlistToPortfolio(
    ticker,
    quantity,
    buyPrice
) {

    try {

        /*
         * FIX:
         *
         * Backend route:
         *
         * POST
         * /portfolio/:userId/watchlist/:ticker/add-to-portfolio
         */

        const res =
            await fetch(
                `${API_BASE}/portfolio/${state.userId}/watchlist/${encodeURIComponent(ticker)}/add-to-portfolio`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            quantity,
                            buyPrice
                        })
                }
            );


        if (res.ok) {

            showToast(
                `✓ ${ticker} moved to portfolio`,
                'success'
            );


            closeConfirmModal();

            await fetchAllData();


        } else {

            const error =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );


            showToast(
                error.message ||
                'Failed to move stock',
                'error'
            );
        }


    } catch (err) {

        console.error(
            'Error moving to portfolio:',
            err
        );

        showToast(
            'Failed to move stock',
            'error'
        );
    }
}


/* ============================================
   GET STOCK PRICE
   ============================================ */

async function getStockPrice(
    ticker,
    market
) {

    try {

        const params =
            new URLSearchParams();


        if (market) {
            params.set(
                'market',
                market
            );
        }


        const query =
            params.toString()
                ? `?${params.toString()}`
                : '';


        const res =
            await fetch(
                `${API_BASE}/stocks/price/${encodeURIComponent(ticker)}${query}`
            );


        if (res.ok) {
            return await res.json();
        }


        return null;


    } catch (err) {

        console.error(
            'Error fetching price:',
            err
        );

        return null;
    }
}


/* ============================================
   EDIT EXISTING POSITION
   ============================================ */

function openEditStockModal(
    ticker,
    market
) {

    const stock =
        state.portfolio.stocks.find(
            s =>
                s.ticker === ticker &&
                s.market === market
        );


    if (!stock) {
        return;
    }


    const qtyInput =
        prompt(
            `Edit quantity for ${ticker}`,
            stock.quantity
        );


    if (qtyInput === null) {
        return;
    }


    const newQuantity =
        parseInt(qtyInput);


    if (
        !newQuantity ||
        newQuantity <= 0
    ) {

        showToast(
            'Invalid quantity',
            'error'
        );

        return;
    }


    const priceInput =
        prompt(
            `Edit average buy price for ${ticker}`,
            stock.buyPrice
        );


    if (priceInput === null) {
        return;
    }


    const newBuyPrice =
        parseFloat(priceInput);


    if (
        !newBuyPrice ||
        newBuyPrice <= 0
    ) {

        showToast(
            'Invalid price',
            'error'
        );

        return;
    }


    openConfirmModal(

        'Edit Position',

        `Update ${escapeHtml(ticker)} to ${newQuantity} shares @ ${escapeHtml(String(newBuyPrice))}?`,

        'This changes your recorded quantity and average buy price.',

        () =>
            editStockConfirmed(
                ticker,
                market,
                newQuantity,
                newBuyPrice
            )
    );
}


async function editStockConfirmed(
    ticker,
    market,
    quantity,
    buyPrice
) {

    try {

        const res =
            await fetch(
                `${API_BASE}/portfolio/${state.userId}/edit-stock`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            ticker,
                            market,
                            quantity,
                            buyPrice
                        })
                }
            );


        if (res.ok) {

            showToast(
                `✓ ${ticker} updated`,
                'success'
            );


            closeConfirmModal();

            await fetchAllData();


        } else {

            const error =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );


            showToast(
                error.message ||
                'Failed to update stock',
                'error'
            );
        }


    } catch (err) {

        console.error(
            'Error editing stock:',
            err
        );

        showToast(
            'Failed to update stock',
            'error'
        );
    }
}


/* ============================================
   FORM VALIDATION
   ============================================ */

function validateForm(
    ticker,
    quantity,
    price,
    sector,
    market
) {

    let isValid = true;


    const tickerError =
        document.getElementById(
            'tickerError'
        );

    const quantityError =
        document.getElementById(
            'quantityError'
        );

    const priceError =
        document.getElementById(
            'priceError'
        );

    const sectorError =
        document.getElementById(
            'sectorError'
        );


    if (tickerError) {
        tickerError.textContent = '';
    }

    if (quantityError) {
        quantityError.textContent = '';
    }

    if (priceError) {
        priceError.textContent = '';
    }

    if (sectorError) {
        sectorError.textContent = '';
    }


    const marketErrorEl =
        document.getElementById(
            'marketError'
        );


    if (marketErrorEl) {
        marketErrorEl.textContent = '';
    }


    if (!ticker) {

        if (tickerError) {
            tickerError.textContent =
                '✕ Please enter a ticker';
        }

        isValid = false;
    }


    if (
        !quantity ||
        quantity <= 0
    ) {

        if (quantityError) {
            quantityError.textContent =
                '✕ Quantity must be positive';
        }

        isValid = false;
    }


    if (
        !price ||
        price <= 0
    ) {

        if (priceError) {
            priceError.textContent =
                '✕ Price must be positive';
        }

        isValid = false;
    }


    if (!sector) {

        if (sectorError) {
            sectorError.textContent =
                '✕ Please select a sector';
        }

        isValid = false;
    }


    const marketSelectEl =
        document.getElementById(
            'addMarket'
        );


    if (
        marketSelectEl &&
        (
            !market ||
            !['NGX', 'US'].includes(
                market
            )
        )
    ) {

        if (marketErrorEl) {
            marketErrorEl.textContent =
                '✕ Please select a market';
        }

        isValid = false;
    }


    return isValid;
}


function validateQuantity(e) {

    const val =
        parseInt(
            e.target.value
        );


    if (val <= 0) {

        e.target.classList.add(
            'error'
        );


        const error =
            document.getElementById(
                'quantityError'
            );


        if (error) {
            error.textContent =
                '✕ Must be positive';
        }


    } else {

        e.target.classList.remove(
            'error'
        );


        const error =
            document.getElementById(
                'quantityError'
            );


        if (error) {
            error.textContent = '';
        }
    }
}


function validatePrice(e) {

    const val =
        parseFloat(
            e.target.value
        );


    if (val <= 0) {

        e.target.classList.add(
            'error'
        );


        const error =
            document.getElementById(
                'priceError'
            );


        if (error) {
            error.textContent =
                '✕ Must be positive';
        }


    } else {

        e.target.classList.remove(
            'error'
        );


        const error =
            document.getElementById(
                'priceError'
            );


        if (error) {
            error.textContent = '';
        }
    }
}


/* ============================================
   AUTOCOMPLETE
   ============================================ */

let autocompleteTimer = null;
async function handleAutocomplete(
    e,
    dropdownId,
    inputId,
    sectorId,
    marketId
) {
    const query =
        e.target.value.trim();

    const dropdown =
        document.getElementById(
            dropdownId
        );

    if (!dropdown) {
        return;
    }

    // Clear previous timer
    clearTimeout(
        autocompleteTimer
    );

    // Hide dropdown if input is empty
    if (!query) {
        dropdown.classList.remove(
            'active'
        );

        dropdown.innerHTML = '';

        return;
    }

    // Debounce API request
    autocompleteTimer =
        setTimeout(
            async () => {
                try {
                    const response =
                        await fetch(
                            `${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`
                        );

                    if (!response.ok) {
                        throw new Error(
                            'Stock search failed'
                        );
                    }

                    const data =
                        await response.json();

                    const matches =
                        data.results || [];

                    // No results
                    if (
                        matches.length === 0
                    ) {
                        dropdown.classList.remove(
                            'active'
                        );

                        dropdown.innerHTML = '';

                        return;
                    }

                    dropdown.innerHTML =
                        matches
                            .map(
                                (
                                    stock,
                                    i
                                ) => `
                                    <div
                                        class="autocomplete-item"
                                        onclick="selectStock(
                                            '${escapeHtml(stock.ticker)}',
                                            '${escapeHtml(stock.sector || '')}',
                                            '${escapeHtml(stock.market || '')}',
                                            '${inputId}',
                                            '${sectorId}',
                                            '${marketId}'
                                        )"
                                    >
                                        <div
                                            class="autocomplete-avatar"
                                            style="background: ${
                                                API_COLORS[
                                                    i %
                                                    API_COLORS.length
                                                ]
                                            }"
                                        >
                                            ${escapeHtml(
                                                stock.ticker[0]
                                            )}
                                        </div>

                                        <div class="autocomplete-content">
                                            <p class="autocomplete-ticker">
                                                ${escapeHtml(
                                                    stock.ticker
                                                )}
                                            </p>

                                            <p class="autocomplete-name">
                                                ${escapeHtml(
                                                    stock.name
                                                )}
                                            </p>

                                            <p class="autocomplete-meta">
                                                ${escapeHtml(
                                                    stock.market || ''
                                                )}
                                                ${
                                                    stock.sector
                                                        ? ` • ${escapeHtml(stock.sector)}`
                                                        : ''
                                                }
                                            </p>
                                        </div>
                                    </div>
                                `
                            )
                            .join('');

                    dropdown.classList.add(
                        'active'
                    );

                } catch (error) {
                    console.error(
                        'Autocomplete error:',
                        error
                    );

                    dropdown.classList.remove(
                        'active'
                    );
                }
            },
            300
        );
}



function selectStock(
    ticker,
    sector,
    market,
    inputId,
    sectorId,
    marketId
) {
    const input =
        document.getElementById(
            inputId
        );

    const sectorInput =
        document.getElementById(
            sectorId
        );

    const marketInput =
        document.getElementById(
            marketId
        );

    if (input) {
        input.value = ticker;
    }

    if (marketInput) {
        marketInput.value = market;
    }

    if (sectorInput) {
        sectorInput.value = sector;
    }

    const dropdown =
        input?.parentElement
            ?.querySelector(
                '.autocomplete-dropdown'
            );

    if (dropdown) {
        dropdown.classList.remove(
            'active'
        );
    }
}


/* ============================================
   MODAL HANDLING
   ============================================ */

function openAddStockModal() {

    const modal =
        document.getElementById(
            'addStockModal'
        );


    if (modal) {
        modal.classList.add(
            'active'
        );
    }
}


function closeAddStockModal() {

    const modal =
        document.getElementById(
            'addStockModal'
        );


    if (modal) {
        modal.classList.remove(
            'active'
        );
    }
}


function clearForm() {

    const ids = [
        'addTicker',
        'addQuantity',
        'addPrice',
        'addSector',
        'addNotes'
    ];


    ids.forEach(id => {

        const el =
            document.getElementById(
                id
            );


        if (el) {
            el.value = '';
        }
    });


    const addMarket =
        document.getElementById(
            'addMarket'
        );


    if (addMarket) {
        addMarket.value = '';
    }


    const watchTicker =
        document.getElementById(
            'watchTicker'
        );

    if (watchTicker) {
        watchTicker.value = '';
    }


    const watchDuration =
        document.getElementById(
            'watchDuration'
        );

    if (watchDuration) {
        watchDuration.value = '2d';
    }


    const watchSector =
        document.getElementById(
            'watchSector'
        );

    if (watchSector) {
        watchSector.value = '';
    }


    const watchNotes =
        document.getElementById(
            'watchNotes'
        );

    if (watchNotes) {
        watchNotes.value = '';
    }


    const watchMarket =
        document.getElementById(
            'watchMarket'
        );


    if (watchMarket) {
        watchMarket.value = '';
    }


    document
        .querySelectorAll('.duration-btn')
        .forEach(
            (b, i) => {

                b.classList.toggle(
                    'active',
                    i === 0
                );
            }
        );


    const errorIds = [
        'tickerError',
        'quantityError',
        'priceError',
        'sectorError',
        'marketError',
        'watchTickerError',
        'watchMarketError'
    ];


    errorIds.forEach(id => {

        const el =
            document.getElementById(
                id
            );


        if (el) {
            el.textContent = '';
        }
    });
}


function openConfirmModal(
    title,
    message,
    details,
    callback
) {

    const titleEl =
        document.getElementById(
            'confirmTitle'
        );


    const messageEl =
        document.getElementById(
            'confirmMessage'
        );


    const detailsEl =
        document.getElementById(
            'confirmDetails'
        );


    const submitEl =
        document.getElementById(
            'confirmSubmit'
        );


    if (titleEl) {
        titleEl.textContent =
            title;
    }


    if (messageEl) {
        messageEl.textContent =
            message;
    }


    if (detailsEl) {
        detailsEl.textContent =
            details;
    }


    if (submitEl) {
        submitEl.onclick =
            callback;
    }


    const modal =
        document.getElementById(
            'confirmModal'
        );


    if (modal) {

        modal.style.zIndex =
            9999;

        modal.classList.add(
            'active'
        );
    }
}


function closeConfirmModal() {

    const modal =
        document.getElementById(
            'confirmModal'
        );


    if (!modal) {
        return;
    }


    modal.style.zIndex = '';

    modal.classList.remove(
        'active'
    );
}


/* ============================================
   STOCK DETAIL MODAL
   ============================================ */

let selectedStockForDetail = null;


async function showStockDetailModal(
    ticker,
    market
) {

    selectedStockForDetail = {
        ticker,
        market
    };


    const stock =
        state.portfolio.stocks.find(
            s =>
                s.ticker === ticker &&
                s.market === market
        );


    if (!stock) {
        return;
    }


    const currencySign =
        market === 'US'
            ? '$'
            : '₦';


    const confidenceScore =
        getConfidenceScore(stock);


    const detailStockName =
        document.getElementById(
            'detailStockName'
        );


    if (detailStockName) {
        detailStockName.textContent =
            ticker;
    }


    const detailConfidence =
        document.getElementById(
            'detailConfidence'
        );


    if (detailConfidence) {
        detailConfidence.textContent =
            confidenceScore !== null
                ? confidenceScore
                : 'N/A';
    }


    const detailPrice =
        document.getElementById(
            'detailPrice'
        );


    if (detailPrice) {

        detailPrice.textContent =
            stock.currentPrice != null
                ? `${currencySign}${formatNumber(
                    stock.currentPrice
                )}`
                : '—';
    }


    await fetchAndDisplayStockStats(
        ticker,
        market
    );


    const modal =
        document.getElementById(
            'stockDetailModal'
        );


    if (modal) {
        modal.classList.add(
            'active'
        );
    }
}


function closeStockDetailModal() {

    const modal =
        document.getElementById(
            'stockDetailModal'
        );


    if (modal) {
        modal.classList.remove(
            'active'
        );
    }


    selectedStockForDetail =
        null;
}


async function fetchAndDisplayStockStats(
    ticker,
    market
) {

    try {

        /*
         * FIX:
         * Pass market to backend.
         */

        const res =
            await fetch(
                `${API_BASE}/stocks/price/${encodeURIComponent(ticker)}?market=${encodeURIComponent(market)}`
            );


        if (!res.ok) {

            throw new Error(
                'Unable to load stock stats'
            );
        }


        const data =
            await res.json();


        const currencySign =
            market === 'US'
                ? '$'
                : '₦';


        const change =
            Number(data.change);


        const changePercent =
            Number(
                data.changePercent
            );


        const statsHtml = `

            <div class="stat-row">

                <span class="stat-label">
                    Price
                </span>

                <span class="stat-value">

                    ${
                        data.price != null
                            ? currencySign +
                              formatNumber(
                                  data.price
                              )
                            : '—'
                    }

                </span>

            </div>


            <div class="stat-row">

                <span class="stat-label">
                    Change
                </span>

                <span
                    class="stat-value ${
                        change >= 0
                            ? 'positive'
                            : 'negative'
                    }"
                >

                    ${
                        Number.isFinite(
                            change
                        )
                            ? `${
                                change >= 0
                                    ? '+'
                                    : ''
                            }${formatNumber(
                                change
                            )}`
                            : '—'
                    }

                </span>

            </div>


            <div class="stat-row">

                <span class="stat-label">
                    Change %
                </span>

                <span
                    class="stat-value ${
                        changePercent >= 0
                            ? 'positive'
                            : 'negative'
                    }"
                >

                    ${
                        Number.isFinite(
                            changePercent
                        )
                            ? `${
                                changePercent >= 0
                                    ? '+'
                                    : ''
                            }${formatNumber(
                                changePercent
                            )}%`
                            : '—'
                    }

                </span>

            </div>


            <div class="stat-row">

                <span class="stat-label">
                    Source
                </span>

                <span class="stat-value">
                    ${escapeHtml(
                        data.source || '—'
                    )}
                </span>

            </div>
        `;


        const detailStats =
            document.getElementById(
                'detailStats'
            );


        if (detailStats) {
            detailStats.innerHTML =
                statsHtml;
        }


    } catch (err) {

        console.error(
            'Error fetching stock stats:',
            err
        );


        const detailStats =
            document.getElementById(
                'detailStats'
            );


        if (detailStats) {
            detailStats.innerHTML =
                '<p>Unable to load stats</p>';
        }
    }
}


function confirmSellFromDetail(
    ticker,
    market
) {

    const stock =
        state.portfolio.stocks.find(
            s =>
                s.ticker === ticker &&
                s.market === market
        );


    if (!stock) {
        return;
    }


    const currencySign =
        market === 'US'
            ? '$'
            : '₦';


    const qtyInput =
        prompt(
            `How many shares of ${stock.ticker} to sell? (You own ${stock.quantity})`,
            stock.quantity
        );


    if (!qtyInput) {
        return;
    }


    const sellQty =
        parseInt(qtyInput);


    if (
        !sellQty ||
        sellQty <= 0 ||
        sellQty > stock.quantity
    ) {

        showToast(
            'Invalid quantity',
            'error'
        );

        return;
    }


    openConfirmModal(

        'Sell Stock',

        `Sell ${sellQty} of ${stock.quantity} shares of ${stock.ticker}?`,

        `Entry: ${currencySign}${formatNumber(
            stock.buyPrice
        )} | Current: ${
            stock.currentPrice != null
                ? currencySign +
                  formatNumber(
                      stock.currentPrice
                  )
                : '—'
        }`,

        () => {

            sellStockConfirmed(
                stock.ticker,
                sellQty,
                market
            );
        }
    );
}


async function sellStockConfirmed(
    ticker,
    quantity,
    market
) {

    try {

        const res =
            await fetch(
                `${API_BASE}/portfolio/${state.userId}/sell-stock`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            ticker,
                            quantity,
                            market
                        })
                }
            );


        if (res.ok) {

            showToast(
                `✓ ${ticker} sold successfully`,
                'success'
            );


            closeStockDetailModal();
            closeMarketModal();
            closeConfirmModal();


            await fetchAllData();


        } else {

            const error =
                await res
                    .json()
                    .catch(
                        () => ({})
                    );


            showToast(
                error.message ||
                'Failed to sell stock',
                'error'
            );
        }


    } catch (err) {

        console.error(
            'Error selling stock:',
            err
        );


        showToast(
            'Failed to sell stock',
            'error'
        );
    }
}


/* ============================================
   LOADING SKELETONS
   ============================================ */

function ensureSkeletonStyles() {

    if (
        document.getElementById(
            'skeletonStyles'
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            'style'
        );


    style.id =
        'skeletonStyles';


    style.textContent = `

        .skeleton-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 10px;
        }

        .skeleton-block {
            background: linear-gradient(
                90deg,
                #eee 25%,
                #f5f5f5 37%,
                #eee 63%
            );

            background-size: 400% 100%;

            animation:
                skeleton-pulse
                1.4s ease infinite;

            border-radius: 6px;
        }

        @keyframes skeleton-pulse {
            0% {
                background-position: 100% 50%;
            }

            100% {
                background-position: 0 50%;
            }
        }

        .list-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }

        .list-toolbar input[type="text"] {
            flex: 1;
        }
    `;


    document.head.appendChild(
        style
    );
}


function skeletonRowsHtml(count) {

    let rows = '';


    for (
        let i = 0;
        i < count;
        i++
    ) {

        rows += `

            <div
                class="skeleton-row"
                aria-hidden="true"
            >

                <div
                    class="skeleton-block"
                    style="
                        width:40px;
                        height:40px;
                        border-radius:50%;
                    "
                ></div>


                <div style="flex:1;">

                    <div
                        class="skeleton-block"
                        style="
                            width:60%;
                            height:12px;
                            margin-bottom:8px;
                        "
                    ></div>


                    <div
                        class="skeleton-block"
                        style="
                            width:40%;
                            height:10px;
                        "
                    ></div>

                </div>


                <div
                    class="skeleton-block"
                    style="
                        width:60px;
                        height:12px;
                    "
                ></div>

            </div>
        `;
    }


    return rows;
}


function renderSkeletons() {

    ensureSkeletonStyles();


    const portfolioContainer =
        document.getElementById(
            'portfolioList'
        );


    const watchlistContainer =
        document.getElementById(
            'watchlistList'
        );


    const activityContainer =
        document.getElementById(
            'activityList'
        );


    if (portfolioContainer) {

        portfolioContainer.style.display =
            'flex';

        portfolioContainer.innerHTML =
            skeletonRowsHtml(3);
    }


    if (watchlistContainer) {

        watchlistContainer.style.display =
            'flex';

        watchlistContainer.innerHTML =
            skeletonRowsHtml(3);
    }


    if (activityContainer) {

        activityContainer.innerHTML =
            skeletonRowsHtml(4);
    }
}


/* ============================================
   UI RENDERING
   ============================================ */

function updateUI() {

    updateHeader();

    updateQuickStats();

    updatePortfolioCard();

    updateMiniCards();


    renderActivity();


    if (
        state.currentTab ===
        'watchlist'
    ) {

        renderWatchlist();

    } else if (
        state.currentTab ===
        'portfolio'
    ) {

        renderPortfolio();

    } else if (
        state.currentTab ===
        'sold'
    ) {

        renderSold();
    }
}


function updateHeader() {

    const userName =
        document.getElementById(
            'userName'
        );


    const avatar =
        document.getElementById(
            'avatar'
        );


    if (userName) {
        userName.textContent =
            state.userName;
    }


    if (avatar) {

        avatar.textContent =
            state.userName[0]
                .toUpperCase();
    }
}


function updateQuickStats() {

    const watching =
        document.getElementById(
            'statWatching'
        );


    const held =
        document.getElementById(
            'statHeld'
        );


    const sold =
        document.getElementById(
            'statSold'
        );


    if (watching) {

        watching.textContent =
            state.watchlist.stocks?.length ||
            0;
    }


    if (held) {

        held.textContent =
            state.portfolio.stocks?.length ||
            0;
    }


    if (sold) {

        sold.textContent =
            state.sold.stocks?.length ||
            0;
    }
}


function syncCurrencyToggleUI() {

    document
        .querySelectorAll(
            '.currency-btn'
        )
        .forEach(b => {

            b.classList.toggle(
                'active',

                b.dataset.currency ===
                    state.displayCurrency
            );
        });
}


/* ============================================
   PORTFOLIO SUMMARY
   ============================================ */
   
   function animatePortfolioValue(
    targetValue,
    currencySign,
    duration = 900
) {
    const element =
        document.getElementById('totalPortfolio');

    if (!element) return;

    const endValue =
        Number(targetValue) || 0;

    const startValue =
        Number(element.dataset.value) || 0;

    // Don't animate if nothing changed
    if (startValue === endValue) {
        element.textContent =
            `${currencySign}${formatNumber(endValue)}`;

        return;
    }

    const startTime =
        performance.now();

    function update(currentTime) {
        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );

        // Smooth ease-out
        const easedProgress =
            1 -
            Math.pow(
                1 - progress,
                3
            );

        const currentValue =
            startValue +
            (
                endValue -
                startValue
            ) *
            easedProgress;

        element.textContent =
            `${currencySign}${formatNumber(
                currentValue
            )}`;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent =
                `${currencySign}${formatNumber(
                    endValue
                )}`;

            element.dataset.value =
                endValue;
        }
    }

    requestAnimationFrame(update);
}



   
   

function updatePortfolioCard() {

    const portfolio =
        state.portfolio.stocks || [];


    const rate =
        Number(
            state.exchangeRate?.usdToNgn
        ) || 1650;


    const ngxStocks =
        portfolio.filter(
            s =>
                s.market === 'NGX'
        );


    const usStocks =
        portfolio.filter(
            s =>
                s.market === 'US'
        );


    const ngxInvested =
        ngxStocks.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.buyPrice) || 0)
                ),
            0
        );


    const ngxCurrent =
        ngxStocks.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.currentPrice) || 0)
                ),
            0
        );


    const usInvestedUSD =
        usStocks.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.buyPrice) || 0)
                ),
            0
        );


    const usCurrentUSD =
        usStocks.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.currentPrice) || 0)
                ),
            0
        );


    const usInvestedNGN =
        usInvestedUSD * rate;


    const usCurrentNGN =
        usCurrentUSD * rate;


    const totalInvested =
        ngxInvested +
        usInvestedNGN;


    const totalCurrent =
        ngxCurrent +
        usCurrentNGN;


    const totalGain =
        totalCurrent -
        totalInvested;


    const changePercent =
        totalInvested > 0
            ? (
                totalGain /
                totalInvested
            ) * 100
            : 0;


    const displayInUSD =
        state.displayCurrency ===
        'USD';


    const displayTotal =
        displayInUSD
            ? totalCurrent / rate
            : totalCurrent;


    const totalCurrencySign =
        displayInUSD
            ? '$'
            : '₦';


    const totalPortfolio =
        document.getElementById(
            'totalPortfolio'
        );


    animatePortfolioValue(
    displayTotal,
    totalCurrencySign
);


    const portfolioChange =
        document.getElementById(
            'portfolioChange'
        );


    if (portfolioChange) {

        portfolioChange.textContent =
            `${
                changePercent >= 0
                    ? '+'
                    : ''
            }${changePercent.toFixed(
                2
            )}% today`;


        portfolioChange.style.color =
            changePercent >= 0
                ? '#90EE90'
                : '#FFB6C6';
    }








function updateTopPerformer(portfolio) {

    const TIE_THRESHOLD =
        0.01; // percentage points

    const PROFIT_TIE_THRESHOLD =
        0.01; // currency units


    /*
     * Build valid performance candidates
     */
    const candidates =
        portfolio
            .filter(stock => {

                if (
                    !stock.buyPrice ||
                    stock.currentPrice == null ||
                    !stock.quantity
                ) {
                    return false;
                }

                const buyPrice =
                    Number(stock.buyPrice);

                const currentPrice =
                    Number(stock.currentPrice);

                const quantity =
                    Number(stock.quantity);

                return (
                    Number.isFinite(buyPrice) &&
                    Number.isFinite(currentPrice) &&
                    Number.isFinite(quantity) &&
                    buyPrice > 0 &&
                    quantity > 0
                );
            })
            .map(stock => {

                const buyPrice =
                    Number(stock.buyPrice);

                const currentPrice =
                    Number(stock.currentPrice);

                const quantity =
                    Number(stock.quantity);

                const percent =
                    (
                        (
                            currentPrice -
                            buyPrice
                        ) /
                        buyPrice
                    ) * 100;

                const invested =
                    quantity *
                    buyPrice;

                const currentValue =
                    quantity *
                    currentPrice;

                const profit =
                    currentValue -
                    invested;

                return {
                    stock,
                    percent,
                    invested,
                    profit
                };
            });


    const tickerEl =
        document.getElementById(
            'topPerformerTicker'
        );

    const changeEl =
        document.getElementById(
            'topPerformerChange'
        );

    const investedEl =
        document.getElementById(
            'topPerformerInvested'
        );

    const gainEl =
        document.getElementById(
            'topPerformerGain'
        );

    const lossEl =
        document.getElementById(
            'topPerformerLoss'
        );

    const subtitleEl =
        document.getElementById(
            'topPerformerSubtitle'
        );


    /*
     * No valid holdings
     */
    if (!candidates.length) {

        if (tickerEl) {
            tickerEl.textContent =
                '—';
        }

        if (changeEl) {
            changeEl.textContent =
                '—';
            changeEl.style.color =
                'rgba(255, 255, 255, 0.7)';
        }

        if (subtitleEl) {
            subtitleEl.textContent =
                'No valid holdings';
        }

        if (investedEl) {
            investedEl.textContent =
                '—';
        }

        if (gainEl) {
            gainEl.textContent =
                '—';
        }

        if (lossEl) {
            lossEl.textContent =
                '—';
        }

        return;
    }


    /*
     * Find the highest percentage return
     */
    const highestPercent =
        Math.max(
            ...candidates.map(
                candidate =>
                    candidate.percent
            )
        );


    /*
     * Keep every stock that is effectively
     * tied for the highest percentage return.
     */
    const percentLeaders =
        candidates.filter(
            candidate =>
                Math.abs(
                    candidate.percent -
                    highestPercent
                ) <= TIE_THRESHOLD
        );


    /*
     * Among percentage leaders,
     * find the highest absolute P/L.
     */
    const highestProfit =
        Math.max(
            ...percentLeaders.map(
                candidate =>
                    candidate.profit
            )
        );


    /*
     * Keep every stock that is also effectively
     * tied on absolute P/L.
     */
    const finalLeaders =
        percentLeaders.filter(
            candidate =>
                Math.abs(
                    candidate.profit -
                    highestProfit
                ) <= PROFIT_TIE_THRESHOLD
        );


    /*
     * If more than one stock remains,
     * there is genuinely no standout.
     */
    if (finalLeaders.length > 1) {

        if (tickerEl) {
            tickerEl.textContent =
                'No standout';
        }

        if (changeEl) {
            changeEl.textContent =
                '—';

            changeEl.style.color =
                'rgba(255, 255, 255, 0.7)';
        }

        if (subtitleEl) {
            subtitleEl.textContent =
                'All holdings are tied';
        }

        if (investedEl) {
            investedEl.textContent =
                '—';
        }

        if (gainEl) {
            gainEl.textContent =
                '—';
        }

        if (lossEl) {
            lossEl.textContent =
                '—';
        }

        return;
    }


    /*
     * Exactly one stock stands out.
     */
    const topPerformer =
        finalLeaders[0].stock;

    const topPercent =
        finalLeaders[0].percent;

    const topInvested =
        finalLeaders[0].invested;

    const topGain =
        finalLeaders[0].profit;


    const currencySign =
        topPerformer.market === 'US'
            ? '$'
            : '₦';


    /*
     * Ticker
     */
    if (tickerEl) {
        tickerEl.textContent =
            topPerformer.ticker;
    }


    /*
     * Percentage return
     */
    if (changeEl) {

        changeEl.textContent =
            `${
                topPercent >= 0
                    ? '+'
                    : ''
            }${topPercent.toFixed(2)}%`;

        changeEl.style.color =
            topPercent >= 0
                ? '#A7F3C7'
                : '#FFB8C5';
    }


    /*
     * Subtitle
     */
    if (subtitleEl) {
        subtitleEl.textContent =
            'Best return since entry';
    }


    /*
     * Invested
     */
    if (investedEl) {

        investedEl.textContent =
            `${currencySign}${formatNumber(
                topInvested
            )}`;
    }


    /*
     * Gain
     */
    if (gainEl) {

        gainEl.textContent =
            topGain > 0
                ? `+${currencySign}${formatNumber(
                    topGain
                )}`
                : `+${currencySign}0`;
    }


    /*
     * Loss
     */
    if (lossEl) {

        lossEl.textContent =
            topGain < 0
                ? `-${currencySign}${formatNumber(
                    Math.abs(topGain)
                )}`
                : `-${currencySign}0`;
    }
}
console.log(
    'TOP PERFORMER INPUT:',
    portfolio.map(stock => ({
        ticker: stock.ticker,
        buyPrice: stock.buyPrice,
        currentPrice: stock.currentPrice,
        quantity: stock.quantity,
        market: stock.market
    }))
);

updateTopPerformer(portfolio);

    const sectors = {};


    ngxStocks.forEach(
        stock => {

            if (!stock.sector) {
                return;
            }


            if (!sectors[stock.sector]) {
                sectors[stock.sector] =
                    0;
            }


            sectors[stock.sector] +=
                (
                    Number(
                        stock.quantity
                    ) || 0
                ) *
                (
                    Number(
                        stock.buyPrice
                    ) || 0
                );
        }
    );


    usStocks.forEach(
        stock => {

            if (!stock.sector) {
                return;
            }


            if (!sectors[stock.sector]) {
                sectors[stock.sector] =
                    0;
            }


            sectors[stock.sector] +=
                (
                    Number(
                        stock.quantity
                    ) || 0
                ) *
                (
                    Number(
                        stock.buyPrice
                    ) || 0
                ) *
                rate;
        }
    );


    const total =
        Object.values(sectors)
            .reduce(
                (a, b) =>
                    a + b,
                0
            );


    const finance =
        sectors['Finance'] || 0;


    const tech =
        sectors['Tech'] || 0;


    const consumer =
        sectors['Consumer'] || 0;


    const financePercent =
        document.getElementById(
            'financePercent'
        );


    const techPercent =
        document.getElementById(
            'techPercent'
        );


    const consumerPercent =
        document.getElementById(
            'consumerPercent'
        );


    if (financePercent) {

        financePercent.textContent =
            total > 0
                ? Math.round(
                    (
                        finance /
                        total
                    ) * 100
                )
                : 0;
    }


    if (techPercent) {

        techPercent.textContent =
            total > 0
                ? Math.round(
                    (
                        tech /
                        total
                    ) * 100
                )
                : 0;
    }


    if (consumerPercent) {

        consumerPercent.textContent =
            total > 0
                ? Math.round(
                    (
                        consumer /
                        total
                    ) * 100
                )
                : 0;
    }


  const goalAmountNGN =
    Number(
        state.settings.goalAmount
    ) || 1000000;


/*
 * The goal is stored internally in NGN.
 * Convert it only for display when USD is selected.
 */
const goalAmount =
    displayInUSD
        ? goalAmountNGN / rate
        : goalAmountNGN;


/*
 * Portfolio value in the same currency
 * currently displayed to the user.
 */
const progressValue =
    displayInUSD
        ? totalCurrent / rate
        : totalCurrent;


/*
 * Calculate progress.
 */
const progressPercent =
    Math.min(
        (
            progressValue /
            goalAmount
        ) * 100,
        100
    );


const goalProgress =
    document.getElementById(
        'goalProgress'
    );


const goalAmountText =
    document.getElementById(
        'goalAmountText'
    );


const goalPercent =
    document.getElementById(
        'goalPercent'
    );


const goalRemaining =
    document.getElementById(
        'goalRemaining'
    );


const goalCurrencySign =
    displayInUSD
        ? '$'
        : '₦';


/*
 * Progress bar
 */
if (goalProgress) {

    goalProgress.style.width =
        `${progressPercent}%`;
}


/*
 * Achieved amount / goal amount
 */
if (goalAmountText) {

    const achieved =
        Math.min(
            Math.max(
                progressValue,
                0
            ),
            goalAmount
        );

    goalAmountText.textContent =
        `${goalCurrencySign}${formatNumber(
            achieved
        )} of ${goalCurrencySign}${formatNumber(
            goalAmount
        )}`;
}


/*
 * Percentage
 */
if (goalPercent) {

    goalPercent.textContent =
        `${Math.round(
            progressPercent
        )}%`;
}


/*
 * Remaining amount
 */
if (goalRemaining) {

    const remaining =
        Math.max(
            goalAmount -
            progressValue,
            0
        );

    goalRemaining.textContent =
        remaining > 0
            ? `${goalCurrencySign}${formatNumber(
                remaining
            )} remaining`
            : 'Goal reached';
}
}

const goalSection =
    document.getElementById(
        'goalSection'
    );

if (goalSection) {

    goalSection.addEventListener(
        'click',
        () => {

            goalSection.classList.toggle(
                'show-remaining'
            );
        }
    );
}


/* ============================================
   MINI CARDS
   ============================================ */

function updateMiniCards() {

    const portfolio =
        state.portfolio.stocks || [];


    const ngx =
        portfolio.filter(
            s =>
                s.market === 'NGX'
        );


    const ngxInvested =
        ngx.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.buyPrice) || 0)
                ),
            0
        );


    const ngxCurrent =
        ngx.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.currentPrice) || 0)
                ),
            0
        );


    const ngxGain =
        ngxCurrent -
        ngxInvested;


    const ngxChangePercent =
        ngxInvested > 0
            ? (
                ngxGain /
                ngxInvested
            ) * 100
            : 0;


    const nseValue =
        document.getElementById(
            'nseValue'
        );


    const nseChange =
        document.getElementById(
            'nseChange'
        );


    const nseGain =
        document.getElementById(
            'nseGain'
        );


    const nseLoss =
        document.getElementById(
            'nseLoss'
        );


    if (nseValue) {

        nseValue.textContent =
            `₦${formatNumber(
                ngxCurrent
            )}`;
    }


    if (nseChange) {

        nseChange.textContent =
            `${
                ngxChangePercent >= 0
                    ? '+'
                    : ''
            }${ngxChangePercent.toFixed(
                2
            )}%`;


        nseChange.style.color =
            ngxChangePercent >= 0
                ? '#00a651'
                : '#d32f2f';
    }


    if (nseGain) {

        nseGain.textContent =
            ngxGain >= 0
                ? `+₦${formatNumber(
                    ngxGain
                )}`
                : '+₦0';
    }


    if (nseLoss) {

        nseLoss.textContent =
            ngxGain < 0
                ? `-₦${formatNumber(
                    Math.abs(
                        ngxGain
                    )
                )}`
                : '-₦0';
    }


    const us =
        portfolio.filter(
            s =>
                s.market === 'US'
        );


    const usInvested =
        us.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.buyPrice) || 0)
                ),
            0
        );


    const usCurrent =
        us.reduce(
            (sum, s) =>
                sum +
                (
                    (Number(s.quantity) || 0) *
                    (Number(s.currentPrice) || 0)
                ),
            0
        );


    const usGain =
        usCurrent -
        usInvested;


    const usChangePercent =
        usInvested > 0
            ? (
                usGain /
                usInvested
            ) * 100
            : 0;


    const usValue =
        document.getElementById(
            'usValue'
        );


    const usChange =
        document.getElementById(
            'usChange'
        );


    const usGainEl =
        document.getElementById(
            'usGain'
        );


    const usLoss =
        document.getElementById(
            'usLoss'
        );


    if (usValue) {

        usValue.textContent =
            `$${formatNumber(
                usCurrent
            )}`;
    }


    if (usChange) {

        usChange.textContent =
            `${
                usChangePercent >= 0
                    ? '+'
                    : ''
            }${usChangePercent.toFixed(
                2
            )}%`;


        usChange.style.color =
            usChangePercent >= 0
                ? '#90EE90'
                : '#FFB6C6';
    }


    if (usGainEl) {

        usGainEl.textContent =
            usGain >= 0
                ? `+$${formatNumber(
                    usGain
                )}`
                : '+$0';
    }


    if (usLoss) {

        usLoss.textContent =
            usGain < 0
                ? `-$${formatNumber(
                    Math.abs(
                        usGain
                    )
                )}`
                : '-$0';
    }
}


/* ============================================
   PERFORMANCE CHART
   ============================================ */




/* ============================================
   ACTIVITY
   ============================================ */

function getCombinedActivity() {

    const serverActivity =
        state.activity || [];


    const serverKeys =
        new Set(
            serverActivity.map(
                a =>
                    `${a.type}:${a.title}`
            )
        );


    const localOnly =
        (
            state.localActivity ||
            []
        )
            .filter(
                a =>
                    !serverKeys.has(
                        `${a.type}:${a.title}`
                    )
            );


    let combined =
        [
            ...localOnly,
            ...serverActivity
        ]
            .sort(
                (a, b) =>
                    new Date(
                        b.date
                    ) -
                    new Date(
                        a.date
                    )
            );


    if (state.activityClearedAt) {

        const clearedAt =
            new Date(
                state.activityClearedAt
            );


        combined =
            combined.filter(
                a =>
                    new Date(
                        a.date
                    ) >
                    clearedAt
            );
    }


    return combined;
}


function renderActivity() {

    const container =
        document.getElementById(
            'activityList'
        );


    const filter =
        document.getElementById(
            'activityFilter'
        );


    if (!container) {
        return;
    }


    if (
        !state.initialLoadComplete
    ) {
        return;
    }


    let activities =
        getCombinedActivity();


    const filterValue =
        filter?.value ||
        'all';


    if (
        filterValue !==
        'all'
    ) {

        activities =
            activities.filter(
                a =>
                    a.type ===
                    filterValue
            );
    }


if (
    activities.length === 0
) {

    container.innerHTML = `
        <div id="activityEmpty">
            <p>No activities</p>
            <p style="color: #999; font-size: 13px; margin-bottom: 20px;">
                Your activity will appear here
            </p>
            <img 
                src="owl_x5f_waving.svg" 
                alt="No activities" 
                style="width: 360px; height: 360px; object-fit: contain; margin: 0; padding: 0;"
            />
        </div>
    `;

    return;
}


    container.innerHTML =
        activities
            .map(
                a => {

                    const iconClass = {
                        invested:
                            'invested',
                        sold:
                            'sold',
                        rejected:
                            'rejected',
                        watching:
                            'watching'
                    }[
                        a.type
                    ] || 'invested';


                    const icons = {
                        invested:
                            '✓',
                        sold:
                            '↑',
                        rejected:
                            '✕',
                        watching:
                            '<i class="fa-solid fa-gear"></i>'
                    };


                    return `

                        <div class="activity-item">

                            <div
                                class="activity-icon ${iconClass}"
                            >
                                ${
                                    icons[
                                        a.type
                                    ]
                                }
                            </div>


                            <div class="activity-content">

                                <p class="activity-title">
                                    ${escapeHtml(
                                        a.title
                                    )}
                                </p>


                                <p class="activity-desc">
                                    ${escapeHtml(
                                        a.description
                                    )}
                                </p>

                            </div>


                            <p class="activity-time">
                                ${formatDate(
                                    a.date
                                )}
                            </p>

                        </div>

                    `;
                }
            )
            .join('');
}


/* ============================================
   WATCHLIST
   ============================================ */

function renderWatchlist() {

    const container =
        document.getElementById(
            'watchlistList'
        );


    const empty =
        document.getElementById(
            'watchlistEmpty'
        );


    if (
        !container ||
        !empty
    ) {
        return;
    }


    if (
        !state.initialLoadComplete
    ) {
        return;
    }


    const allStocks =
        state.watchlist.stocks || [];


    const stocks =
        applyWatchlistSearchAndSort(
            allStocks
        );


    if (
        allStocks.length === 0
    ) {

        container.style.display =
            'none';

        empty.style.display =
            'block';

        return;
    }


    container.style.display =
        'flex';

    empty.style.display =
        'none';


    if (
        stocks.length === 0
    ) {

        container.innerHTML =
            '<div class="empty-state"><p>No matches for your search</p></div>';

        return;
    }


    container.innerHTML =
        stocks
            .map(
                (stock, i) => {

                    const priceAtAdd =
                        stock.priceAtAdd ??
                        stock.currentPrice;


                    let change = 0;


                    if (
                        priceAtAdd &&
                        stock.currentPrice != null
                    ) {

                        change =
                            (
                                (
                                    stock.currentPrice -
                                    priceAtAdd
                                ) /
                                priceAtAdd
                            ) * 100;
                    }


                    const changeLabel =
                        stock.currentPrice !=
                        null
                            ? `${
                                change >= 0
                                    ? '+'
                                    : ''
                            }${change.toFixed(
                                1
                            )}%`
                            : '—';


                    const currencySign =
                        stock.market === 'US'
                            ? '$'
                            : '₦';


                    const safeTicker =
                        escapeHtml(
                            stock.ticker
                        );


                    const confidenceScore =
                        getConfidenceScore(
                            stock
                        );


                    const confidenceSignal =
                        getConfidenceSignal(
                            stock
                        );


                    const breakdown =
                        getConfidenceBreakdown(
                            stock
                        );


                    const dataDays =
                        stock
                            .confidenceLevel
                            ?.dataDays ??
                        0;


                    const confidenceClass =
                        getConfidenceClass(
                            confidenceScore,
                            confidenceSignal
                        );


                    const signalLabel =
                        formatConfidenceSignal(
                            confidenceSignal
                        );


                    const confidenceBadge =
                        confidenceScore !==
                        null

                            ? `
                                <span
                                    class="confidence-badge ${confidenceClass}"
                                >
                                    ${confidenceScore}
                                </span>
                            `

                            : `
                                <span
                                    class="confidence-badge pending"
                                >
                                    N/A
                                </span>
                            `;


                    return `

                        <div
                            class="watchlist-card"
                            id="watchlist-card-${safeTicker}-${i}"
                        >


                            <div
                                class="watchlist-card-main"
                                onclick="toggleWatchlistAnalysis(
                                    '${safeTicker}',
                                    '${stock.market || 'NGX'}',
                                    ${i}
                                )"
                            >


                                <div
                                    class="stock-avatar"
                                    style="background: ${
                                        API_COLORS[
                                            i %
                                            API_COLORS.length
                                        ]
                                    }"
                                >
                                    ${escapeHtml(
                                        stock.ticker?.[0] ||
                                        '?'
                                    )}
                                </div>


                                <div class="stock-info">

                                    <p class="stock-ticker">

                                        ${safeTicker}

                                        ${confidenceBadge}

                                    </p>


                                    <p class="stock-name">

                                        Watching for

                                        ${escapeHtml(
                                            stock.watchingDuration ||
                                            '1w'
                                        )}

                                        •

                                        ${formatDate(
                                            stock.dateAdded
                                        )}

                                    </p>

                                </div>


                                <div class="stock-price">

                                    <p class="stock-value">

                                        ${
                                            stock.currentPrice !=
                                            null
                                                ? currencySign +
                                                  formatNumber(
                                                      stock.currentPrice
                                                  )
                                                : '—'
                                        }

                                    </p>


                                    <p
                                        class="stock-change ${
                                            change >= 0
                                                ? 'positive'
                                                : 'negative'
                                        }"
                                    >
                                        ${changeLabel}
                                    </p>

                                </div>


                                <div class="watchlist-expand-icon">

                                    <span
                                        id="watchlist-arrow-${i}"
                                    >
                                        ⌄
                                    </span>

                                </div>

                            </div>


                            <div
                                class="watchlist-analysis"
                                id="watchlist-analysis-${i}"
                            >

                                <div class="watchlist-analysis-inner">


                                    <div class="watchlist-chart-section">

                                        <div class="analysis-section-header">

                                            <div>

                                                <p class="analysis-title">
                                                    Price History
                                                </p>

                                                <p class="analysis-subtitle">
                                                    Real market data
                                                </p>

                                            </div>


                                            <span
                                                class="chart-loading"
                                                id="chart-loading-${i}"
                                            >
                                                Loading...
                                            </span>

                                        </div>


                                        <div
                                            class="stock-history-chart"
                                            id="stock-chart-${i}"
                                        >

                                            <div class="chart-placeholder">
                                                Expand to load chart
                                            </div>

                                        </div>

                                    </div>


                                    <div class="watchlist-confidence-section">

                                        <div class="confidence-header">

                                            <div>

                                                <p class="analysis-title">
                                                    Confidence
                                                </p>

                                                <p class="analysis-subtitle">

                                                    ${
                                                        dataDays > 0
                                                            ? `Based on ${dataDays} real trading days`
                                                            : 'Historical data pending'
                                                    }

                                                </p>

                                            </div>


                                            <div
                                                class="confidence-score-large ${confidenceClass}"
                                            >

                                                ${
                                                    confidenceScore !==
                                                    null
                                                        ? confidenceScore
                                                        : '—'
                                                }

                                            </div>

                                        </div>


                                        ${
                                            signalLabel
                                                ? `
                                                    <div
                                                        class="confidence-signal ${confidenceClass}"
                                                    >
                                                        ${escapeHtml(
                                                            signalLabel
                                                        )}
                                                    </div>
                                                `
                                                : ''
                                        }


                                        <div class="confidence-components">

                                            ${renderConfidenceMetric(
                                                'Momentum',
                                                breakdown?.momentum
                                            )}

                                            ${renderConfidenceMetric(
                                                'Stability',
                                                breakdown?.stability
                                            )}

                                            ${renderConfidenceMetric(
                                                'Volatility',
                                                breakdown?.volatility
                                            )}

                                            ${renderConfidenceMetric(
                                                'Volume',
                                                breakdown?.volume
                                            )}

                                            ${renderConfidenceMetric(
                                                'Sector',
                                                breakdown?.sector
                                            )}

                                        </div>

                                    </div>


                                    <div class="watchlist-analysis-actions">

                                        <button
                                            class="btn-add watchlist-analysis-btn"
                                            onclick="event.stopPropagation(); openWatchlistToPortfolioModal('${safeTicker}')"
                                        >
                                            + Add to Portfolio
                                        </button>


                                        <button
                                            class="btn-delete watchlist-analysis-btn"
                                            onclick="event.stopPropagation(); deleteFromWatchlist('${safeTicker}')"
                                        >
                                            🗑 Remove
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;
                }
            )
            .join('');
}


/* ============================================
   WATCHLIST ANALYSIS HELPERS
   ============================================ */

function getConfidenceClass(
    score,
    signal = null
) {

    if (
        score === null ||
        score === undefined
    ) {
        return 'pending';
    }


    const value =
        Number(score);


    if (
        !Number.isFinite(value)
    ) {
        return 'pending';
    }


    if (
        signal === 'STRONG_SIGNAL' ||
        value >= 80
    ) {
        return 'strong';
    }


    if (
        signal === 'GOOD_SIGNAL' ||
        value >= 70
    ) {
        return 'good';
    }


    if (
        signal === 'MODERATE_SIGNAL' ||
        value >= 60
    ) {
        return 'moderate';
    }


    if (
        signal ===
            'STRONG_NEGATIVE_SIGNAL' ||
        value < 40
    ) {
        return 'negative';
    }


    return 'weak';
}


function formatConfidenceSignal(
    signal
) {

    if (!signal) {
        return null;
    }


    const labels = {

        STRONG_SIGNAL:
            'STRONG SIGNAL',

        GOOD_SIGNAL:
            'GOOD SIGNAL',

        MODERATE_SIGNAL:
            'MODERATE SIGNAL',

        WEAK_SIGNAL:
            'WEAK SIGNAL',

        STRONG_NEGATIVE_SIGNAL:
            'STRONG NEGATIVE SIGNAL'
    };


    return (
        labels[signal] ||
        signal.replace(
            /_/g,
            ' '
        )
    );
}


function renderConfidenceMetric(
    label,
    value
) {

    const numericValue =
        Number(value);


    const available =
        Number.isFinite(
            numericValue
        );


    const displayValue =
        available
            ? Math.round(
                numericValue
            )
            : '—';


    const width =
        available
            ? Math.max(
                0,
                Math.min(
                    100,
                    numericValue
                )
            )
            : 0;


    return `

        <div class="confidence-metric">

            <div class="confidence-metric-top">

                <span class="confidence-metric-label">
                    ${escapeHtml(
                        label
                    )}
                </span>


                <span class="confidence-metric-value">
                    ${displayValue}
                </span>

            </div>


            <div class="confidence-metric-track">

                <div
                    class="confidence-metric-fill"
                    style="width: ${width}%"
                ></div>

            </div>

        </div>

    `;
}


/* ============================================
   WATCHLIST EXPAND / COLLAPSE
   ============================================ */

async function toggleWatchlistAnalysis(
    ticker,
    market,
    index
) {

    const analysis =
        document.getElementById(
            `watchlist-analysis-${index}`
        );


    const arrow =
        document.getElementById(
            `watchlist-arrow-${index}`
        );


    if (!analysis) {
        return;
    }


    const isOpen =
        analysis.classList.contains(
            'active'
        );


    if (isOpen) {

        analysis.classList.remove(
            'active'
        );


        if (arrow) {
            arrow.textContent =
                '⌄';
        }


        return;
    }


    analysis.classList.add(
        'active'
    );


    if (arrow) {
        arrow.textContent =
            '⌃';
    }


    await loadWatchlistChart(
        ticker,
        market,
        index
    );
}


/* ============================================
   REAL STOCK HISTORY
   ============================================ */

async function loadWatchlistChart(
    ticker,
    market,
    index
) {

    const chart =
        document.getElementById(
            `stock-chart-${index}`
        );


    const loading =
        document.getElementById(
            `chart-loading-${index}`
        );


    if (!chart) {
        return;
    }


    if (
        chart.dataset.loaded ===
        'true'
    ) {
        return;
    }


    chart.innerHTML = `

        <div class="chart-placeholder">
            Loading real price history...
        </div>

    `;


    if (loading) {

        loading.textContent =
            'Loading...';

        loading.style.display =
            'inline';
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/stocks/history/${encodeURIComponent(
                    ticker
                )}?market=${encodeURIComponent(
                    market
                )}&days=30`
            );


        if (!response.ok) {

            throw new Error(
                `History request failed: ${response.status}`
            );
        }


        const data =
            await response.json();

            console.log(
    `[Watchlist Chart] ${ticker} raw history response:`,
    data
);


        const history =
            Array.isArray(data)
                ? data
                : data.data;


        if (
            !Array.isArray(history) ||
            history.length < 2
        ) {

            throw new Error(
                'Not enough real historical data'
            );
        }


        renderRealStockChart(
            chart,
            history,
            market
        );


        chart.dataset.loaded =
            'true';


        if (loading) {

            loading.style.display =
                'none';
        }


    } catch (error) {

        console.error(
            `[Watchlist Chart] ${ticker}:`,
            error
        );


        chart.innerHTML = `

            <div
                class="chart-placeholder chart-error"
            >
                Unable to load real price history
            </div>

        `;


        if (loading) {

            loading.style.display =
                'none';
        }
    }
}


/* ============================================
   REAL SVG STOCK CHART
   ============================================ */


function renderRealStockChart(
    container,
    history,
    market
) {

    const points =
        history
            .map(
                item => ({
                    date:
                        item.date ||
                        item.timestamp ||
                        item.datetime,

                    close:
                        Number(
                            item.close ??
                            item.price
                        )
                })
            )
            .filter(
                item =>
                    item.date &&
                    Number.isFinite(
                        item.close
                    ) &&
                    item.close > 0
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    if (
        points.length < 2
    ) {
        throw new Error(
            'Not enough valid price points'
        );
    }


    const width = 700;
    const height = 260;

    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 35;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;

    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    const prices =
        points.map(
            point =>
                point.close
        );


    const minPrice =
        Math.min(
            ...prices
        );

    const maxPrice =
        Math.max(
            ...prices
        );


    const range =
        maxPrice -
        minPrice;


    const safeRange =
        range === 0
            ? Math.max(
                maxPrice * 0.01,
                1
            )
            : range;


    const getX =
        index =>
            paddingLeft +
            (
                index /
                (
                    points.length -
                    1
                )
            ) *
            chartWidth;


    const getY =
        price =>
            paddingTop +
            (
                (
                    maxPrice -
                    price
                ) /
                safeRange
            ) *
            chartHeight;


    const linePoints =
        points
            .map(
                (
                    point,
                    index
                ) =>
                    `${getX(index)},${getY(
                        point.close
                    )}`
            )
            .join(' ');


    const firstPrice =
        prices[0];

    const lastPrice =
        prices[
            prices.length - 1
        ];


    const totalChange =
        firstPrice > 0
            ? (
                (
                    lastPrice -
                    firstPrice
                ) /
                firstPrice
            ) * 100
            : 0;


    const currency =
        market === 'US'
            ? '$'
            : '₦';


    const changeClass =
        totalChange >= 0
            ? 'positive'
            : 'negative';


    const gradientPoints =
        `${paddingLeft},${
            height -
            paddingBottom
        } ` +
        linePoints +
        ` ${getX(
            points.length - 1
        )},${
            height -
            paddingBottom
        }`;


    const startLabel =
        formatChartDate(
            points[0].date
        );


    const endLabel =
        formatChartDate(
            points[
                points.length - 1
            ].date
        );


    container.innerHTML = `

        <div class="stock-chart-summary">

            <div>

                <span
                    class="chart-range-label"
                >
                    ${currency}${formatNumber(
                        lastPrice
                    )}
                </span>

                <span
                    class="chart-change ${changeClass}"
                >
                    ${
                        totalChange >= 0
                            ? '+'
                            : ''
                    }${totalChange.toFixed(
                        2
                    )}%

                </span>

            </div>


            <span
                class="chart-data-label"
            >
                ${points.length}
                real trading days
            </span>

        </div>


        <div class="stock-chart-svg-wrap">

            <svg
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
                class="stock-chart-svg"
                role="img"
                aria-label="Real historical price chart"
            >

                <!-- Y axis -->

                <line
                    x1="${paddingLeft}"
                    y1="${paddingTop}"
                    x2="${paddingLeft}"
                    y2="${
                        height -
                        paddingBottom
                    }"
                    class="chart-axis"
                />


                <!-- X axis -->

                <line
                    x1="${paddingLeft}"
                    y1="${
                        height -
                        paddingBottom
                    }"
                    x2="${
                        width -
                        paddingRight
                    }"
                    y2="${
                        height -
                        paddingBottom
                    }"
                    class="chart-axis"
                />


                <!-- Price area -->

                <polygon
                    points="${gradientPoints}"
                    class="chart-area"
                />


                <!-- Price line -->

                <polyline
                    points="${linePoints}"
                    class="chart-line"
                    fill="none"
                />


                <!-- Latest price dot -->

                <circle
                    cx="${getX(
                        points.length - 1
                    )}"
                    cy="${getY(
                        lastPrice
                    )}"
                    r="4"
                    class="chart-dot"
                />


                <!-- Vertical crosshair -->

                <line
                    class="chart-crosshair"
                    x1="0"
                    y1="${paddingTop}"
                    x2="0"
                    y2="${
                        height -
                        paddingBottom
                    }"
                    style="display:none;"
                />


                <!-- Horizontal price guide -->

                <line
                    class="chart-price-guide"
                    x1="${paddingLeft}"
                    y1="0"
                    x2="${
                        width -
                        paddingRight
                    }"
                    y2="0"
                    style="display:none;"
                />


                <!-- Selected point -->

                <circle
                    class="chart-hover-dot"
                    cx="0"
                    cy="0"
                    r="5"
                    style="display:none;"
                />


                <!-- Invisible touch/mouse area -->

                <rect
                    class="chart-interaction-area"
                    x="${paddingLeft}"
                    y="${paddingTop}"
                    width="${chartWidth}"
                    height="${chartHeight}"
                    fill="transparent"
                />

            </svg>


            <!-- Tooltip -->

            <div
                class="chart-tooltip"
                style="display:none;"
            >

                <div
                    class="chart-tooltip-price"
                >
                    —
                </div>

                <div
                    class="chart-tooltip-change"
                >
                    —
                </div>

                <div
                    class="chart-tooltip-date"
                >
                    —
                </div>

            </div>

        </div>


        <div class="chart-date-row">

            <span>
                ${startLabel}
            </span>

            <span>
                ${endLabel}
            </span>

        </div>

    `;


    const svg =
        container.querySelector(
            '.stock-chart-svg'
        );


    const interactionArea =
        container.querySelector(
            '.chart-interaction-area'
        );


    const crosshair =
        container.querySelector(
            '.chart-crosshair'
        );


    const priceGuide =
        container.querySelector(
            '.chart-price-guide'
        );


    const hoverDot =
        container.querySelector(
            '.chart-hover-dot'
        );


    const tooltip =
        container.querySelector(
            '.chart-tooltip'
        );


    const tooltipPrice =
        container.querySelector(
            '.chart-tooltip-price'
        );


    const tooltipChange =
        container.querySelector(
            '.chart-tooltip-change'
        );


    const tooltipDate =
        container.querySelector(
            '.chart-tooltip-date'
        );


    const summaryPrice =
        container.querySelector(
            '.chart-range-label'
        );


    const summaryChange =
        container.querySelector(
            '.chart-change'
        );


    if (
        !svg ||
        !interactionArea ||
        !crosshair ||
        !priceGuide ||
        !hoverDot ||
        !tooltip
    ) {
        return;
    }


    function showPoint(index) {

        const point =
            points[index];

        if (!point) {
            return;
        }


        const x =
            getX(index);

        const y =
            getY(
                point.close
            );


        /*
         * Change from the previous
         * real trading day.
         */

        let dailyChange = 0;

        if (
            index > 0 &&
            points[index - 1].close > 0
        ) {

            dailyChange =
                (
                    (
                        point.close -
                        points[
                            index - 1
                        ].close
                    ) /
                    points[
                        index - 1
                    ].close
                ) * 100;

        }


        const dailyChangeClass =
            dailyChange >= 0
                ? 'positive'
                : 'negative';


        /*
         * Move vertical crosshair.
         */

        crosshair.setAttribute(
            'x1',
            x
        );

        crosshair.setAttribute(
            'x2',
            x
        );

        crosshair.style.display =
            'block';


        /*
         * Move horizontal price guide.
         */

        priceGuide.setAttribute(
            'y1',
            y
        );

        priceGuide.setAttribute(
            'y2',
            y
        );

        priceGuide.style.display =
            'block';


        /*
         * Move selected dot.
         */

        hoverDot.setAttribute(
            'cx',
            x
        );

        hoverDot.setAttribute(
            'cy',
            y
        );

        hoverDot.style.display =
            'block';


        /*
         * Update tooltip.
         */

        tooltipPrice.textContent =
            `${currency}${formatNumber(
                point.close
            )}`;


        tooltipChange.textContent =
            index === 0
                ? 'First available trading day'
                : `${
                    dailyChange >= 0
                        ? '+'
                        : ''
                }${dailyChange.toFixed(
                    2
                )}% vs previous day`;


        tooltipChange.className =
            `chart-tooltip-change ${dailyChangeClass}`;


        tooltipDate.textContent =
            formatChartDate(
                point.date
            );


        tooltip.style.display =
            'block';


        /*
         * Update the main price display
         * while sliding.
         */

        if (summaryPrice) {

            summaryPrice.textContent =
                `${currency}${formatNumber(
                    point.close
                )}`;

        }


        if (summaryChange) {

            if (index === 0) {

                summaryChange.textContent =
                    '—';

                summaryChange.className =
                    'chart-change';

            } else {

                summaryChange.textContent =
                    `${
                        dailyChange >= 0
                            ? '+'
                            : ''
                    }${dailyChange.toFixed(
                        2
                    )}%`;

                summaryChange.className =
                    `chart-change ${dailyChangeClass}`;

            }

        }


        /*
         * Position tooltip.
         */

        const svgRect =
            svg.getBoundingClientRect();


        const wrapper =
            container.querySelector(
                '.stock-chart-svg-wrap'
            );


        if (!wrapper) {
            return;
        }


        const wrapperRect =
            wrapper.getBoundingClientRect();


        const relativeX =
            (
                x /
                width
            ) *
            svgRect.width;


        let tooltipLeft =
            relativeX;


        const tooltipWidth =
            tooltip.offsetWidth;


        if (
            tooltipLeft +
            tooltipWidth / 2 >
            wrapperRect.width
        ) {

            tooltipLeft =
                wrapperRect.width -
                tooltipWidth / 2 -
                8;

        } else if (
            tooltipLeft -
            tooltipWidth / 2 <
            0
        ) {

            tooltipLeft =
                tooltipWidth / 2 +
                8;
        }


        tooltip.style.left =
            `${tooltipLeft}px`;

    }


    function resetChart() {

        crosshair.style.display =
            'none';

        priceGuide.style.display =
            'none';

        hoverDot.style.display =
            'none';

        tooltip.style.display =
            'none';


        /*
         * Return header to latest
         * real price and 30-day change.
         */

        if (summaryPrice) {

            summaryPrice.textContent =
                `${currency}${formatNumber(
                    lastPrice
                )}`;

        }


        if (summaryChange) {

            summaryChange.textContent =
                `${
                    totalChange >= 0
                        ? '+'
                        : ''
                }${totalChange.toFixed(
                    2
                )}%`;

            summaryChange.className =
                `chart-change ${changeClass}`;

        }

    }


    function getNearestPoint(event) {

        const rect =
            interactionArea
                .getBoundingClientRect();


        const relativeX =
            event.clientX -
            rect.left;


        const clampedX =
            Math.max(
                0,
                Math.min(
                    relativeX,
                    rect.width
                )
            );


        const chartX =
            paddingLeft +
            (
                clampedX /
                rect.width
            ) *
            chartWidth;


        let closestIndex =
            0;


        let smallestDistance =
            Infinity;


        points.forEach(
            (
                point,
                index
            ) => {

                const distance =
                    Math.abs(
                        getX(index) -
                        chartX
                    );


                if (
                    distance <
                    smallestDistance
                ) {

                    smallestDistance =
                        distance;

                    closestIndex =
                        index;

                }

            }
        );


        return closestIndex;
    }


    let isDragging =
        false;


    /*
     * Start touch/mouse interaction.
     */

    interactionArea.addEventListener(
        'pointerdown',
        event => {

            isDragging =
                true;


            try {

                interactionArea.setPointerCapture(
                    event.pointerId
                );

            } catch (error) {}


            showPoint(
                getNearestPoint(
                    event
                )
            );

        }
    );


    /*
     * Move across chart.
     */

    interactionArea.addEventListener(
        'pointermove',
        event => {

            if (!isDragging) {

                if (
                    event.pointerType !==
                    'mouse'
                ) {
                    return;
                }

            }


            showPoint(
                getNearestPoint(
                    event
                )
            );

        }
    );


    /*
     * Finish touch/mouse drag.
     */

    interactionArea.addEventListener(
        'pointerup',
        event => {

            isDragging =
                false;


            try {

                interactionArea.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {}

        }
    );


    interactionArea.addEventListener(
        'pointercancel',
        () => {

            isDragging =
                false;

        }
    );


    /*
     * Desktop mouse entering chart.
     */

    interactionArea.addEventListener(
        'pointerenter',
        event => {

            if (
                event.pointerType ===
                'mouse'
            ) {

                showPoint(
                    getNearestPoint(
                        event
                    )
                );

            }

        }
    );


    /*
     * Desktop mouse leaving chart.
     */

    interactionArea.addEventListener(
        'pointerleave',
        event => {

            if (
                event.pointerType ===
                'mouse' &&
                !isDragging
            ) {

                resetChart();

            }

        }
    );

}





function formatChartDate(date) {

    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return '—';
    }


    return parsed.toLocaleDateString(
        'en-US',
        {
            month: 'short',
            day: 'numeric'
        }
    );
}


/* ============================================
   PORTFOLIO
   ============================================ */

function renderPortfolio() {

    const container =
        document.getElementById(
            'portfolioList'
        );


    const empty =
        document.getElementById(
            'portfolioEmpty'
        );


    if (
        !container ||
        !empty
    ) {
        return;
    }


    if (
        !state.initialLoadComplete
    ) {
        return;
    }


    const allStocks =
        state.portfolio.stocks || [];


    const stocks =
        applyPortfolioSearchAndSort(
            allStocks
        );


    if (
        allStocks.length === 0
    ) {

        container.style.display =
            'none';

        empty.style.display =
            'block';

        return;
    }


    container.style.display =
        'flex';

    empty.style.display =
        'none';


    if (
        stocks.length === 0
    ) {

        container.innerHTML =
            '<div class="empty-state"><p>No matches for your search</p></div>';

        return;
    }


    container.innerHTML =
        stocks
            .map(
                (stock, i) => {

                    const currentPrice =
                        Number(
                            stock.currentPrice
                        );


                    const buyPrice =
                        Number(
                            stock.buyPrice
                        );


                    const quantity =
                        Number(
                            stock.quantity
                        ) || 0;


                    const gain =
                        (
                            (
                                Number.isFinite(
                                    currentPrice
                                )
                                    ? currentPrice
                                    : 0
                            ) -
                            buyPrice
                        ) *
                        quantity;


                    const gainPercent =
                        buyPrice > 0 &&
                        Number.isFinite(
                            currentPrice
                        )
                            ? (
                                (
                                    currentPrice -
                                    buyPrice
                                ) /
                                buyPrice
                            ) * 100
                            : 0;


                    const currencySign =
                        stock.market === 'US'
                            ? '$'
                            : '₦';


                    const safeTicker =
                        escapeHtml(
                            stock.ticker
                        );


                    const confidenceScore =
                        getConfidenceScore(
                            stock
                        );


                    const confidenceBadge =
                        confidenceScore !==
                        null

                            ? `
                                <span
                                    class="confidence-badge"
                                >
                                    ${confidenceScore}
                                </span>
                            `

                            : '';


                    return `

                        <div class="stock-item">

                            <div
                                class="stock-avatar"
                                style="background: ${
                                    API_COLORS[
                                        i %
                                        API_COLORS.length
                                    ]
                                }"
                            >
                                ${escapeHtml(
                                    stock.ticker?.[0] ||
                                    '?'
                                )}
                            </div>


                            <div class="stock-info">

                                <p class="stock-ticker">

                                    ${safeTicker}

                                    ${confidenceBadge}

                                </p>


                                <p class="stock-name">

                                    ${quantity}
                                    shares @

                                    ${currencySign}${formatNumber(
                                        buyPrice
                                    )}

                                </p>

                            </div>


                            <div class="stock-price">

                                <p class="stock-value">

                                    ${
                                        Number.isFinite(
                                            currentPrice
                                        )
                                            ? currencySign +
                                              formatNumber(
                                                  currentPrice *
                                                  quantity
                                              )
                                            : '—'
                                    }

                                </p>


                                <p
                                    class="stock-change ${
                                        gain >= 0
                                            ? 'positive'
                                            : 'negative'
                                    }"
                                >

                                    ${
                                        gain >= 0
                                            ? '+'
                                            : ''
                                    }

                                    ${gainPercent.toFixed(
                                        1
                                    )}%

                                </p>

                            </div>


                            <div class="stock-actions">

                                <button
                                    class="btn-icon btn-edit"
                                    onclick="openEditStockModal(
                                        '${stock.ticker}',
                                        '${stock.market}'
                                    )"
                                    title="Edit"
                                    aria-label="Edit ${safeTicker} position"
                                >
                                    ✏️
                                </button>

                            </div>

                        </div>

                    `;
                }
            )
            .join('');
}


/* ============================================
   MARKET MODAL
   ============================================ */

function openMarketModal(
    market
) {

    const modal =
        document.getElementById(
            'marketModal'
        );


    const title =
        document.getElementById(
            'marketModalTitle'
        );


    if (title) {

        title.textContent =
            market === 'NGX'
                ? 'NGX Portfolio'
                : 'US Portfolio';
    }


    renderMarketStockList(
        market
    );


    if (modal) {
        modal.classList.add(
            'active'
        );
    }
}


function closeMarketModal() {

    const modal =
        document.getElementById(
            'marketModal'
        );


    if (modal) {

        modal.classList.remove(
            'active'
        );
    }
}


function renderMarketStockList(
    market
) {

    const container =
        document.getElementById(
            'marketStockList'
        );


    const empty =
        document.getElementById(
            'marketStockEmpty'
        );


    if (
        !container ||
        !empty
    ) {
        return;
    }


    const stocks =
        (
            state.portfolio.stocks ||
            []
        )
            .filter(
                s =>
                    s.market === market
            );


    const currencySign =
        market === 'NGX'
            ? '₦'
            : '$';


    if (
        stocks.length === 0
    ) {

        container.style.display =
            'none';

        empty.style.display =
            'block';

        return;
    }


    container.style.display =
        'flex';

    empty.style.display =
        'none';


    container.innerHTML =
        stocks
            .map(
                (stock, i) => {

                    const currentPrice =
                        Number(
                            stock.currentPrice
                        );


                    const buyPrice =
                        Number(
                            stock.buyPrice
                        );


                    const quantity =
                        Number(
                            stock.quantity
                        ) || 0;


                    const gain =
                        (
                            (
                                Number.isFinite(
                                    currentPrice
                                )
                                    ? currentPrice
                                    : 0
                            ) -
                            buyPrice
                        ) *
                        quantity;


                    const gainPercent =
                        buyPrice > 0 &&
                        Number.isFinite(
                            currentPrice
                        )
                            ? (
                                (
                                    currentPrice -
                                    buyPrice
                                ) /
                                buyPrice
                            ) * 100
                            : 0;


                    const confidenceScore =
                        getConfidenceScore(
                            stock
                        );


                    const confidenceBadge =
                        confidenceScore !==
                        null

                            ? `
                                <span
                                    class="confidence-badge"
                                >
                                    ${confidenceScore}
                                </span>
                            `

                            : `
                                <span
                                    class="confidence-badge pending"
                                >
                                    N/A
                                </span>
                            `;


                    const safeTicker =
                        escapeHtml(
                            stock.ticker
                        );


                    return `

                        <div
                            class="stock-item"
                            onclick="showStockDetailModal(
                                '${stock.ticker}',
                                '${market}'
                            )"
                        >

                            <div
                                class="stock-avatar"
                                style="background: ${
                                    API_COLORS[
                                        i %
                                        API_COLORS.length
                                    ]
                                }"
                            >
                                ${escapeHtml(
                                    stock.ticker?.[0] ||
                                    '?'
                                )}
                            </div>


                            <div class="stock-info">

                                <p class="stock-ticker">

                                    ${safeTicker}

                                    ${confidenceBadge}

                                </p>


                                <p class="stock-name">

                                    ${quantity}
                                    shares @

                                    ${currencySign}${formatNumber(
                                        buyPrice
                                    )}

                                </p>

                            </div>


                            <div class="stock-price">

                                <p class="stock-value">

                                    ${
                                        Number.isFinite(
                                            currentPrice
                                        )
                                            ? currencySign +
                                              formatNumber(
                                                  currentPrice *
                                                  quantity
                                              )
                                            : '—'
                                    }

                                </p>


                                <p
                                    class="stock-change ${
                                        gain >= 0
                                            ? 'positive'
                                            : 'negative'
                                    }"
                                >

                                    ${
                                        gain >= 0
                                            ? '+'
                                            : ''
                                    }

                                    ${gainPercent.toFixed(
                                        1
                                    )}%

                                </p>

                            </div>


                            <div class="stock-actions">

                                <button
                                    class="btn-icon btn-edit"
                                    onclick="event.stopPropagation(); openEditStockModal(
                                        '${stock.ticker}',
                                        '${market}'
                                    )"
                                    title="Edit"
                                    aria-label="Edit ${safeTicker}"
                                >
                                    ✏️
                                </button>


                                <button
                                    class="btn-icon btn-sell"
                                    onclick="event.stopPropagation(); confirmSellFromDetail(
                                        '${stock.ticker}',
                                        '${market}'
                                    )"
                                    title="Sell"
                                    aria-label="Sell ${safeTicker}"
                                >
                                    📊
                                </button>

                            </div>

                        </div>

                    `;
                }
            )
            .join('');
}


/* ============================================
   SOLD
   ============================================ */

function renderSold() {

    const container =
        document.getElementById(
            'soldList'
        );


    const empty =
        document.getElementById(
            'soldEmpty'
        );


    if (
        !container ||
        !empty
    ) {
        return;
    }


    const stocks =
        state.sold.stocks || [];


    if (
        stocks.length === 0
    ) {

        container.style.display =
            'none';

        empty.style.display =
            'block';

        return;
    }


    container.style.display =
        'flex';

    empty.style.display =
        'none';


    container.innerHTML =
        stocks
            .map(
                (stock, i) => {

                    const currencySign =
                        stock.market === 'US'
                            ? '$'
                            : '₦';


                    const gain =
                        (
                            stock.sellPrice -
                            stock.buyPrice
                        ) *
                        stock.quantity;


                    const gainPercent =
                        stock.buyPrice > 0
                            ? (
                                (
                                    stock.sellPrice -
                                    stock.buyPrice
                                ) /
                                stock.buyPrice
                            ) * 100
                            : 0;


                    const safeTicker =
                        escapeHtml(
                            stock.ticker
                        );


                    return `

                        <div class="stock-item">

                            <div
                                class="stock-avatar"
                                style="background: ${
                                    API_COLORS[
                                        i %
                                        API_COLORS.length
                                    ]
                                }"
                            >
                                ${escapeHtml(
                                    stock.ticker?.[0] ||
                                    '?'
                                )}
                            </div>


                            <div class="stock-info">

                                <p class="stock-ticker">
                                    ${safeTicker}
                                </p>


                                <p class="stock-name">

                                    ${stock.quantity}
                                    shares |

                                    ${currencySign}${formatNumber(
                                        stock.buyPrice
                                    )}

                                    →

                                    ${currencySign}${formatNumber(
                                        stock.sellPrice
                                    )}

                                </p>

                            </div>


                            <div class="stock-price">

                                <p class="stock-value">

                                    ${
                                        gain >= 0
                                            ? '+'
                                            : ''
                                    }

                                    ${currencySign}${formatNumber(
                                        gain
                                    )}

                                </p>


                                <p
                                    class="stock-change ${
                                        gain >= 0
                                            ? 'positive'
                                            : 'negative'
                                    }"
                                >

                                    ${
                                        gain >= 0
                                            ? '+'
                                            : ''
                                    }

                                    ${gainPercent.toFixed(
                                        1
                                    )}%

                                </p>

                            </div>

                        </div>

                    `;
                }
            )
            .join('');
}


function filterActivity() {
    renderActivity();
}


/* ============================================
   NOTIFICATIONS
   ============================================ */

function showToast(
    message,
    type = 'success',
    action = null,
    duration = TOAST_DURATION
) {

    const container =
        document.getElementById(
            'toastContainer'
        );


    if (!container) {
        return;
    }


    const toast =
        document.createElement(
            'div'
        );


    toast.className =
        `toast ${type}`;


    const icons = {

        success:
            '✓',

        error:
            '✕',

        warning:
            '⚠️'
    };


    toast.innerHTML = `

        <div class="toast-icon">
            ${icons[type] || ''}
        </div>


        <div class="toast-content">

            <p class="toast-title">
                ${escapeHtml(
                    message
                )}
            </p>

        </div>


        ${
            action
                ? `
                    <button
                        class="toast-action"
                        type="button"
                    >
                        ${escapeHtml(
                            action.label
                        )}
                    </button>
                `
                : ''
        }


        <button
            class="toast-close"
            aria-label="Dismiss notification"
        >
            ✕
        </button>

    `;


    container.appendChild(
        toast
    );


    let dismissTimer =
        setTimeout(
            () =>
                toast.remove(),
            duration
        );


    if (action) {

        const actionBtn =
            toast.querySelector(
                '.toast-action'
            );


        if (actionBtn) {

            actionBtn.addEventListener(
                'click',
                () => {

                    clearTimeout(
                        dismissTimer
                    );


                    toast.remove();


                    action.onClick();
                }
            );
        }
    }


    const closeBtn =
        toast.querySelector(
            '.toast-close'
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            'click',
            () => {

                clearTimeout(
                    dismissTimer
                );


                toast.remove();
            }
        );
    }
}


function showSyncIndicator(
    show
) {

    const indicator =
        document.getElementById(
            'syncIndicator'
        );


    if (!indicator) {
        return;
    }


    if (show) {

        indicator.classList.add(
            'active'
        );

    } else {

        indicator.classList.remove(
            'active'
        );
    }
}


function updateLastUpdatedTime() {

    const now =
        new Date();


    const minutes =
        Math.floor(
            (
                now -
                state.lastUpdated
            ) /
            60000
        );


    let timeStr =
        'now';


    if (
        minutes > 0
    ) {

        if (
            minutes === 1
        ) {

            timeStr =
                '1 minute ago';

        } else if (
            minutes < 60
        ) {

            timeStr =
                `${minutes} minutes ago`;

        } else {

            timeStr =
                `${Math.floor(
                    minutes / 60
                )} hours ago`;
        }
    }


    const el =
        document.getElementById(
            'lastUpdated'
        );


    if (el) {

        el.textContent =
            timeStr;
    }
}


/* ============================================
   SETTINGS
   ============================================ */

function saveSettings() {

    const nameEl =
        document.getElementById(
            'settingName'
        );


    const goalEl =
        document.getElementById(
            'settingGoal'
        );


    const name =
        nameEl
            ? nameEl.value
            : '';


    const goal =
        goalEl
            ? parseInt(
                goalEl.value
            )
            : NaN;


    if (name) {
        state.userName =
            name;
    }


    if (
        goal &&
        goal > 0
    ) {

        state.settings.goalAmount =
            goal;
    }


    saveToLocalStorage();

    updateUI();


    showToast(
        '✓ Settings saved',
        'success'
    );
}


/* ============================================
   LOCAL STORAGE
   ============================================ */

function saveToLocalStorage() {

    const toSave = {

        portfolio:
            state.portfolio,

        watchlist:
            state.watchlist,

        sold:
            state.sold,

        activity:
            state.activity,

        settings:
            state.settings,

        userName:
            state.userName,

        exchangeRate:
            state.exchangeRate,

        lastUpdated:
            state.lastUpdated
    };


    localStorage.setItem(
        'portfolioTrackerState',

        JSON.stringify(
            toSave
        )
    );
}


function loadFromLocalStorage() {

    const saved =
        localStorage.getItem(
            'portfolioTrackerState'
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        state.portfolio =
            data.portfolio ||
            state.portfolio;


        state.watchlist =
            data.watchlist ||
            state.watchlist;


        state.sold =
            data.sold ||
            state.sold;


        state.activity =
            data.activity ||
            state.activity;


        state.settings =
            data.settings ||
            state.settings;


        state.userName =
            data.userName ||
            state.userName;


        state.exchangeRate =
            data.exchangeRate ||
            state.exchangeRate;


        if (
            data.lastUpdated
        ) {

            state.lastUpdated =
                new Date(
                    data.lastUpdated
                );
        }


        state.initialLoadComplete =
            true;


        updateUI();


    } catch (err) {

        console.error(
            'Error loading local storage:',
            err
        );
    }
}


/* ============================================
   UTILITIES
   ============================================ */

function formatNumber(
    num
) {

    const value =
        Number(num);


    if (
        !Number.isFinite(
            value
        )
    ) {
        return '0';
    }


    return value.toLocaleString(
        'en-US',
        {
            maximumFractionDigits:
                2
        }
    );
}


function formatDate(
    date
) {

    if (!date) {
        return 'recently';
    }


    const d =
        new Date(date);


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {
        return 'recently';
    }


    const today =
        new Date();


    const yesterday =
        new Date(today);


    yesterday.setDate(
        yesterday.getDate() -
        1
    );


    if (
        d.toDateString() ===
        today.toDateString()
    ) {

        return 'Today';
    }


    if (
        d.toDateString() ===
        yesterday.toDateString()
    ) {

        return 'Yesterday';
    }


    return d.toLocaleDateString(
        'en-US',
        {
            month: 'short',
            day: 'numeric'
        }
    );
}


/* ============================================
   DEBUGGING
   ============================================ */

window.debugState =
    () =>
        console.log(
            state
        );


window.clearAllData =
    () => {

        localStorage.removeItem(
            'portfolioTrackerState'
        );

        location.reload();
    };