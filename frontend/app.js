/* ============================================
   STATE MANAGEMENT
   ============================================ */
const state = {
    userId: 'user-1', // Hardcoded for now
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
    exchangeRate: { usdToNgn: 1650, ngnToUsd: 0.000606, timestamp: new Date() },
    displayCurrency: localStorage.getItem('portfolioTrackerCurrency') || 'NGN',
    initialLoadComplete: false, // ← NEW: drives the loading skeleton
    portfolioSearch: '',        // ← NEW: search/sort state
    portfolioSort: 'ticker-asc',
    watchlistSearch: '',
    watchlistSort: 'date-desc'
};

/* ============================================
   CONFIGURATION
   ============================================ */
const API_BASE = 'http://localhost:5000/api';
const REFRESH_INTERVAL = 300000; // 5 minutes
const TOAST_DURATION = 3000;
const UNDO_TOAST_DURATION = 6000; // ← NEW: longer window for actions with Undo
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
    renderSkeletons(); // ← NEW: show placeholders immediately, before first fetch resolves
    fetchAllData();
    setupNetworkListeners();
    setupPullToRefresh();
    syncCurrencyToggleUI();

    // Refresh every 5 minutes
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
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        el.textContent = `${hours}:${minutes}`;
    };

    updateTime();
    setInterval(updateTime, 60000);
}

function setupNetworkListeners() {
    window.addEventListener('online', () => {
        state.isOnline = true;
        document.getElementById('networkWarning').classList.add('hidden');
        document.getElementById('offlineBanner').classList.add('hidden');
        showToast('Connection restored', 'success');
        fetchAllData();
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        document.getElementById('networkWarning').classList.remove('hidden');
        document.getElementById('offlineBanner').classList.remove('hidden');
        showToast('You are offline', 'warning');
    });
}

/* ============================================
   MODAL TAB SWITCHING
   ============================================ */
function setupModalTabs() {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const formType = e.target.dataset.form;

            document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
            document.getElementById(`${formType}Form`).classList.add('active');
        });
    });
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
    document.getElementById('addBtn').addEventListener('click', openAddStockModal);
    document.getElementById('closeAddModal').addEventListener('click', closeAddStockModal);

    document.getElementById('addToPortfolio').addEventListener('click', () => addStock('portfolio'));
    document.getElementById('addToWatchlist').addEventListener('click', () => addStock('watchlist'));

    document.getElementById('addTicker').addEventListener('input', (e) => handleAutocomplete(e, 'autocompleteDropdown', 'addTicker', 'addSector'));
    document.getElementById('watchTicker').addEventListener('input', (e) => handleAutocomplete(e, 'autocompleteDropdown2', 'watchTicker', 'watchSector'));

    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById('watchDuration').value = e.target.dataset.duration;
        });
    });

    document.getElementById('addQuantity').addEventListener('input', validateQuantity);
    document.getElementById('addPrice').addEventListener('input', validatePrice);

    document.getElementById('activityFilter').addEventListener('change', filterActivity);

    document.querySelectorAll('.toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentPeriod = e.target.dataset.period;
            renderChart();
        });
    });

    document.getElementById('closeMarketModal').addEventListener('click', closeMarketModal);

    document.getElementById('saveSetting').addEventListener('click', saveSettings);

    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currency = e.currentTarget.dataset.currency;
            if (!currency || currency === state.displayCurrency) return;

            state.displayCurrency = currency;
            localStorage.setItem('portfolioTrackerCurrency', currency);

            syncCurrencyToggleUI();
            updatePortfolioCard();
        });
    });

    const confirmCancel = document.getElementById('confirmCancel');
    if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);

    setupModalTabs();
    setupPortfolioCardListeners();
    setupSearchAndSortListeners(); // ← NEW
}

/* ============================================
   SEARCH & SORT (Portfolio / Watchlist)
   ============================================ */
function setupSearchAndSortListeners() {
    const pSearch = document.getElementById('portfolioSearchInput');
    const pSort = document.getElementById('portfolioSortSelect');
    const wSearch = document.getElementById('watchlistSearchInput');
    const wSort = document.getElementById('watchlistSortSelect');

    if (pSearch) {
        pSearch.addEventListener('input', (e) => {
            state.portfolioSearch = e.target.value;
            renderPortfolio();
        });
    }
    if (pSort) {
        pSort.addEventListener('change', (e) => {
            state.portfolioSort = e.target.value;
            renderPortfolio();
        });
    }
    if (wSearch) {
        wSearch.addEventListener('input', (e) => {
            state.watchlistSearch = e.target.value;
            renderWatchlist();
        });
    }
    if (wSort) {
        wSort.addEventListener('change', (e) => {
            state.watchlistSort = e.target.value;
            renderWatchlist();
        });
    }
}

function applyPortfolioSearchAndSort(stocks) {
    let result = stocks;

    const q = state.portfolioSearch.trim().toUpperCase();
    if (q) {
        result = result.filter(s => s.ticker.toUpperCase().includes(q));
    }

    result = [...result];
    switch (state.portfolioSort) {
        case 'ticker-asc':
            result.sort((a, b) => a.ticker.localeCompare(b.ticker));
            break;
        case 'value-desc':
            result.sort((a, b) => (b.currentPrice * b.quantity) - (a.currentPrice * a.quantity));
            break;
        case 'gain-desc': {
            const pct = s => ((s.currentPrice - s.buyPrice) / s.buyPrice) * 100 || 0;
            result.sort((a, b) => pct(b) - pct(a));
            break;
        }
        default:
            break;
    }

    return result;
}

function applyWatchlistSearchAndSort(stocks) {
    let result = stocks;

    const q = state.watchlistSearch.trim().toUpperCase();
    if (q) {
        result = result.filter(s => s.ticker.toUpperCase().includes(q));
    }

    result = [...result];
    switch (state.watchlistSort) {
        case 'ticker-asc':
            result.sort((a, b) => a.ticker.localeCompare(b.ticker));
            break;
        case 'date-desc':
            result.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
            break;
        default:
            break;
    }

    return result;
}

/* ============================================
   PULL TO REFRESH
   ============================================ */
function setupPullToRefresh() {
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const indicator = document.getElementById('pullToRefresh');
    if (!indicator) return;

    const PULL_THRESHOLD = 80;
    const MAX_PULL = 120;

    let touchStartY = 0;
    let pulling = false;
    let refreshing = false;

    indicator.style.position = 'fixed';
    indicator.style.top = '0';
    indicator.style.left = '0';
    indicator.style.right = '0';
    indicator.style.textAlign = 'center';
    indicator.style.padding = '10px';
    indicator.style.transform = 'translateY(-60px)';
    indicator.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    indicator.style.opacity = '0';
    indicator.style.zIndex = '500';
    indicator.style.pointerEvents = 'none';

    document.addEventListener('touchstart', (e) => {
        pulling = window.scrollY === 0 && !refreshing;
        if (pulling) touchStartY = e.touches[0].clientY;
    }, { passive: true });

    // ← FIX: preventDefault() stops native browser pull-to-refresh from hijacking
    // the gesture; { passive: false } is required or preventDefault() is ignored.
    document.addEventListener('touchmove', (e) => {
        if (!pulling || refreshing) return;

        const distance = e.touches[0].clientY - touchStartY;
        if (distance > 0 && window.scrollY === 0) {
            e.preventDefault();

            const pullDistance = Math.min(distance, MAX_PULL);
            const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

            indicator.style.transition = 'none';
            indicator.style.opacity = progress;
            indicator.style.transform = `translateY(${-60 + pullDistance}px)`;
            indicator.textContent = pullDistance >= PULL_THRESHOLD
                ? '↑ Release to refresh'
                : '↓ Pull to refresh';
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!pulling || refreshing) {
            pulling = false;
            return;
        }

        const distance = e.changedTouches[0].clientY - touchStartY;
        indicator.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

        if (distance >= PULL_THRESHOLD && window.scrollY === 0) {
            refreshing = true;
            indicator.textContent = '⟳ Refreshing...';
            indicator.style.transform = 'translateY(10px)';
            indicator.style.opacity = '1';

            fetchAllData().finally(() => {
                setTimeout(() => {
                    indicator.style.transform = 'translateY(-60px)';
                    indicator.style.opacity = '0';
                    indicator.textContent = '↓ Pull to refresh';
                    refreshing = false;
                }, 400);
            });
        } else {
            indicator.style.transform = 'translateY(-60px)';
            indicator.style.opacity = '0';
        }

        pulling = false;
    });
}

/* ============================================
   PORTFOLIO CARD LISTENERS
   ============================================ */
function setupPortfolioCardListeners() {
    const nseCard = document.getElementById('nseCard');
    const usCard = document.getElementById('usCard');

    if (nseCard) nseCard.addEventListener('click', () => openMarketModal('NGX'));
    if (usCard) usCard.addEventListener('click', () => openMarketModal('US'));
}

function setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
}

/* ============================================
   TAB SWITCHING
   ============================================ */
function switchTab(tabName) {
    state.currentTab = tabName;

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });

    if (tabName === 'watchlist') renderWatchlist();
    else if (tabName === 'portfolio') renderPortfolio();
    else if (tabName === 'sold') renderSold();
}

/* ============================================
   SECURITY: HTML escaping + ticker sanitizing
   ============================================ */
// ← NEW: escape any user-derived string before it goes into innerHTML as text
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ← NEW: tickers are also interpolated into onclick='...' attributes, so they're
// restricted at the source to a safe charset rather than relying on attribute
// escaping alone. Applied everywhere a ticker is read from user input.
function sanitizeTicker(raw) {
    return String(raw || '').toUpperCase().replace(/[^A-Z0-9.]/g, '');
}

/* ============================================
   API CALLS
   ============================================ */
async function fetchAllData() {
    if (!state.isOnline) return;

    showSyncIndicator(true);

    try {
        const portfolioRes = await fetch(`${API_BASE}/portfolio/${state.userId}`);
        if (portfolioRes.ok) {
            const data = await portfolioRes.json();
            state.portfolio = data.portfolio || { stocks: [] };
            state.watchlist = data.watchlist || { stocks: [] };
            state.sold = data.sold || { stocks: [] };
            state.activity = data.activity || [];
            state.settings = data.settings || { goalAmount: 1000000 };

            if (data.exchangeRate) {
                state.exchangeRate = data.exchangeRate;
                console.log(`📊 Exchange rate updated: 1 USD = ₦${data.exchangeRate.usdToNgn}`);
            }

            saveToLocalStorage();
        }
    } catch (err) {
        console.error('Error fetching portfolio:', err);
        showToast('Failed to load portfolio data', 'error');
    } finally {
        showSyncIndicator(false);
        state.initialLoadComplete = true; // ← NEW: skeleton -> real content from here on
        updateUI();
        state.lastUpdated = new Date();
        updateLastUpdatedTime();
    }
}

async function addStock(type) {
    let ticker, quantity, price, sector, notes, watchingDuration, market;

    if (type === 'portfolio') {
        ticker = sanitizeTicker(document.getElementById('addTicker').value);
        quantity = parseInt(document.getElementById('addQuantity').value);
        price = parseFloat(document.getElementById('addPrice').value);
        sector = document.getElementById('addSector').value;
        market = document.getElementById('addMarket')?.value || 'NGX';
        notes = document.getElementById('addNotes').value;

        if (!validateForm(ticker, quantity, price, sector, market)) return;

        try {
            const res = await fetch(`${API_BASE}/portfolio/${state.userId}/add-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, quantity, buyPrice: price, sector, notes, market })
            });

            if (res.ok) {
                showToast(`✓ ${ticker} added to ${market} portfolio`, 'success');
                closeAddStockModal();
                clearForm();
                fetchAllData();
            } else {
                const error = await res.json();
                showToast(error.message || error.error || 'Failed to add stock', 'error');
            }
        } catch (err) {
            console.error('Error adding stock:', err);
            showToast('Network error. Please try again.', 'error');
        }
    }
    else if (type === 'watchlist') {
        ticker = sanitizeTicker(document.getElementById('watchTicker').value);
        sector = document.getElementById('watchSector').value;
        watchingDuration = document.getElementById('watchDuration').value;
        market = document.getElementById('watchMarket')?.value || 'NGX';
        notes = document.getElementById('watchNotes').value;

        if (!ticker) {
            document.getElementById('watchTickerError').textContent = '✕ Please enter a ticker';
            return;
        }

        if (!market || !['NGX', 'US'].includes(market)) {
            document.getElementById('watchMarketError').textContent = '✕ Please select a market';
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/portfolio/${state.userId}/add-watchlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker, watchingDuration, sector: sector || null, notes, market })
            });

            if (res.ok) {
                showToast(`✓ ${ticker} added to watchlist`, 'success');
                closeAddStockModal();
                clearForm();
                fetchAllData();
            } else {
                const error = await res.json();
                showToast(error.message || error.error || 'Failed to add stock', 'error');
            }
        } catch (err) {
            console.error('Error adding to watchlist:', err);
            showToast('Network error. Please try again.', 'error');
        }
    }
}

// ← CHANGED: now confirms first, same treatment as selling a stock
function deleteFromWatchlist(ticker) {
    openConfirmModal(
        'Remove from Watchlist',
        `Remove ${escapeHtml(ticker)} from your watchlist?`,
        'You can add it back anytime.',
        () => performDeleteFromWatchlist(ticker)
    );
}

async function performDeleteFromWatchlist(ticker) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/remove-watchlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker })
        });

        if (res.ok) {
            showToast(`✓ ${ticker} removed from watchlist`, 'success');

            logLocalActivity({
                type: 'rejected',
                title: `${ticker} rejected`,
                description: 'Removed from watchlist'
            });

            closeConfirmModal();
            fetchAllData();
        }
    } catch (err) {
        console.error('Error deleting from watchlist:', err);
        showToast('Failed to remove from watchlist', 'error');
    }
}

function logLocalActivity({ type, title, description }) {
    state.localActivity.unshift({
        type,
        title,
        description,
        date: new Date().toISOString()
    });
    saveLocalActivity();
    renderActivity();
}

function saveLocalActivity() {
    localStorage.setItem('portfolioTrackerLocalActivity', JSON.stringify(state.localActivity));
}

function loadLocalActivity() {
    const saved = localStorage.getItem('portfolioTrackerLocalActivity');
    if (saved) {
        try {
            state.localActivity = JSON.parse(saved);
        } catch (err) {
            console.error('Error parsing local activity:', err);
            state.localActivity = [];
        }
    }

    const clearedAt = localStorage.getItem('portfolioTrackerActivityClearedAt');
    if (clearedAt) state.activityClearedAt = clearedAt;
}

/* ============================================
   CLEAR ALL ACTIVITY (now with Undo)
   ============================================ */
function setupClearActivityButton() {
    let btn = document.getElementById('clearActivityBtn');

    if (!btn) {
        const filterEl = document.getElementById('activityFilter');
        if (!filterEl) return;

        btn = document.createElement('button');
        btn.id = 'clearActivityBtn';
        btn.type = 'button';
        btn.className = 'btn-clear-activity';
        btn.textContent = 'Clear all';
        btn.style.marginLeft = '8px';
        filterEl.insertAdjacentElement('afterend', btn);
    }

    btn.addEventListener('click', clearAllActivity);
}

function clearAllActivity() {
    if ((getCombinedActivity() || []).length === 0) {
        showToast('No activity to clear', 'warning');
        return;
    }

    openConfirmModal(
        'Clear Activity',
        'Clear all recent activity?',
        // ← CHANGED: this is now technically undoable for a short window
        'This clears it from view on this device. You can undo right after.',
        () => {
            // ← NEW: snapshot so Undo can restore exactly what was cleared
            const previousLocalActivity = JSON.parse(JSON.stringify(state.localActivity));
            const previousClearedAt = state.activityClearedAt;
            const now = new Date().toISOString();

            state.localActivity = [];
            saveLocalActivity();

            state.activityClearedAt = now;
            localStorage.setItem('portfolioTrackerActivityClearedAt', now);

            renderActivity();
            closeConfirmModal();

            showToast('✓ Activity cleared', 'success', {
                label: 'Undo',
                onClick: () => {
                    state.localActivity = previousLocalActivity;
                    saveLocalActivity();

                    state.activityClearedAt = previousClearedAt;
                    if (previousClearedAt) {
                        localStorage.setItem('portfolioTrackerActivityClearedAt', previousClearedAt);
                    } else {
                        localStorage.removeItem('portfolioTrackerActivityClearedAt');
                    }

                    renderActivity();
                    showToast('✓ Activity restored', 'success');
                }
            }, UNDO_TOAST_DURATION);
        }
    );
}

// NOTE: this Undo is local-device-only, same as the original clear — the server's
// `activity` list isn't touched either way. A true cross-device clear/undo needs
// a backend endpoint; flagging that as a gap rather than guessing one here.

function openWatchlistToPortfolioModal(ticker) {
    openConfirmModal(
        'Convert to Portfolio',
        `Add ${escapeHtml(ticker)} to your portfolio?`,
        `Quantity and price required to proceed`,
        () => {
            const quantity = prompt(`How many shares of ${ticker}?`);
            if (!quantity || quantity <= 0) return;

            const price = prompt(`Entry price per share for ${ticker}?`);
            if (!price || price <= 0) return;

            moveWatchlistToPortfolio(ticker, parseInt(quantity), parseFloat(price));
        }
    );
}

async function moveWatchlistToPortfolio(ticker, quantity, buyPrice) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/watchlist-to-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, quantity, buyPrice })
        });

        if (res.ok) {
            showToast(`✓ ${ticker} moved to portfolio`, 'success');
            closeConfirmModal();
            fetchAllData();
        }
    } catch (err) {
        console.error('Error moving to portfolio:', err);
        showToast('Failed to move stock', 'error');
    }
}

// Left untouched per instruction — called from a separate file.
async function getStockPrice(ticker) {
    try {
        const res = await fetch(`${API_BASE}/stocks/price/${ticker}`);
        if (res.ok) {
            return await res.json();
        }
        return null;
    } catch (err) {
        console.error('Error fetching price:', err);
        return null;
    }
}

/* ============================================
   EDIT EXISTING POSITION
   ============================================ */
// ← NEW: fixes "no editing an existing position" gap.
// IMPORTANT: this calls POST /portfolio/:userId/edit-stock, which does not exist
// in your backend yet based on what's been shared — this endpoint needs to be
// added server-side (update quantity/buyPrice for a ticker+market) before this
// button will actually do anything but show an error toast.
function openEditStockModal(ticker, market) {
    const stock = state.portfolio.stocks.find(s => s.ticker === ticker && s.market === market);
    if (!stock) return;

    const qtyInput = prompt(`Edit quantity for ${ticker}`, stock.quantity);
    if (qtyInput === null) return;
    const newQuantity = parseInt(qtyInput);
    if (!newQuantity || newQuantity <= 0) {
        showToast('Invalid quantity', 'error');
        return;
    }

    const priceInput = prompt(`Edit average buy price for ${ticker}`, stock.buyPrice);
    if (priceInput === null) return;
    const newBuyPrice = parseFloat(priceInput);
    if (!newBuyPrice || newBuyPrice <= 0) {
        showToast('Invalid price', 'error');
        return;
    }

    openConfirmModal(
        'Edit Position',
        `Update ${escapeHtml(ticker)} to ${newQuantity} shares @ ${escapeHtml(String(newBuyPrice))}?`,
        'This changes your recorded quantity and average buy price.',
        () => editStockConfirmed(ticker, market, newQuantity, newBuyPrice)
    );
}

async function editStockConfirmed(ticker, market, quantity, buyPrice) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/edit-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, market, quantity, buyPrice })
        });

        if (res.ok) {
            showToast(`✓ ${ticker} updated`, 'success');
            closeConfirmModal();
            fetchAllData();
        } else {
            const error = await res.json().catch(() => ({}));
            showToast(error.message || 'Failed to update stock — backend endpoint may be missing', 'error');
        }
    } catch (err) {
        console.error('Error editing stock:', err);
        showToast('Failed to update stock', 'error');
    }
}

/* ============================================
   FORM HANDLING & VALIDATION
   ============================================ */
function validateForm(ticker, quantity, price, sector, market) {
    let isValid = true;

    document.getElementById('tickerError').textContent = '';
    document.getElementById('quantityError').textContent = '';
    document.getElementById('priceError').textContent = '';
    document.getElementById('sectorError').textContent = '';

    const marketErrorEl = document.getElementById('marketError');
    if (marketErrorEl) marketErrorEl.textContent = '';

    if (!ticker || ticker.length < 1) {
        document.getElementById('tickerError').textContent = '✕ Please enter a ticker';
        isValid = false;
    }

    if (!quantity || quantity <= 0) {
        document.getElementById('quantityError').textContent = '✕ Quantity must be positive';
        isValid = false;
    }

    if (!price || price <= 0) {
        document.getElementById('priceError').textContent = '✕ Price must be positive';
        isValid = false;
    }

    if (!sector) {
        document.getElementById('sectorError').textContent = '✕ Please select a sector';
        isValid = false;
    }

    const marketSelectEl = document.getElementById('addMarket');
    if (marketSelectEl && (!market || !['NGX', 'US'].includes(market))) {
        if (marketErrorEl) marketErrorEl.textContent = '✕ Please select a market';
        isValid = false;
    }

    return isValid;
}

function validateQuantity(e) {
    const val = parseInt(e.target.value);
    if (val <= 0) {
        e.target.classList.add('error');
        document.getElementById('quantityError').textContent = '✕ Must be positive';
    } else {
        e.target.classList.remove('error');
        document.getElementById('quantityError').textContent = '';
    }
}

function validatePrice(e) {
    const val = parseFloat(e.target.value);
    if (val <= 0) {
        e.target.classList.add('error');
        document.getElementById('priceError').textContent = '✕ Must be positive';
    } else {
        e.target.classList.remove('error');
        document.getElementById('priceError').textContent = '';
    }
}

async function handleAutocomplete(e, dropdownId, inputId, sectorId) {
    const query = e.target.value.toUpperCase();
    const dropdown = document.getElementById(dropdownId);

    if (!query) {
        dropdown.classList.remove('active');
        return;
    }

    const allStocks = [
        { ticker: 'GTCO', name: 'Guaranty Trust', sector: 'Finance' },
        { ticker: 'NSRNG', name: 'Nestle Nigeria', sector: 'Consumer' },
        { ticker: 'AAPL', name: 'Apple', sector: 'Tech' },
        { ticker: 'MSFT', name: 'Microsoft', sector: 'Tech' },
        { ticker: 'SEPLAT', name: 'Seplat', sector: 'Energy' }
    ];

    const matches = allStocks.filter(s => s.ticker.includes(query));

    if (matches.length === 0) {
        dropdown.classList.remove('active');
        return;
    }

    // Source list is static/trusted, but escaping stays for consistency.
    dropdown.innerHTML = matches.map((stock, i) => `
        <div class="autocomplete-item" onclick="selectStock('${stock.ticker}', '${stock.sector}', '${inputId}', '${sectorId}')">
            <div class="autocomplete-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${escapeHtml(stock.ticker[0])}</div>
            <div class="autocomplete-content">
                <p class="autocomplete-ticker">${escapeHtml(stock.ticker)}</p>
                <p class="autocomplete-name">${escapeHtml(stock.name)}</p>
            </div>
        </div>
    `).join('');

    dropdown.classList.add('active');
}

function selectStock(ticker, sector, inputId, sectorId) {
    document.getElementById(inputId).value = ticker;
    document.getElementById(sectorId).value = sector;
    document.getElementById(inputId).parentElement.querySelector('.autocomplete-dropdown').classList.remove('active');
}

/* ============================================
   MODAL HANDLING
   ============================================ */
function openAddStockModal() {
    document.getElementById('addStockModal').classList.add('active');
}

function closeAddStockModal() {
    document.getElementById('addStockModal').classList.remove('active');
}

function clearForm() {
    document.getElementById('addTicker').value = '';
    document.getElementById('addQuantity').value = '';
    document.getElementById('addPrice').value = '';
    document.getElementById('addSector').value = '';
    document.getElementById('addNotes').value = '';
    if (document.getElementById('addMarket')) document.getElementById('addMarket').value = '';

    document.getElementById('watchTicker').value = '';
    document.getElementById('watchDuration').value = '2d';
    document.getElementById('watchSector').value = '';
    document.getElementById('watchNotes').value = '';
    if (document.getElementById('watchMarket')) document.getElementById('watchMarket').value = '';

    document.querySelectorAll('.duration-btn').forEach((b, i) => {
        if (i === 0) b.classList.add('active');
        else b.classList.remove('active');
    });

    document.getElementById('tickerError').textContent = '';
    document.getElementById('quantityError').textContent = '';
    document.getElementById('priceError').textContent = '';
    document.getElementById('sectorError').textContent = '';
    if (document.getElementById('marketError')) document.getElementById('marketError').textContent = '';
    document.getElementById('watchTickerError').textContent = '';
    if (document.getElementById('watchMarketError')) document.getElementById('watchMarketError').textContent = '';
}

function openConfirmModal(title, message, details, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDetails').textContent = details;
    document.getElementById('confirmSubmit').onclick = callback;

    const modal = document.getElementById('confirmModal');
    modal.style.zIndex = 9999;
    modal.classList.add('active');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.style.zIndex = '';
    modal.classList.remove('active');
}

/* ============================================
   STOCK DETAIL MODAL
   ============================================ */
let selectedStockForDetail = null;

async function showStockDetailModal(ticker, market) {
    selectedStockForDetail = { ticker, market };

    const stock = state.portfolio.stocks.find(s => s.ticker === ticker && s.market === market);
    if (!stock) return;

    const currencySign = market === 'US' ? '$' : '₦';

    document.getElementById('detailStockName').textContent = ticker;
    document.getElementById('detailConfidence').textContent = stock.confidenceLevel || 0;
    document.getElementById('detailPrice').textContent = `${currencySign}${formatNumber(stock.currentPrice)}`;

    await fetchAndDisplayStockStats(ticker, market);

    document.getElementById('stockDetailModal').classList.add('active');
}

function closeStockDetailModal() {
    document.getElementById('stockDetailModal').classList.remove('active');
    selectedStockForDetail = null;
}

async function fetchAndDisplayStockStats(ticker, market) {
    try {
        const res = await fetch(`${API_BASE}/stocks/price/${ticker}`);
        if (res.ok) {
            const data = await res.json();

            const currencySign = market === 'US' ? '$' : '₦';
            const statsHtml = `
                <div class="stat-row">
                    <span class="stat-label">Price</span>
                    <span class="stat-value">${currencySign}${formatNumber(data.price)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Change</span>
                    <span class="stat-value ${data.change >= 0 ? 'positive' : 'negative'}">
                        ${data.change >= 0 ? '+' : ''}${formatNumber(data.change)}
                    </span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Change %</span>
                    <span class="stat-value ${data.changePercent >= 0 ? 'positive' : 'negative'}">
                        ${data.changePercent >= 0 ? '+' : ''}${formatNumber(data.changePercent)}%
                    </span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Source</span>
                    <span class="stat-value">${escapeHtml(data.source)}</span>
                </div>
            `;
            document.getElementById('detailStats').innerHTML = statsHtml;
        }
    } catch (err) {
        console.error('Error fetching stock stats:', err);
        document.getElementById('detailStats').innerHTML = '<p>Unable to load stats</p>';
    }
}

function confirmSellFromDetail() {
    if (!selectedStockForDetail) return;

    const stock = state.portfolio.stocks.find(s =>
        s.ticker === selectedStockForDetail.ticker &&
        s.market === selectedStockForDetail.market
    );

    if (!stock) return;

    const currencySign = selectedStockForDetail.market === 'US' ? '$' : '₦';

    const qtyInput = prompt(`How many shares of ${stock.ticker} to sell? (You own ${stock.quantity})`, stock.quantity);
    if (!qtyInput) return;

    const sellQty = parseInt(qtyInput);
    if (!sellQty || sellQty <= 0 || sellQty > stock.quantity) {
        showToast('Invalid quantity', 'error');
        return;
    }

    openConfirmModal(
        'Sell Stock',
        `Sell ${sellQty} of ${stock.quantity} shares of ${stock.ticker}?`,
        `Entry: ${currencySign}${formatNumber(stock.buyPrice)} | Current: ${currencySign}${formatNumber(stock.currentPrice)}`,
        () => {
            sellStockConfirmed(stock.ticker, sellQty);
        }
    );
}

async function sellStockConfirmed(ticker, quantity) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/sell-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, quantity })
        });

        if (res.ok) {
            showToast(`✓ ${ticker} sold successfully`, 'success');
            closeStockDetailModal();
            closeMarketModal();
            closeConfirmModal();
            fetchAllData();
        } else {
            const error = await res.json();
            showToast(error.message || 'Failed to sell stock', 'error');
        }
    } catch (err) {
        console.error('Error selling stock:', err);
        showToast('Failed to sell stock', 'error');
    }
}

/* ============================================
   LOADING SKELETONS
   ============================================ */
// ← NEW: pulsing placeholder rows shown until the first fetchAllData() resolves.
// Injects its own minimal CSS once, since these rows have no matching classes
// in style.css yet — move this into style.css if you'd rather keep it there.
function ensureSkeletonStyles() {
    if (document.getElementById('skeletonStyles')) return;
    const style = document.createElement('style');
    style.id = 'skeletonStyles';
    style.textContent = `
        .skeleton-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: 10px;
        }
        .skeleton-block {
            background: linear-gradient(90deg, #eee 25%, #f5f5f5 37%, #eee 63%);
            background-size: 400% 100%;
            animation: skeleton-pulse 1.4s ease infinite;
            border-radius: 6px;
        }
        @keyframes skeleton-pulse {
            0% { background-position: 100% 50%; }
            100% { background-position: 0 50%; }
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
    document.head.appendChild(style);
}

function skeletonRowsHtml(count) {
    let rows = '';
    for (let i = 0; i < count; i++) {
        rows += `
            <div class="skeleton-row" aria-hidden="true">
                <div class="skeleton-block" style="width:40px;height:40px;border-radius:50%;"></div>
                <div style="flex:1;">
                    <div class="skeleton-block" style="width:60%;height:12px;margin-bottom:8px;"></div>
                    <div class="skeleton-block" style="width:40%;height:10px;"></div>
                </div>
                <div class="skeleton-block" style="width:60px;height:12px;"></div>
            </div>
        `;
    }
    return rows;
}

function renderSkeletons() {
    ensureSkeletonStyles();

    const portfolioContainer = document.getElementById('portfolioList');
    const watchlistContainer = document.getElementById('watchlistList');
    const activityContainer = document.getElementById('activityList');

    if (portfolioContainer) {
        portfolioContainer.style.display = 'flex';
        portfolioContainer.innerHTML = skeletonRowsHtml(3);
    }
    if (watchlistContainer) {
        watchlistContainer.style.display = 'flex';
        watchlistContainer.innerHTML = skeletonRowsHtml(3);
    }
    if (activityContainer) {
        activityContainer.innerHTML = skeletonRowsHtml(4);
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
    renderChart();
    renderActivity();

    // Re-render whichever list tab is currently visible so skeletons clear
    // even if the user is sitting on that tab during the first load.
    if (state.currentTab === 'watchlist') renderWatchlist();
    else if (state.currentTab === 'portfolio') renderPortfolio();
    else if (state.currentTab === 'sold') renderSold();
}

function updateHeader() {
    document.getElementById('userName').textContent = state.userName;
    const avatar = state.userName[0].toUpperCase();
    document.getElementById('avatar').textContent = avatar;
}

function updateQuickStats() {
    document.getElementById('statWatching').textContent = state.watchlist.stocks?.length || 0;
    document.getElementById('statHeld').textContent = state.portfolio.stocks?.length || 0;
    document.getElementById('statSold').textContent = state.sold.stocks?.length || 0;
}

function syncCurrencyToggleUI() {
    document.querySelectorAll('.currency-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.currency === state.displayCurrency);
    });
}

function updatePortfolioCard() {
    const portfolio = state.portfolio.stocks || [];
    const rate = state.exchangeRate.usdToNgn || 1650;

    const ngxStocks = portfolio.filter(s => s.market === 'NGX');
    const usStocks = portfolio.filter(s => s.market === 'US');

    const ngxInvested = ngxStocks.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const ngxCurrent = ngxStocks.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);

    const usInvestedUSD = usStocks.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const usCurrentUSD = usStocks.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);

    const usInvestedNGN = usInvestedUSD * rate;
    const usCurrentNGN = usCurrentUSD * rate;

    const totalInvested = ngxInvested + usInvestedNGN;
    const totalCurrent = ngxCurrent + usCurrentNGN;
    const totalGain = totalCurrent - totalInvested;
    const changePercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;

    const displayInUSD = state.displayCurrency === 'USD';
    const displayTotal = displayInUSD ? totalCurrent / rate : totalCurrent;
    const totalCurrencySign = displayInUSD ? '$' : '₦';

    document.getElementById('totalPortfolio').textContent = `${totalCurrencySign}${formatNumber(displayTotal)}`;
    const sign = changePercent >= 0 ? '+' : '';
    document.getElementById('portfolioChange').textContent = `${sign}${changePercent}% today`;
    document.getElementById('portfolioChange').style.color = changePercent >= 0 ? '#90EE90' : '#FFB6C6';

    let topPerformer = null;
    let topPercent = -Infinity;

    portfolio.forEach(stock => {
        const percent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100 || 0;
        if (percent > topPercent) {
            topPercent = percent;
            topPerformer = stock;
        }
    });

    if (topPerformer) {
        const topInvested = topPerformer.quantity * topPerformer.buyPrice;
        const topCurrent = topPerformer.quantity * (topPerformer.currentPrice || topPerformer.buyPrice);
        const topGain = topCurrent - topInvested;

        const currencySign = topPerformer.market === 'US' ? '$' : '₦';

        document.getElementById('topPerformerTicker').textContent = topPerformer.ticker;
        document.getElementById('topPerformerChange').textContent = `${topPercent.toFixed(2)}%`;
        document.getElementById('topPerformerInvested').textContent = `Invested: ${currencySign}${formatNumber(topInvested)}`;
        document.getElementById('topPerformerGain').textContent = `Gain: +${currencySign}${formatNumber(topGain)}`;
    }

    const sectors = {};
    ngxStocks.forEach(stock => {
        if (!sectors[stock.sector]) sectors[stock.sector] = 0;
        sectors[stock.sector] += stock.quantity * stock.buyPrice;
    });
    usStocks.forEach(stock => {
        if (!sectors[stock.sector]) sectors[stock.sector] = 0;
        sectors[stock.sector] += stock.quantity * stock.buyPrice * rate;
    });

    const total = Object.values(sectors).reduce((a, b) => a + b, 0);
    const finance = sectors['Finance'] || 0;
    const tech = sectors['Tech'] || 0;
    const consumer = sectors['Consumer'] || 0;

    document.getElementById('financePercent').textContent = total > 0 ? Math.round((finance / total) * 100) : 0;
    document.getElementById('techPercent').textContent = total > 0 ? Math.round((tech / total) * 100) : 0;
    document.getElementById('consumerPercent').textContent = total > 0 ? Math.round((consumer / total) * 100) : 0;

    const goalAmount = state.settings.goalAmount || 1000000;
    const progressPercent = Math.min((totalCurrent / goalAmount) * 100, 100);
    document.getElementById('goalProgress').style.width = `${progressPercent}%`;
    document.getElementById('goalPercent').textContent = `${Math.round(progressPercent)}% achieved`;
}

function updateMiniCards() {
    const portfolio = state.portfolio.stocks || [];

    const ngx = portfolio.filter(s => s.market === 'NGX');
    const ngxInvested = ngx.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const ngxCurrent = ngx.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const ngxGain = ngxCurrent - ngxInvested;
    const ngxChangePercent = ngxInvested > 0 ? ((ngxGain / ngxInvested) * 100).toFixed(2) : 0;

    document.getElementById('nseValue').textContent = `₦${formatNumber(ngxCurrent)}`;
    document.getElementById('nseChange').textContent = ngxChangePercent === 0 ? '0%' : `${ngxChangePercent}%`;
    document.getElementById('nseChange').style.color = ngxChangePercent >= 0 ? '#00a651' : '#d32f2f';
    document.getElementById('nseGain').textContent = ngxGain >= 0 ? `+₦${formatNumber(ngxGain)}` : `+₦0`;
    document.getElementById('nseLoss').textContent = ngxGain < 0 ? `-₦${formatNumber(Math.abs(ngxGain))}` : `-₦0`;

    const us = portfolio.filter(s => s.market === 'US');
    const usInvested = us.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const usCurrent = us.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const usGain = usCurrent - usInvested;
    const usChangePercent = usInvested > 0 ? ((usGain / usInvested) * 100).toFixed(2) : 0;

    document.getElementById('usValue').textContent = `$${formatNumber(usCurrent)}`;
    document.getElementById('usChange').textContent = usChangePercent === 0 ? '0%' : `${usChangePercent}%`;
    document.getElementById('usChange').style.color = usChangePercent >= 0 ? '#90EE90' : '#FFB6C6';
    document.getElementById('usGain').textContent = usGain >= 0 ? `+$${formatNumber(usGain)}` : `+$0`;
    document.getElementById('usLoss').textContent = usGain < 0 ? `-$${formatNumber(Math.abs(usGain))}` : `-$0`;
}

function renderChart() {
    const chartEl = document.getElementById('performanceChart');
    const days = parseInt(state.currentPeriod);

    let bars = '';
    for (let i = 0; i < 7; i++) {
        const height = 30 + Math.random() * 70;
        bars += `<div class="chart-bar" style="height: ${height}%;"></div>`;
    }

    chartEl.innerHTML = bars;
}

function getCombinedActivity() {
    const serverActivity = state.activity || [];
    const serverKeys = new Set(serverActivity.map(a => `${a.type}:${a.title}`));

    const localOnly = (state.localActivity || []).filter(
        a => !serverKeys.has(`${a.type}:${a.title}`)
    );

    let combined = [...localOnly, ...serverActivity].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    if (state.activityClearedAt) {
        const clearedAt = new Date(state.activityClearedAt);
        combined = combined.filter(a => new Date(a.date) > clearedAt);
    }

    return combined;
}

function renderActivity() {
    const container = document.getElementById('activityList');
    const filter = document.getElementById('activityFilter').value;

    if (!state.initialLoadComplete) {
        return; // skeleton is still showing; real render happens once data lands
    }

    let activities = getCombinedActivity();

    if (filter !== 'all') {
        activities = activities.filter(a => a.type === filter);
    }

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No activities</p></div>';
        return;
    }

    container.innerHTML = activities.map(a => {
        const iconClass = {
            invested: 'invested',
            sold: 'sold',
            rejected: 'rejected',
            watching: 'watching'
        }[a.type] || 'invested';

        const icons = {
            invested: '✓',
            sold: '↑',
            rejected: '✕',
            watching: '<i class="fa-solid fa-gear"></i>'
        };

        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${icons[a.type]}</div>
                <div class="activity-content">
                    <p class="activity-title">${escapeHtml(a.title)}</p>
                    <p class="activity-desc">${escapeHtml(a.description)}</p>
                </div>
                <p class="activity-time">${formatDate(a.date)}</p>
            </div>
        `;
    }).join('');
}

function renderWatchlist() {
    const container = document.getElementById('watchlistList');
    const empty = document.getElementById('watchlistEmpty');

    if (!state.initialLoadComplete) return; // skeleton still showing

    const allStocks = state.watchlist.stocks || [];
    const stocks = applyWatchlistSearchAndSort(allStocks);

    if (allStocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    if (stocks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No matches for your search</p></div>';
        return;
    }

    container.innerHTML = stocks.map((stock, i) => {
        const priceAtAdd = stock.priceAtAdd || stock.currentPrice;
        const change = priceAtAdd
            ? ((stock.currentPrice - priceAtAdd) / priceAtAdd) * 100
            : 0;
        const changeLabel = stock.currentPrice
            ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
            : '—';

        const currencySign = stock.market === 'US' ? '$' : '₦';
        const safeTicker = escapeHtml(stock.ticker);

        return `
        <div class="stock-item">
            <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${escapeHtml(stock.ticker[0])}</div>
            <div class="stock-info">
                <p class="stock-ticker">${safeTicker}</p>
                <p class="stock-name">Watching for ${escapeHtml(stock.watchingDuration || '1w')} • ${formatDate(stock.dateAdded)}</p>
            </div>
            <div class="stock-price">
                <p class="stock-value">${stock.currentPrice ? currencySign + formatNumber(stock.currentPrice) : '—'}</p>
                <p class="stock-change ${change >= 0 ? 'positive' : 'negative'}">${changeLabel}</p>
            </div>
            <div class="stock-actions">
                <button class="btn-icon btn-add" onclick="openWatchlistToPortfolioModal('${stock.ticker}')" title="Add to Portfolio" aria-label="Add ${safeTicker} to portfolio">+</button>
                <button class="btn-icon btn-delete" onclick="deleteFromWatchlist('${stock.ticker}')" title="Delete" aria-label="Remove ${safeTicker} from watchlist">🗑️</button>
            </div>
        </div>
        `;
    }).join('');
}

function renderPortfolio() {
    const container = document.getElementById('portfolioList');
    const empty = document.getElementById('portfolioEmpty');

    if (!state.initialLoadComplete) return; // skeleton still showing

    const allStocks = state.portfolio.stocks || [];
    const stocks = applyPortfolioSearchAndSort(allStocks);

    if (allStocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    if (stocks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No matches for your search</p></div>';
        return;
    }

    container.innerHTML = stocks.map((stock, i) => {
        const gain = (stock.currentPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
        const currencySign = stock.market === 'US' ? '$' : '₦';
        const safeTicker = escapeHtml(stock.ticker);

        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${escapeHtml(stock.ticker[0])}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${safeTicker}</p>
                    <p class="stock-name">${stock.quantity} shares @ ${currencySign}${formatNumber(stock.buyPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">${currencySign}${formatNumber(stock.currentPrice * stock.quantity)}</p>
                    <p class="stock-change ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%</p>
                </div>
                <div class="stock-actions">
                    <button class="btn-icon btn-edit" onclick="openEditStockModal('${stock.ticker}', '${stock.market}')" title="Edit" aria-label="Edit ${safeTicker} position">✏️</button>
                </div>
            </div>
        `;
    }).join('');
}

/* ============================================
   MARKET MODAL (NSE / US stock list)
   ============================================ */
function openMarketModal(market) {
    const modal = document.getElementById('marketModal');
    const title = document.getElementById('marketModalTitle');
    title.textContent = market === 'NGX' ? 'NGX Portfolio' : 'US Portfolio';
    renderMarketStockList(market);
    modal.classList.add('active');
}

function closeMarketModal() {
    document.getElementById('marketModal').classList.remove('active');
}

function renderMarketStockList(market) {
    const container = document.getElementById('marketStockList');
    const empty = document.getElementById('marketStockEmpty');
    const stocks = (state.portfolio.stocks || []).filter(s => s.market === market);
    const currencySign = market === 'NGX' ? '₦' : '$';

    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    container.innerHTML = stocks.map((stock, i) => {
        const gain = (stock.currentPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = stock.buyPrice > 0
            ? ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100
            : 0;
        const confidenceBadge = stock.confidenceLevel != null
            ? `<span class="confidence-badge">${stock.confidenceLevel}</span>`
            : `<span class="confidence-badge pending">0</span>`;
        const safeTicker = escapeHtml(stock.ticker);

        return `
            <div class="stock-item" onclick="showStockDetailModal('${stock.ticker}', '${market}')">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${escapeHtml(stock.ticker[0])}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${safeTicker} ${confidenceBadge}</p>
                    <p class="stock-name">${stock.quantity} shares @ ${currencySign}${formatNumber(stock.buyPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">${currencySign}${formatNumber(stock.currentPrice * stock.quantity)}</p>
                    <p class="stock-change ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%</p>
                </div>
                <div class="stock-actions">
                    <button class="btn-icon btn-edit" onclick="event.stopPropagation(); openEditStockModal('${stock.ticker}', '${market}')" title="Edit" aria-label="Edit ${safeTicker} position">✏️</button>
                    <button class="btn-icon btn-sell" onclick="event.stopPropagation(); confirmSellFromDetail('${stock.ticker}', '${market}')" title="Sell" aria-label="Sell ${safeTicker}">📊</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSold() {
    const container = document.getElementById('soldList');
    const empty = document.getElementById('soldEmpty');
    const stocks = state.sold.stocks || [];

    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    empty.style.display = 'none';

    container.innerHTML = stocks.map((stock, i) => {
        const currencySign = stock.market === 'US' ? '$' : '₦';
        const gain = (stock.sellPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
        const safeTicker = escapeHtml(stock.ticker);

        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${escapeHtml(stock.ticker[0])}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${safeTicker}</p>
                    <p class="stock-name">${stock.quantity} shares | ${currencySign}${formatNumber(stock.buyPrice)} → ${currencySign}${formatNumber(stock.sellPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">${currencySign}${formatNumber(gain)}</p>
                    <p class="stock-change ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%</p>
                </div>
            </div>
        `;
    }).join('');
}

function filterActivity() {
    renderActivity();
}

/* ============================================
   NOTIFICATIONS & INDICATORS
   ============================================ */
// ← CHANGED: now accepts an optional `action` ({label, onClick}) and duration,
// used by the Clear Activity Undo flow. Existing calls (2-arg) work unchanged.
function showToast(message, type = 'success', action = null, duration = TOAST_DURATION) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠️'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <p class="toast-title">${escapeHtml(message)}</p>
        </div>
        ${action ? `<button class="toast-action" type="button">${escapeHtml(action.label)}</button>` : ''}
        <button class="toast-close" aria-label="Dismiss notification">✕</button>
    `;

    container.appendChild(toast);

    let dismissTimer = setTimeout(() => toast.remove(), duration);

    if (action) {
        const actionBtn = toast.querySelector('.toast-action');
        actionBtn.addEventListener('click', () => {
            clearTimeout(dismissTimer);
            toast.remove();
            action.onClick();
        });
    }

    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(dismissTimer);
        toast.remove();
    });
}

function showSyncIndicator(show) {
    const indicator = document.getElementById('syncIndicator');
    if (show) {
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
    }
}

function updateLastUpdatedTime() {
    const now = new Date();
    const minutes = Math.floor((now - state.lastUpdated) / 60000);
    let timeStr = 'now';

    if (minutes > 0) {
        if (minutes === 1) timeStr = '1 minute ago';
        else if (minutes < 60) timeStr = `${minutes} minutes ago`;
        else timeStr = `${Math.floor(minutes / 60)} hours ago`;
    }

    const el = document.getElementById('lastUpdated');
    if (el) el.textContent = timeStr;
}

/* ============================================
   SETTINGS
   ============================================ */
function saveSettings() {
    const name = document.getElementById('settingName').value;
    const goal = parseInt(document.getElementById('settingGoal').value);

    if (name) state.userName = name;
    if (goal && goal > 0) state.settings.goalAmount = goal;

    saveToLocalStorage();
    updateUI();
    showToast('✓ Settings saved', 'success');
}

/* ============================================
   LOCAL STORAGE
   ============================================ */
function saveToLocalStorage() {
    const toSave = {
        portfolio: state.portfolio,
        watchlist: state.watchlist,
        sold: state.sold,
        activity: state.activity,
        settings: state.settings,
        userName: state.userName,
        exchangeRate: state.exchangeRate,
        lastUpdated: state.lastUpdated
    };

    localStorage.setItem('portfolioTrackerState', JSON.stringify(toSave));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('portfolioTrackerState');
    if (saved) {
        const data = JSON.parse(saved);
        state.portfolio = data.portfolio || state.portfolio;
        state.watchlist = data.watchlist || state.watchlist;
        state.sold = data.sold || state.sold;
        state.activity = data.activity || state.activity;
        state.settings = data.settings || state.settings;
        state.userName = data.userName || state.userName;
        state.exchangeRate = data.exchangeRate || state.exchangeRate;
        state.lastUpdated = new Date(data.lastUpdated);
        state.initialLoadComplete = true; // ← NEW: cached data counts as loaded, skip skeleton flash
        updateUI();
    }
}

/* ============================================
   UTILITIES
   ============================================ */
function formatNumber(num) {
    if (!num) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatDate(date) {
    if (!date) return 'recently';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ============================================
   EXPORT FOR DEBUGGING
   ============================================ */
window.debugState = () => console.log(state);
window.clearAllData = () => {
    localStorage.removeItem('portfolioTrackerState');
    location.reload();
};