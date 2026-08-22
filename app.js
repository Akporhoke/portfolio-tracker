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
    currentPeriod: '7'
};

/* ============================================
   CONFIGURATION
   ============================================ */
const API_BASE = 'http://localhost:5000/api';
const REFRESH_INTERVAL = 300000; // 5 minutes
const TOAST_DURATION = 3000;
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
    fetchAllData();
    setupNetworkListeners();
    
    // Refresh every 5 minutes
    setInterval(fetchAllData, REFRESH_INTERVAL);
});

/* ============================================
   TIME & NETWORK
   ============================================ */
function initializeTime() {
    const updateTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
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
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
    // Add stock button
    document.getElementById('addBtn').addEventListener('click', openAddStockModal);
    document.getElementById('closeAddModal').addEventListener('click', closeAddStockModal);
    
    // Add stock form
    document.getElementById('addToPortfolio').addEventListener('click', () => addStock('portfolio'));
    document.getElementById('addToWatchlist').addEventListener('click', () => addStock('watchlist'));
    
    // Add stock input with autocomplete
    document.getElementById('addTicker').addEventListener('input', handleAutocomplete);
    
    // Form validation
    document.getElementById('addQuantity').addEventListener('input', validateQuantity);
    document.getElementById('addPrice').addEventListener('input', validatePrice);
    
    // Activity filter
    document.getElementById('activityFilter').addEventListener('change', filterActivity);
    
    // Chart toggles
    document.querySelectorAll('.toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentPeriod = e.target.dataset.period;
            renderChart();
        });
    });
    
    // Pull to refresh
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - touchStartY > 100 && window.scrollY === 0) {
            fetchAllData();
        }
    });
    
    // Settings
    document.getElementById('saveSetting').addEventListener('click', saveSettings);
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
    // Update state
    state.currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update button active states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });
    
    // Render tab content
    if (tabName === 'watchlist') renderWatchlist();
    else if (tabName === 'portfolio') renderPortfolio();
    else if (tabName === 'sold') renderSold();
}

/* ============================================
   API CALLS
   ============================================ */
async function fetchAllData() {
    if (!state.isOnline) return;
    
    showSyncIndicator(true);
    
    try {
        // Fetch portfolio
        const portfolioRes = await fetch(`${API_BASE}/portfolio/${state.userId}`);
        if (portfolioRes.ok) {
            const data = await portfolioRes.json();
            state.portfolio = data.portfolio || { stocks: [] };
            state.watchlist = data.watchlist || { stocks: [] };
            state.sold = data.sold || { stocks: [] };
            state.activity = data.activity || [];
            state.settings = data.settings || { goalAmount: 1000000 };
            saveToLocalStorage();
        }
    } catch (err) {
        console.error('Error fetching portfolio:', err);
        showToast('Failed to load portfolio data', 'error');
    } finally {
        showSyncIndicator(false);
        updateUI();
        state.lastUpdated = new Date();
        updateLastUpdatedTime();
    }
}

async function addStock(type) {
    const ticker = document.getElementById('addTicker').value.toUpperCase();
    const quantity = parseInt(document.getElementById('addQuantity').value);
    const price = parseFloat(document.getElementById('addPrice').value);
    const sector = document.getElementById('addSector').value;
    const notes = document.getElementById('addNotes').value;
    
    // Validate
    if (!validateForm(ticker, quantity, price, sector)) return;
    
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/${type === 'watchlist' ? 'add-watchlist' : 'add-stock'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker,
                quantity,
                buyPrice: price,
                sector,
                notes
            })
        });
        
        if (res.ok) {
            showToast(`✓ ${ticker} added to ${type}`, 'success');
            closeAddStockModal();
            clearForm();
            fetchAllData();
        } else {
            const error = await res.json();
            showToast(error.message || 'Failed to add stock', 'error');
        }
    } catch (err) {
        console.error('Error adding stock:', err);
        showToast('Network error. Please try again.', 'error');
    }
}

async function sellStock(ticker) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/sell-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker })
        });
        
        if (res.ok) {
            showToast(`✓ ${ticker} sold successfully`, 'success');
            fetchAllData();
        }
    } catch (err) {
        console.error('Error selling stock:', err);
        showToast('Failed to sell stock', 'error');
    }
}

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
   FORM HANDLING & VALIDATION
   ============================================ */
function validateForm(ticker, quantity, price, sector) {
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('tickerError').textContent = '';
    document.getElementById('quantityError').textContent = '';
    document.getElementById('priceError').textContent = '';
    document.getElementById('sectorError').textContent = '';
    
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

async function handleAutocomplete(e) {
    const query = e.target.value.toUpperCase();
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (!query) {
        dropdown.classList.remove('active');
        return;
    }
    
    // Mock suggestions (in real app, fetch from API)
    const allStocks = [
        { ticker: 'GTCO', name: 'Guaranty Trust' },
        { ticker: 'NSRNG', name: 'Nestle Nigeria' },
        { ticker: 'AAPL', name: 'Apple' },
        { ticker: 'MSFT', name: 'Microsoft' },
        { ticker: 'SEPLAT', name: 'Seplat' }
    ];
    
    const matches = allStocks.filter(s => s.ticker.includes(query));
    
    if (matches.length === 0) {
        dropdown.classList.remove('active');
        return;
    }
    
    dropdown.innerHTML = matches.map((stock, i) => `
        <div class="autocomplete-item" onclick="selectStock('${stock.ticker}')">
            <div class="autocomplete-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
            <div class="autocomplete-content">
                <p class="autocomplete-ticker">${stock.ticker}</p>
                <p class="autocomplete-name">${stock.name}</p>
            </div>
        </div>
    `).join('');
    
    dropdown.classList.add('active');
}

function selectStock(ticker) {
    document.getElementById('addTicker').value = ticker;
    document.getElementById('autocompleteDropdown').classList.remove('active');
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
}

function openConfirmModal(title, message, details, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDetails').textContent = details;
    document.getElementById('confirmSubmit').onclick = callback;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);

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

function updatePortfolioCard() {
    const portfolio = state.portfolio.stocks || [];
    
    // Calculate totals
    const totalInvested = portfolio.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const totalCurrent = portfolio.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const totalGain = totalCurrent - totalInvested;
    const changePercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;
    
    // Display
    document.getElementById('totalPortfolio').textContent = `₦${formatNumber(totalCurrent)}`;
    const sign = changePercent >= 0 ? '+' : '';
    document.getElementById('portfolioChange').textContent = `${sign}${changePercent}% today vs yesterday`;
    document.getElementById('portfolioChange').style.color = changePercent >= 0 ? '#90EE90' : '#FFB6C6';
    
    // Top performer
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
        
        document.getElementById('topPerformerTicker').textContent = topPerformer.ticker;
        document.getElementById('topPerformerChange').textContent = `${topPercent.toFixed(2)}%`;
        document.getElementById('topPerformerInvested').textContent = `Invested: ₦${formatNumber(topInvested)}`;
        document.getElementById('topPerformerGain').textContent = `Gain: +₦${formatNumber(topGain)}`;
        document.getElementById('topPerformerLoss').textContent = `Loss: -₦0`;
    }
    
    // Sector allocation
    const sectors = {};
    portfolio.forEach(stock => {
        if (!sectors[stock.sector]) sectors[stock.sector] = 0;
        sectors[stock.sector] += stock.quantity * stock.buyPrice;
    });
    
    const total = Object.values(sectors).reduce((a, b) => a + b, 0);
    const finance = sectors['Finance'] || 0;
    const tech = sectors['Tech'] || 0;
    const consumer = sectors['Consumer'] || 0;
    
    document.getElementById('financePercent').textContent = total > 0 ? Math.round((finance / total) * 100) : 0;
    document.getElementById('techPercent').textContent = total > 0 ? Math.round((tech / total) * 100) : 0;
    document.getElementById('consumerPercent').textContent = total > 0 ? Math.round((consumer / total) * 100) : 0;
    
    // Goal progress
    const goalAmount = state.settings.goalAmount || 1000000;
    const progressPercent = Math.min((totalCurrent / goalAmount) * 100, 100);
    document.getElementById('goalProgress').style.width = `${progressPercent}%`;
    document.getElementById('goalPercent').textContent = `${Math.round(progressPercent)}% achieved`;
}

function updateMiniCards() {
    const portfolio = state.portfolio.stocks || [];
    
    // NSE
    const nse = portfolio.filter(s => !s.ticker.match(/^[A-Z]+$/i) || s.buyPrice > 100);
    const nseInvested = nse.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const nseCurrent = nse.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const nseGain = nseCurrent - nseInvested;
    const nseChangePercent = nseInvested > 0 ? ((nseGain / nseInvested) * 100).toFixed(2) : 0;
    
    document.getElementById('nseValue').textContent = `₦${formatNumber(nseCurrent)}`;
    document.getElementById('nseChange').textContent = `${nseChangePercent}%`;
    document.getElementById('nseChange').style.color = nseChangePercent >= 0 ? '#00a651' : '#d32f2f';
    document.getElementById('nseGain').textContent = `+₦${formatNumber(nseGain)}`;
    document.getElementById('nseLoss').textContent = `-₦${formatNumber(Math.abs(Math.min(nseGain, 0)))}`;
    
    // US
    const us = portfolio.filter(s => s.buyPrice < 100 || s.ticker.match(/^[A-Z]{2,4}$/));
    const usInvested = us.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const usCurrent = us.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const usGain = usCurrent - usInvested;
    const usChangePercent = usInvested > 0 ? ((usGain / usInvested) * 100).toFixed(2) : 0;
    
    document.getElementById('usValue').textContent = `$${formatNumber(usCurrent)}`;
    document.getElementById('usChange').textContent = `${usChangePercent}%`;
    document.getElementById('usChange').style.color = usChangePercent >= 0 ? '#90EE90' : '#FFB6C6';
    document.getElementById('usGain').textContent = `+$${formatNumber(usGain)}`;
    document.getElementById('usLoss').textContent = `-$${formatNumber(Math.abs(Math.min(usGain, 0)))}`;
}

function renderChart() {
    const chartEl = document.getElementById('performanceChart');
    const days = parseInt(state.currentPeriod);
    
    // Mock data generation
    let bars = '';
    for (let i = 0; i < 7; i++) {
        const height = 30 + Math.random() * 70;
        bars += `<div class="chart-bar" style="height: ${height}%;"></div>`;
    }
    
    chartEl.innerHTML = bars;
}

function renderActivity() {
    const container = document.getElementById('activityList');
    const filter = document.getElementById('activityFilter').value;
    
    let activities = state.activity || [];
    
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
            watching: '👁️'
        };
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${icons[a.type]}</div>
                <div class="activity-content">
                    <p class="activity-title">${a.title}</p>
                    <p class="activity-desc">${a.description}</p>
                </div>
                <p class="activity-time">${formatDate(a.date)}</p>
            </div>
        `;
    }).join('');
}

function renderWatchlist() {
    const container = document.getElementById('watchlistList');
    const empty = document.getElementById('watchlistEmpty');
    const stocks = state.watchlist.stocks || [];
    
    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'flex';
    empty.style.display = 'none';
    
    container.innerHTML = stocks.map((stock, i) => `
        <div class="stock-item">
            <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
            <div class="stock-info">
                <p class="stock-ticker">${stock.ticker}</p>
                <p class="stock-name">Watched since ${formatDate(stock.dateAdded)}</p>
            </div>
            <div class="stock-price">
                <p class="stock-value">₦${formatNumber(stock.currentPrice)}</p>
                <p class="stock-change positive">+1.2%</p>
            </div>
        </div>
    `).join('');
}

function renderPortfolio() {
    const container = document.getElementById('portfolioList');
    const empty = document.getElementById('portfolioEmpty');
    const stocks = state.portfolio.stocks || [];
    
    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'flex';
    empty.style.display = 'none';
    
    container.innerHTML = stocks.map((stock, i) => {
        const gain = (stock.currentPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
        
        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${stock.ticker}</p>
                    <p class="stock-name">${stock.quantity} shares @ ₦${formatNumber(stock.buyPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">₦${formatNumber(stock.currentPrice * stock.quantity)}</p>
                    <p class="stock-change ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%</p>
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
        const gain = (stock.sellPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
        
        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${stock.ticker}</p>
                    <p class="stock-name">${stock.quantity} shares | ₦${formatNumber(stock.buyPrice)} → ₦${formatNumber(stock.sellPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">₦${formatNumber(gain)}</p>
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
function showToast(message, type = 'success') {
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
            <p class="toast-title">${message}</p>
        </div>
        <button class="toast-close">✕</button>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => toast.remove(), TOAST_DURATION);
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
    
    document.getElementById('lastUpdated').textContent = timeStr;
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
        state.lastUpdated = new Date(data.lastUpdated);
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
};/* ============================================
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
    currentPeriod: '7'
};

/* ============================================
   CONFIGURATION
   ============================================ */
const API_BASE = 'http://localhost:5000/api';
const REFRESH_INTERVAL = 300000; // 5 minutes
const TOAST_DURATION = 3000;
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
    fetchAllData();
    setupNetworkListeners();
    
    // Refresh every 5 minutes
    setInterval(fetchAllData, REFRESH_INTERVAL);
});

/* ============================================
   TIME & NETWORK
   ============================================ */
function initializeTime() {
    const updateTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
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
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
    // Add stock button
    document.getElementById('addBtn').addEventListener('click', openAddStockModal);
    document.getElementById('closeAddModal').addEventListener('click', closeAddStockModal);
    
    // Add stock form
    document.getElementById('addToPortfolio').addEventListener('click', () => addStock('portfolio'));
    document.getElementById('addToWatchlist').addEventListener('click', () => addStock('watchlist'));
    
    // Add stock input with autocomplete
    document.getElementById('addTicker').addEventListener('input', handleAutocomplete);
    
    // Form validation
    document.getElementById('addQuantity').addEventListener('input', validateQuantity);
    document.getElementById('addPrice').addEventListener('input', validatePrice);
    
    // Activity filter
    document.getElementById('activityFilter').addEventListener('change', filterActivity);
    
    // Chart toggles
    document.querySelectorAll('.toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentPeriod = e.target.dataset.period;
            renderChart();
        });
    });
    
    // Pull to refresh
    let touchStartY = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        if (touchEndY - touchStartY > 100 && window.scrollY === 0) {
            fetchAllData();
        }
    });
    
    // Settings
    document.getElementById('saveSetting').addEventListener('click', saveSettings);
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
    // Update state
    state.currentTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update button active states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) btn.classList.add('active');
    });
    
    // Render tab content
    if (tabName === 'watchlist') renderWatchlist();
    else if (tabName === 'portfolio') renderPortfolio();
    else if (tabName === 'sold') renderSold();
}

/* ============================================
   API CALLS
   ============================================ */
async function fetchAllData() {
    if (!state.isOnline) return;
    
    showSyncIndicator(true);
    
    try {
        // Fetch portfolio
        const portfolioRes = await fetch(`${API_BASE}/portfolio/${state.userId}`);
        if (portfolioRes.ok) {
            const data = await portfolioRes.json();
            state.portfolio = data.portfolio || { stocks: [] };
            state.watchlist = data.watchlist || { stocks: [] };
            state.sold = data.sold || { stocks: [] };
            state.activity = data.activity || [];
            state.settings = data.settings || { goalAmount: 1000000 };
            saveToLocalStorage();
        }
    } catch (err) {
        console.error('Error fetching portfolio:', err);
        showToast('Failed to load portfolio data', 'error');
    } finally {
        showSyncIndicator(false);
        updateUI();
        state.lastUpdated = new Date();
        updateLastUpdatedTime();
    }
}

async function addStock(type) {
    const ticker = document.getElementById('addTicker').value.toUpperCase();
    const quantity = parseInt(document.getElementById('addQuantity').value);
    const price = parseFloat(document.getElementById('addPrice').value);
    const sector = document.getElementById('addSector').value;
    const notes = document.getElementById('addNotes').value;
    
    // Validate
    if (!validateForm(ticker, quantity, price, sector)) return;
    
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/${type === 'watchlist' ? 'add-watchlist' : 'add-stock'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker,
                quantity,
                buyPrice: price,
                sector,
                notes
            })
        });
        
        if (res.ok) {
            showToast(`✓ ${ticker} added to ${type}`, 'success');
            closeAddStockModal();
            clearForm();
            fetchAllData();
        } else {
            const error = await res.json();
            showToast(error.message || 'Failed to add stock', 'error');
        }
    } catch (err) {
        console.error('Error adding stock:', err);
        showToast('Network error. Please try again.', 'error');
    }
}

async function sellStock(ticker) {
    try {
        const res = await fetch(`${API_BASE}/portfolio/${state.userId}/sell-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker })
        });
        
        if (res.ok) {
            showToast(`✓ ${ticker} sold successfully`, 'success');
            fetchAllData();
        }
    } catch (err) {
        console.error('Error selling stock:', err);
        showToast('Failed to sell stock', 'error');
    }
}

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
   FORM HANDLING & VALIDATION
   ============================================ */
function validateForm(ticker, quantity, price, sector) {
    let isValid = true;
    
    // Clear previous errors
    document.getElementById('tickerError').textContent = '';
    document.getElementById('quantityError').textContent = '';
    document.getElementById('priceError').textContent = '';
    document.getElementById('sectorError').textContent = '';
    
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

async function handleAutocomplete(e) {
    const query = e.target.value.toUpperCase();
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (!query) {
        dropdown.classList.remove('active');
        return;
    }
    
    // Mock suggestions (in real app, fetch from API)
    const allStocks = [
        { ticker: 'GTCO', name: 'Guaranty Trust' },
        { ticker: 'NSRNG', name: 'Nestle Nigeria' },
        { ticker: 'AAPL', name: 'Apple' },
        { ticker: 'MSFT', name: 'Microsoft' },
        { ticker: 'SEPLAT', name: 'Seplat' }
    ];
    
    const matches = allStocks.filter(s => s.ticker.includes(query));
    
    if (matches.length === 0) {
        dropdown.classList.remove('active');
        return;
    }
    
    dropdown.innerHTML = matches.map((stock, i) => `
        <div class="autocomplete-item" onclick="selectStock('${stock.ticker}')">
            <div class="autocomplete-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
            <div class="autocomplete-content">
                <p class="autocomplete-ticker">${stock.ticker}</p>
                <p class="autocomplete-name">${stock.name}</p>
            </div>
        </div>
    `).join('');
    
    dropdown.classList.add('active');
}

function selectStock(ticker) {
    document.getElementById('addTicker').value = ticker;
    document.getElementById('autocompleteDropdown').classList.remove('active');
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
}

function openConfirmModal(title, message, details, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmDetails').textContent = details;
    document.getElementById('confirmSubmit').onclick = callback;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);

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

function updatePortfolioCard() {
    const portfolio = state.portfolio.stocks || [];
    
    // Calculate totals
    const totalInvested = portfolio.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const totalCurrent = portfolio.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const totalGain = totalCurrent - totalInvested;
    const changePercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : 0;
    
    // Display
    document.getElementById('totalPortfolio').textContent = `₦${formatNumber(totalCurrent)}`;
    const sign = changePercent >= 0 ? '+' : '';
    document.getElementById('portfolioChange').textContent = `${sign}${changePercent}% today vs yesterday`;
    document.getElementById('portfolioChange').style.color = changePercent >= 0 ? '#90EE90' : '#FFB6C6';
    
    // Top performer
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
        
        document.getElementById('topPerformerTicker').textContent = topPerformer.ticker;
        document.getElementById('topPerformerChange').textContent = `${topPercent.toFixed(2)}%`;
        document.getElementById('topPerformerInvested').textContent = `Invested: ₦${formatNumber(topInvested)}`;
        document.getElementById('topPerformerGain').textContent = `Gain: +₦${formatNumber(topGain)}`;
        document.getElementById('topPerformerLoss').textContent = `Loss: -₦0`;
    }
    
    // Sector allocation
    const sectors = {};
    portfolio.forEach(stock => {
        if (!sectors[stock.sector]) sectors[stock.sector] = 0;
        sectors[stock.sector] += stock.quantity * stock.buyPrice;
    });
    
    const total = Object.values(sectors).reduce((a, b) => a + b, 0);
    const finance = sectors['Finance'] || 0;
    const tech = sectors['Tech'] || 0;
    const consumer = sectors['Consumer'] || 0;
    
    document.getElementById('financePercent').textContent = total > 0 ? Math.round((finance / total) * 100) : 0;
    document.getElementById('techPercent').textContent = total > 0 ? Math.round((tech / total) * 100) : 0;
    document.getElementById('consumerPercent').textContent = total > 0 ? Math.round((consumer / total) * 100) : 0;
    
    // Goal progress
    const goalAmount = state.settings.goalAmount || 1000000;
    const progressPercent = Math.min((totalCurrent / goalAmount) * 100, 100);
    document.getElementById('goalProgress').style.width = `${progressPercent}%`;
    document.getElementById('goalPercent').textContent = `${Math.round(progressPercent)}% achieved`;
}

function updateMiniCards() {
    const portfolio = state.portfolio.stocks || [];
    
    // NSE
    const nse = portfolio.filter(s => !s.ticker.match(/^[A-Z]+$/i) || s.buyPrice > 100);
    const nseInvested = nse.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const nseCurrent = nse.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const nseGain = nseCurrent - nseInvested;
    const nseChangePercent = nseInvested > 0 ? ((nseGain / nseInvested) * 100).toFixed(2) : 0;
    
    document.getElementById('nseValue').textContent = `₦${formatNumber(nseCurrent)}`;
    document.getElementById('nseChange').textContent = `${nseChangePercent}%`;
    document.getElementById('nseChange').style.color = nseChangePercent >= 0 ? '#00a651' : '#d32f2f';
    document.getElementById('nseGain').textContent = `+₦${formatNumber(nseGain)}`;
    document.getElementById('nseLoss').textContent = `-₦${formatNumber(Math.abs(Math.min(nseGain, 0)))}`;
    
    // US
    const us = portfolio.filter(s => s.buyPrice < 100 || s.ticker.match(/^[A-Z]{2,4}$/));
    const usInvested = us.reduce((sum, s) => sum + (s.quantity * s.buyPrice), 0);
    const usCurrent = us.reduce((sum, s) => sum + (s.quantity * (s.currentPrice || s.buyPrice)), 0);
    const usGain = usCurrent - usInvested;
    const usChangePercent = usInvested > 0 ? ((usGain / usInvested) * 100).toFixed(2) : 0;
    
    document.getElementById('usValue').textContent = `$${formatNumber(usCurrent)}`;
    document.getElementById('usChange').textContent = `${usChangePercent}%`;
    document.getElementById('usChange').style.color = usChangePercent >= 0 ? '#90EE90' : '#FFB6C6';
    document.getElementById('usGain').textContent = `+$${formatNumber(usGain)}`;
    document.getElementById('usLoss').textContent = `-$${formatNumber(Math.abs(Math.min(usGain, 0)))}`;
}

function renderChart() {
    const chartEl = document.getElementById('performanceChart');
    const days = parseInt(state.currentPeriod);
    
    // Mock data generation
    let bars = '';
    for (let i = 0; i < 7; i++) {
        const height = 30 + Math.random() * 70;
        bars += `<div class="chart-bar" style="height: ${height}%;"></div>`;
    }
    
    chartEl.innerHTML = bars;
}

function renderActivity() {
    const container = document.getElementById('activityList');
    const filter = document.getElementById('activityFilter').value;
    
    let activities = state.activity || [];
    
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
            watching: '👁️'
        };
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${icons[a.type]}</div>
                <div class="activity-content">
                    <p class="activity-title">${a.title}</p>
                    <p class="activity-desc">${a.description}</p>
                </div>
                <p class="activity-time">${formatDate(a.date)}</p>
            </div>
        `;
    }).join('');
}

function renderWatchlist() {
    const container = document.getElementById('watchlistList');
    const empty = document.getElementById('watchlistEmpty');
    const stocks = state.watchlist.stocks || [];
    
    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'flex';
    empty.style.display = 'none';
    
    container.innerHTML = stocks.map((stock, i) => `
        <div class="stock-item">
            <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
            <div class="stock-info">
                <p class="stock-ticker">${stock.ticker}</p>
                <p class="stock-name">Watched since ${formatDate(stock.dateAdded)}</p>
            </div>
            <div class="stock-price">
                <p class="stock-value">₦${formatNumber(stock.currentPrice)}</p>
                <p class="stock-change positive">+1.2%</p>
            </div>
        </div>
    `).join('');
}

function renderPortfolio() {
    const container = document.getElementById('portfolioList');
    const empty = document.getElementById('portfolioEmpty');
    const stocks = state.portfolio.stocks || [];
    
    if (stocks.length === 0) {
        container.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    container.style.display = 'flex';
    empty.style.display = 'none';
    
    container.innerHTML = stocks.map((stock, i) => {
        const gain = (stock.currentPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
        
        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${stock.ticker}</p>
                    <p class="stock-name">${stock.quantity} shares @ ₦${formatNumber(stock.buyPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">₦${formatNumber(stock.currentPrice * stock.quantity)}</p>
                    <p class="stock-change ${gain >= 0 ? 'positive' : 'negative'}">${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%</p>
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
        const gain = (stock.sellPrice - stock.buyPrice) * stock.quantity;
        const gainPercent = ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
        
        return `
            <div class="stock-item">
                <div class="stock-avatar" style="background: ${API_COLORS[i % API_COLORS.length]}">${stock.ticker[0]}</div>
                <div class="stock-info">
                    <p class="stock-ticker">${stock.ticker}</p>
                    <p class="stock-name">${stock.quantity} shares | ₦${formatNumber(stock.buyPrice)} → ₦${formatNumber(stock.sellPrice)}</p>
                </div>
                <div class="stock-price">
                    <p class="stock-value">₦${formatNumber(gain)}</p>
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
function showToast(message, type = 'success') {
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
            <p class="toast-title">${message}</p>
        </div>
        <button class="toast-close">✕</button>
    `;
    
    container.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    setTimeout(() => toast.remove(), TOAST_DURATION);
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
    
    document.getElementById('lastUpdated').textContent = timeStr;
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
        state.lastUpdated = new Date(data.lastUpdated);
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