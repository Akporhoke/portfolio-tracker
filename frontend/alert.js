/* ============================================
   PRICE ALERTS (bell, notifications, my alerts, settings)
   ============================================

   Self-contained: it builds its own bell and panel, so the existing pages
   need only one <script> line. Load it AFTER app.js, because it uses
   API_BASE, state and showToast from there.

   It also needs frontend/sw.js (the service worker) for push notifications.

   Opening it from code:
     openAlertsModal()                    notifications tab
     openAlertForStock('GTCO', 'NGX')     new-alert form, filled in
*/

(function () {
    'use strict';

    const POLL_MS = 60 * 1000;

    let unreadCount = 0;
    let pollStarted = false;
    let firstPollDone = false;
    let activeTab = 'notifications';

    // Live price note under the new-alert form
    let previewTimer = null;
    let previewSeq = 0;

    // Waiting for the user to press Start in Telegram
    let telegramWait = null;

    // This device's push registration is re-sent to the server once per visit
    let pushHealed = false;

    let bellBtn = null;
    let badgeEl = null;
    let modalEl = null;


    /* ------------------------------------------
       SMALL HELPERS
       ------------------------------------------ */

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function $(id) {
        return document.getElementById(id);
    }

    function currencySign(market) {
        return market === 'US' ? '$' : '₦';
    }

    function money(value, market) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return '—';
        }

        return currencySign(market) +
            number.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }

    function when(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function isLoggedIn() {
        try {
            return Boolean(
                window.GazeAuth &&
                typeof window.GazeAuth.getUser === 'function' &&
                window.GazeAuth.getUser()
            );
        } catch (error) {
            return false;
        }
    }

    function toast(message, type, action) {
        if (typeof showToast === 'function') {
            showToast(message, type || 'success', action || null);
        }
    }

    async function apiCall(path, options) {
        const settings = options || {};

        const response = await fetch(
            `${API_BASE}/portfolio/${encodeURIComponent(state.userId)}${path}`,
            {
                method: settings.method || 'GET',

                headers: settings.body
                    ? { 'Content-Type': 'application/json' }
                    : undefined,

                body: settings.body
                    ? JSON.stringify(settings.body)
                    : undefined
            }
        );

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const failure = new Error(
                (data && (data.error || data.message)) ||
                `Request failed (${response.status})`
            );

            failure.status = response.status;

            throw failure;
        }

        return data || {};
    }


    /* ------------------------------------------
       STYLES
       ------------------------------------------ */

    function injectStyles() {
        if ($('alertsStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'alertsStyles';

        style.textContent = `
            .alerts-bell { position: relative; }

            .alerts-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
                border-radius: 999px;
                background: #dc2626;
                color: #fff;
                font-size: 10px;
                font-weight: 700;
                line-height: 16px;
                text-align: center;
                display: none;
            }

            .alerts-badge.show { display: block; }

            .alerts-tabs {
                display: flex;
                gap: 6px;
                margin-bottom: 12px;
            }

            .alerts-tab-btn {
                flex: 1;
                padding: 8px 6px;
                border: 0;
                border-radius: 8px;
                background: rgba(128, 128, 128, 0.15);
                color: inherit;
                font: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .alerts-tab-btn.active {
                background: #6366f1;
                color: #fff;
            }

            .alerts-tab-icon { flex: 0 0 44px; }

            .alerts-panel { display: none; }
            .alerts-panel.active { display: block; }

            .alerts-item {
                padding: 10px 12px;
                border-radius: 10px;
                background: rgba(128, 128, 128, 0.1);
                margin-bottom: 8px;
            }

            .alerts-item.unread { border-left: 3px solid #6366f1; }

            .alerts-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            }

            .alerts-item-title {
                font-weight: 600;
                font-size: 14px;
                margin: 0 0 2px;
            }

            .alerts-item-sub {
                font-size: 12px;
                color: #999;
                margin: 0;
            }

            .alerts-status {
                font-size: 11px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 999px;
                white-space: nowrap;
            }

            .alerts-status.active {
                background: rgba(16, 185, 129, 0.15);
                color: #059669;
            }

            .alerts-status.paused {
                background: rgba(128, 128, 128, 0.2);
                color: #888;
            }

            .alerts-status.triggered {
                background: rgba(99, 102, 241, 0.15);
                color: #6366f1;
            }

            .alerts-actions {
                display: flex;
                gap: 14px;
                margin-top: 8px;
            }

            .alerts-link-btn {
                border: 0;
                background: none;
                color: #6366f1;
                font: inherit;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                padding: 0;
            }

            .alerts-link-btn.danger { color: #dc2626; }

            .alerts-empty {
                text-align: center;
                color: #999;
                font-size: 13px;
                padding: 24px 0;
            }

            .alerts-hint {
                font-size: 11px;
                color: #999;
                margin: 8px 0 0;
            }

            .alerts-check {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
            }

            .alerts-note {
                font-size: 12px;
                color: #999;
                margin: -4px 0 12px;
            }

            .alerts-note:empty { display: none; }
            .alerts-note.warn { color: #d97706; }

            .alerts-section {
                padding: 12px;
                border-radius: 10px;
                background: rgba(128, 128, 128, 0.1);
                margin-bottom: 10px;
            }

            .alerts-section-title {
                font-weight: 600;
                font-size: 14px;
                margin: 0 0 4px;
            }

            .alerts-btn-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            .alerts-btn {
                padding: 8px 12px;
                border: 1px solid rgba(128, 128, 128, 0.35);
                border-radius: 8px;
                background: transparent;
                color: inherit;
                font: inherit;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .alerts-btn.primary {
                background: #6366f1;
                border-color: #6366f1;
                color: #fff;
            }

            .alerts-btn.danger { color: #dc2626; }

            .alerts-btn:disabled {
                opacity: 0.6;
                cursor: default;
            }
        `;

        document.head.appendChild(style);
    }


    /* ------------------------------------------
       BELL
       ------------------------------------------ */

    function setBadge(count) {
        unreadCount = count;

        if (!badgeEl) {
            return;
        }

        badgeEl.textContent = count > 9 ? '9+' : String(count);
        badgeEl.classList.toggle('show', count > 0);
    }

    function buildBell() {
        const host = document.querySelector('.header-actions');

        if (!host || $('alertsBellBtn')) {
            return;
        }

        bellBtn = document.createElement('button');
        bellBtn.id = 'alertsBellBtn';
        bellBtn.type = 'button';
        bellBtn.className = 'tab-btn header-icon-btn alerts-bell';
        bellBtn.setAttribute('aria-label', 'Price alerts');

        bellBtn.innerHTML =
            '<i class="fa-regular fa-bell"></i>' +
            '<span class="alerts-badge" id="alertsBadge"></span>';

        bellBtn.addEventListener('click', () => openAlertsModal());

        host.insertBefore(bellBtn, host.firstChild);

        badgeEl = $('alertsBadge');
    }


    /* ------------------------------------------
       MODAL
       ------------------------------------------ */

    function buildModal() {
        if ($('alertsModal')) {
            modalEl = $('alertsModal');
            return;
        }

        modalEl = document.createElement('div');
        modalEl.className = 'modal';
        modalEl.id = 'alertsModal';

        modalEl.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Alerts</h2>
                    <button type="button" class="close-modal" id="alertsClose" aria-label="Close alerts">✕</button>
                </div>

                <div class="modal-body">
                    <div class="alerts-tabs">
                        <button type="button" class="alerts-tab-btn active" data-alerts-tab="notifications">Notifications</button>
                        <button type="button" class="alerts-tab-btn" data-alerts-tab="alerts">My alerts</button>
                        <button type="button" class="alerts-tab-btn" data-alerts-tab="new">New</button>
                        <button type="button" class="alerts-tab-btn alerts-tab-icon" data-alerts-tab="settings" aria-label="Notification settings"><i class="fa-solid fa-gear"></i></button>
                    </div>

                    <div class="alerts-panel active" id="alertsPanelNotifications">
                        <div id="alertsNotifList"></div>
                    </div>

                    <div class="alerts-panel" id="alertsPanelAlerts">
                        <div id="alertsList"></div>
                        <p class="alerts-hint">Prices are checked about every 5 minutes while a market is open. A price that crosses your line and comes back in between checks is not seen.</p>
                    </div>

                    <div class="alerts-panel" id="alertsPanelNew">
                        <div class="form-group">
                            <label for="alertsTicker">Stock ticker</label>
                            <input type="text" id="alertsTicker" list="alertsTickerList" placeholder="e.g., GTCO, AAPL" autocomplete="off" maxlength="12">
                            <datalist id="alertsTickerList"></datalist>
                        </div>

                        <div class="form-group">
                            <label for="alertsMarket">Market</label>
                            <select id="alertsMarket">
                                <option value="NGX">Nigerian Stock Exchange (NGX)</option>
                                <option value="US">US Stock Market</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="alertsDirection">Tell me when the price</label>
                            <select id="alertsDirection">
                                <option value="above">Rises above</option>
                                <option value="below">Falls below</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="alertsThreshold">Price</label>
                            <input type="number" id="alertsThreshold" placeholder="0.00" step="0.01" min="0" inputmode="decimal">
                        </div>

                        <p class="alerts-note" id="alertsPriceNote"></p>

                        <div class="form-group">
                            <label class="alerts-check">
                                <input type="checkbox" id="alertsRepeat">
                                <span>Alert me again later (after a 60 minute pause)</span>
                            </label>
                        </div>

                        <p class="error" id="alertsError"></p>

                        <button type="button" class="btn-primary btn-full" id="alertsCreate">Create alert</button>

                        <p class="alerts-hint">An alert fires when the price crosses your line. If the price is already past it, the alert waits for the price to cross again.</p>
                    </div>

                    <div class="alerts-panel" id="alertsPanelSettings">
                        <div id="alertsSettings"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalEl);

        $('alertsClose').addEventListener('click', closeAlertsModal);

        modalEl.addEventListener('click', event => {
            // Click on the dark area outside the box closes it
            if (event.target === modalEl) {
                closeAlertsModal();
            }
        });

        modalEl
            .querySelectorAll('[data-alerts-tab]')
            .forEach(button => {
                button.addEventListener('click', () => {
                    setTab(button.dataset.alertsTab);
                });
            });

        $('alertsCreate').addEventListener('click', createAlert);

        $('alertsTicker').addEventListener('input', guessMarket);
        $('alertsTicker').addEventListener('change', guessMarket);

        // Any change in the form refreshes the "price now" note
        $('alertsTicker').addEventListener('input', schedulePriceNote);
        $('alertsThreshold').addEventListener('input', schedulePriceNote);
        $('alertsMarket').addEventListener('change', schedulePriceNote);
        $('alertsDirection').addEventListener('change', schedulePriceNote);

        // Buttons inside the alerts list
        $('alertsList').addEventListener('click', onAlertListClick);

        // Buttons inside the settings tab
        $('alertsSettings').addEventListener('click', onSettingsClick);
    }

    function isModalOpen() {
        return Boolean(modalEl && modalEl.classList.contains('active'));
    }

    function setTab(name) {
        activeTab = name;

        modalEl
            .querySelectorAll('[data-alerts-tab]')
            .forEach(button => {
                button.classList.toggle(
                    'active',
                    button.dataset.alertsTab === name
                );
            });

        $('alertsPanelNotifications')
            .classList.toggle('active', name === 'notifications');

        $('alertsPanelAlerts')
            .classList.toggle('active', name === 'alerts');

        $('alertsPanelNew')
            .classList.toggle('active', name === 'new');

        $('alertsPanelSettings')
            .classList.toggle('active', name === 'settings');

        if (name === 'notifications') {
            loadNotifications();
        } else if (name === 'alerts') {
            loadAlerts();
        } else if (name === 'settings') {
            loadSettings();
        } else {
            fillTickerSuggestions();
            $('alertsError').textContent = '';
            schedulePriceNote();
        }
    }

    function openAlertsModal(tab) {
        if (!isLoggedIn()) {
            toast('Log in to use price alerts', 'warning');
            return;
        }

        if (!modalEl) {
            return;
        }

        modalEl.classList.add('active');

        setTab(tab || 'notifications');
    }

    function closeAlertsModal() {
        stopTelegramWait();

        if (modalEl) {
            modalEl.classList.remove('active');
        }
    }

    // Opens the new-alert form for one stock (used by other screens)
    function openAlertForStock(ticker, market) {
        openAlertsModal('new');

        if (!modalEl || !modalEl.classList.contains('active')) {
            return;
        }

        $('alertsTicker').value = String(ticker || '').toUpperCase();

        if (market === 'NGX' || market === 'US') {
            $('alertsMarket').value = market;
        }

        schedulePriceNote();
    }


    /* ------------------------------------------
       NEW ALERT FORM
       ------------------------------------------ */

    function trackedStocks() {
        const list = [];

        const add = stocks => {
            (stocks || []).forEach(stock => {
                if (stock && stock.ticker) {
                    list.push({
                        ticker: String(stock.ticker).toUpperCase(),
                        market: stock.market === 'US' ? 'US' : 'NGX'
                    });
                }
            });
        };

        add(state.portfolio && state.portfolio.stocks);
        add(state.watchlist && state.watchlist.stocks);

        return list;
    }

    function fillTickerSuggestions() {
        const datalist = $('alertsTickerList');

        if (!datalist) {
            return;
        }

        const seen = new Set();

        datalist.innerHTML =
            trackedStocks()
                .filter(stock => {
                    if (seen.has(stock.ticker)) {
                        return false;
                    }

                    seen.add(stock.ticker);

                    return true;
                })
                .map(stock =>
                    `<option value="${esc(stock.ticker)}"></option>`
                )
                .join('');
    }

    // Typing a ticker you already hold or watch sets its market
    function guessMarket() {
        const value =
            $('alertsTicker').value.trim().toUpperCase();

        const match =
            trackedStocks().find(stock => stock.ticker === value);

        if (match) {
            $('alertsMarket').value = match.market;
        }
    }

    // Shows the current price under the form, and warns when the price is
    // already past the line (the alert would then wait for a new crossing)
    function schedulePriceNote() {
        clearTimeout(previewTimer);

        previewTimer = setTimeout(updatePriceNote, 400);
    }

    async function updatePriceNote() {
        const note = $('alertsPriceNote');

        if (!note) {
            return;
        }

        const ticker =
            $('alertsTicker').value
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9.-]/g, '');

        const threshold = parseFloat($('alertsThreshold').value);

        note.textContent = '';
        note.className = 'alerts-note';

        if (
            !ticker ||
            !Number.isFinite(threshold) ||
            threshold <= 0 ||
            !isLoggedIn()
        ) {
            return;
        }

        // Only the newest check may write to the note
        const seq = ++previewSeq;

        try {
            const market = $('alertsMarket').value;

            const params = new URLSearchParams({
                ticker,
                market,
                direction: $('alertsDirection').value,
                threshold: String(threshold)
            });

            const data = await apiCall(`/alerts/preview?${params.toString()}`);

            if (seq !== previewSeq) {
                return;
            }

            if (data.status === 'already_beyond') {
                note.textContent = data.message || '';
                note.className = 'alerts-note warn';

            } else if (
                data.status === 'ok' &&
                data.currentPrice !== null &&
                data.currentPrice !== undefined
            ) {
                note.textContent =
                    `${ticker} is at ${money(data.currentPrice, market)} now.`;

            } else if (data.message) {
                note.textContent = data.message;
            }

        } catch (error) {
            // Quiet on purpose: the note is only a helper
        }
    }

    async function createAlert() {
        const errorEl = $('alertsError');
        const button = $('alertsCreate');

        errorEl.textContent = '';

        const tickerValue =
            $('alertsTicker').value
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9.-]/g, '');

        const threshold = parseFloat($('alertsThreshold').value);

        if (!tickerValue) {
            errorEl.textContent = '✕ Please enter a ticker';
            return;
        }

        if (!Number.isFinite(threshold) || threshold <= 0) {
            errorEl.textContent = '✕ Price must be greater than 0';
            return;
        }

        button.disabled = true;

        try {
            const data = await apiCall('/alerts', {
                method: 'POST',

                body: {
                    ticker: tickerValue,
                    market: $('alertsMarket').value,
                    direction: $('alertsDirection').value,
                    threshold,
                    repeat: $('alertsRepeat').checked
                }
            });

            const alert = data.alert || {};

            toast(
                `✓ Alert set: ${alert.ticker} ` +
                `${alert.direction} ${money(alert.threshold, alert.market)}`
            );

            if (data.alreadyBeyond) {
                toast(
                    data.warning ||
                    'The price is already past that line. ' +
                    'The alert waits for it to cross again.',
                    'warning'
                );
            }

            $('alertsTicker').value = '';
            $('alertsThreshold').value = '';
            $('alertsRepeat').checked = false;
            $('alertsPriceNote').textContent = '';

            setTab('alerts');

        } catch (error) {
            errorEl.textContent = `✕ ${error.message}`;

        } finally {
            button.disabled = false;
        }
    }


    /* ------------------------------------------
       NOTIFICATIONS
       ------------------------------------------ */

    async function loadNotifications() {
        const box = $('alertsNotifList');

        box.innerHTML = '<div class="alerts-empty">Loading...</div>';

        try {
            const data = await apiCall('/notifications?limit=50');

            const list = data.notifications || [];

            if (list.length === 0) {
                box.innerHTML =
                    '<div class="alerts-empty">No notifications yet.<br>' +
                    'Create an alert and you will see it here when it fires.</div>';
            } else {
                box.innerHTML = list.map(item => `
                    <div class="alerts-item ${item.read ? '' : 'unread'}">
                        <p class="alerts-item-title">${esc(item.title)}</p>
                        <p class="alerts-item-sub">${esc(item.message)}</p>
                        <p class="alerts-item-sub">Price seen ${esc(when(item.observedAt || item.createdAt))}</p>
                    </div>
                `).join('');
            }

            // Showing them counts as reading them
            if ((data.unreadCount || 0) > 0) {
                await apiCall('/notifications/read', {
                    method: 'POST',
                    body: { all: true }
                });
            }

            setBadge(0);

        } catch (error) {
            box.innerHTML =
                `<div class="alerts-empty">${esc(error.message)}</div>`;
        }
    }

    async function refreshUnread() {
        if (document.hidden || !isLoggedIn()) {
            return;
        }

        try {
            const data = await apiCall('/notifications?limit=1');

            const count = Number(data.unreadCount) || 0;

            // Tell the user about NEW notifications (not the old ones
            // that were already waiting when the app opened)
            if (
                firstPollDone &&
                count > unreadCount &&
                !isModalOpen()
            ) {
                toast(
                    '🔔 A price alert fired',
                    'success',
                    {
                        label: 'View',
                        onClick: () => openAlertsModal('notifications')
                    }
                );
            }

            firstPollDone = true;

            setBadge(count);

            // Logged in and the server answered: keep this device's push
            // registration in sync (once per visit)
            healPush();

        } catch (error) {
            // Quiet on purpose: the app keeps working without the bell
        }
    }

    function startPolling() {
        if (pollStarted) {
            return;
        }

        pollStarted = true;

        refreshUnread();

        setInterval(refreshUnread, POLL_MS);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                refreshUnread();
            }
        });
    }


    /* ------------------------------------------
       MY ALERTS
       ------------------------------------------ */

    async function loadAlerts() {
        const box = $('alertsList');

        box.innerHTML = '<div class="alerts-empty">Loading...</div>';

        try {
            const data = await apiCall('/alerts');

            const list = data.alerts || [];

            if (list.length === 0) {
                box.innerHTML =
                    '<div class="alerts-empty">You have no alerts yet.<br>' +
                    'Use the New tab to create one.</div>';

                return;
            }

            box.innerHTML = list.map(alertRow).join('');

        } catch (error) {
            box.innerHTML =
                `<div class="alerts-empty">${esc(error.message)}</div>`;
        }
    }

    function alertRow(alert) {
        const direction =
            alert.direction === 'above' ? 'above' : 'below';

        const statusLabel = {
            active: 'Active',
            paused: 'Paused',
            triggered: 'Triggered'
        }[alert.status] || alert.status;

        let detail = '';

        if (alert.status === 'triggered' && alert.triggeredPrice !== null) {
            detail =
                `Fired at ${money(alert.triggeredPrice, alert.market)}` +
                (alert.lastTriggeredAt
                    ? ` on ${when(alert.lastTriggeredAt)}`
                    : '');

        } else if (alert.lastObservedPrice !== null) {
            detail =
                `Last price seen: ${money(alert.lastObservedPrice, alert.market)}`;

            if (alert.triggerCount > 0) {
                detail += ` · fired ${alert.triggerCount}x`;
            }

        } else {
            detail = 'Waiting for the first price';
        }

        let actions = '';

        if (alert.status === 'active') {
            actions +=
                `<button type="button" class="alerts-link-btn" data-action="pause" data-id="${esc(alert.id)}">Pause</button>`;
        } else if (alert.status === 'paused') {
            actions +=
                `<button type="button" class="alerts-link-btn" data-action="resume" data-id="${esc(alert.id)}">Resume</button>`;
        } else {
            actions +=
                `<button type="button" class="alerts-link-btn" data-action="resume" data-id="${esc(alert.id)}">Set again</button>`;
        }

        actions +=
            `<button type="button" class="alerts-link-btn danger" data-action="delete" data-id="${esc(alert.id)}">Delete</button>`;

        return `
            <div class="alerts-item">
                <div class="alerts-row">
                    <p class="alerts-item-title">
                        ${esc(alert.ticker)} ${direction} ${esc(money(alert.threshold, alert.market))}
                        ${alert.repeat ? ' · repeating' : ''}
                    </p>
                    <span class="alerts-status ${esc(alert.status)}">${esc(statusLabel)}</span>
                </div>
                <p class="alerts-item-sub">${esc(detail)}</p>
                <div class="alerts-actions">${actions}</div>
            </div>
        `;
    }

    async function onAlertListClick(event) {
        const button = event.target.closest('[data-action]');

        if (!button) {
            return;
        }

        const id = button.dataset.id;
        const action = button.dataset.action;

        button.disabled = true;

        try {
            if (action === 'delete') {
                await apiCall(`/alerts/${encodeURIComponent(id)}/delete`, {
                    method: 'POST',
                    body: {}
                });

                toast('✓ Alert deleted');

            } else {
                await apiCall(`/alerts/${encodeURIComponent(id)}/status`, {
                    method: 'POST',

                    body: {
                        status: action === 'pause' ? 'paused' : 'active'
                    }
                });

                toast(
                    action === 'pause'
                        ? '✓ Alert paused'
                        : '✓ Alert is active'
                );
            }

            loadAlerts();

        } catch (error) {
            toast(error.message, 'error');
            button.disabled = false;
        }
    }


    /* ------------------------------------------
       PUSH NOTIFICATIONS (this phone / browser)
       ------------------------------------------ */

    // iPhone Safari only has these when Gaze was added to the Home Screen
    function pushSupported() {
        return (
            'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window
        );
    }

    // The server's public key arrives as base64url text; the browser
    // wants it as raw bytes
    function urlBase64ToUint8Array(base64String) {
        const padding =
            '='.repeat((4 - (base64String.length % 4)) % 4);

        const base64 =
            (base64String + padding)
                .replace(/-/g, '+')
                .replace(/_/g, '/');

        const raw = atob(base64);

        const bytes = new Uint8Array(raw.length);

        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }

        return bytes;
    }

    // Was this device registered with a different server key? (happens if
    // the VAPID keys are ever replaced)
    function sameKey(subscription, key) {
        const current =
            subscription.options &&
            subscription.options.applicationServerKey;

        if (!current) {
            return true;
        }

        const existing = new Uint8Array(current);

        if (existing.length !== key.length) {
            return false;
        }

        for (let i = 0; i < existing.length; i++) {
            if (existing[i] !== key[i]) {
                return false;
            }
        }

        return true;
    }

    async function currentPushSubscription() {
        if (!pushSupported()) {
            return null;
        }

        const registration =
            await navigator.serviceWorker.getRegistration();

        return registration
            ? registration.pushManager.getSubscription()
            : null;
    }

    async function localPushState() {
        if (!pushSupported()) {
            return {
                supported: false,
                permission: 'unsupported',
                subscribed: false
            };
        }

        let subscribed = false;

        try {
            subscribed = Boolean(await currentPushSubscription());
        } catch (error) {
            subscribed = false;
        }

        return {
            supported: true,
            permission: Notification.permission,
            subscribed
        };
    }

    async function enablePush() {
        if (!pushSupported()) {
            throw new Error(
                'This browser cannot do push. On iPhone, add Gaze to your Home Screen first, then open it from there.'
            );
        }

        // Asked FIRST, straight from the tap: Safari only allows the
        // permission question as a direct result of a tap
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            throw new Error(
                'Notifications were not allowed. Allow them for this site in your browser settings.'
            );
        }

        const info = await apiCall('/push');

        if (!info.configured || !info.publicKey) {
            throw new Error('Push is not set up on this server yet.');
        }

        const key = urlBase64ToUint8Array(info.publicKey);

        const registration =
            await navigator.serviceWorker.register('/sw.js');

        await navigator.serviceWorker.ready;

        let subscription =
            await registration.pushManager.getSubscription();

        if (subscription && !sameKey(subscription, key)) {
            await subscription.unsubscribe();
            subscription = null;
        }

        if (!subscription) {
            subscription =
                await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: key
                });
        }

        await apiCall('/push/subscribe', {
            method: 'POST',
            body: { subscription: subscription.toJSON() }
        });

        toast('✓ Phone alerts are on');
    }

    async function disablePush() {
        const subscription = await currentPushSubscription();

        if (subscription) {
            try {
                await apiCall('/push/unsubscribe', {
                    method: 'POST',
                    body: { endpoint: subscription.endpoint }
                });
            } catch (error) {
                // Still turn it off on this device
            }

            await subscription.unsubscribe();
        }

        toast('✓ Phone alerts are off on this device');
    }

    async function testPush() {
        const data = await apiCall('/push/test', {
            method: 'POST',
            body: {}
        });

        if (!data.delivered) {
            throw new Error(
                'Nothing was delivered. Turn phone alerts off and on again.'
            );
        }

        toast('✓ Test sent. Look for the notification.');
    }

    // A device that already allowed push re-sends its registration once per
    // visit, so the server always knows it (and it follows the current user)
    async function healPush() {
        if (
            pushHealed ||
            !pushSupported() ||
            Notification.permission !== 'granted'
        ) {
            return;
        }

        pushHealed = true;

        try {
            const subscription = await currentPushSubscription();

            if (subscription) {
                await apiCall('/push/subscribe', {
                    method: 'POST',
                    body: { subscription: subscription.toJSON() }
                });
            }
        } catch (error) {
            // Quiet on purpose
        }
    }


    /* ------------------------------------------
       TELEGRAM
       ------------------------------------------ */

    function stopTelegramWait() {
        if (telegramWait) {
            clearInterval(telegramWait);
            telegramWait = null;
        }
    }

    // After the user opens the Telegram link, check every few seconds
    // (for up to 2 minutes) whether they pressed Start
    function waitForTelegram() {
        stopTelegramWait();

        const started = Date.now();

        telegramWait = setInterval(async () => {
            if (Date.now() - started > 2 * 60 * 1000) {
                stopTelegramWait();
                return;
            }

            try {
                const data = await apiCall('/telegram');

                if (data.linked) {
                    stopTelegramWait();

                    toast('✓ Telegram connected');

                    if (activeTab === 'settings' && isModalOpen()) {
                        loadSettings();
                    }
                }
            } catch (error) {
                // Try again on the next tick
            }
        }, 4000);
    }

    async function connectTelegram() {
        const data = await apiCall('/telegram/link', {
            method: 'POST',
            body: {}
        });

        const hint = $('alertsTgHint');

        if (hint) {
            hint.innerHTML =
                'Press <b>Start</b> in Telegram, then come back here. ' +
                `If it did not open, <a href="${esc(data.url)}" target="_blank" rel="noopener">tap here</a>.`;
        }

        window.open(data.url, '_blank', 'noopener');

        waitForTelegram();
    }

    async function testTelegram() {
        await apiCall('/telegram/test', {
            method: 'POST',
            body: {}
        });

        toast('✓ Test sent. Check Telegram.');
    }

    async function disconnectTelegram() {
        await apiCall('/telegram/unlink', {
            method: 'POST',
            body: {}
        });

        toast('✓ Telegram disconnected');
    }


    /* ------------------------------------------
       SETTINGS TAB
       ------------------------------------------ */

    function pushSection(info, local) {
        let status = '';
        let buttons = '';

        if (info.error) {
            status = esc(info.error);

        } else if (!info.configured) {
            status = 'Not set up on this server yet.';

        } else if (!local.supported) {
            status =
                'This browser cannot do push. On iPhone, add Gaze to your Home Screen first, then open it from there.';

        } else if (local.permission === 'denied') {
            status =
                'Blocked. Allow notifications for this site in your browser settings, then come back.';

        } else if (local.subscribed) {
            status = 'On for this device.';

            buttons =
                '<button type="button" class="alerts-btn" data-setting="push-test">Send test</button>' +
                '<button type="button" class="alerts-btn danger" data-setting="push-off">Turn off</button>';

        } else {
            status = 'Off on this device.';

            buttons =
                '<button type="button" class="alerts-btn primary" data-setting="push-on">Turn on</button>';
        }

        return `
            <div class="alerts-section">
                <p class="alerts-section-title">Phone and browser alerts</p>
                <p class="alerts-item-sub">${status}</p>
                <div class="alerts-btn-row">${buttons}</div>
                <p class="alerts-hint">Pops up even when Gaze is closed. If alerts arrive late on your phone, turn off battery saving for your browser.</p>
            </div>
        `;
    }

    function telegramSection(info) {
        let status = '';
        let buttons = '';

        if (info.error) {
            status = esc(info.error);

        } else if (!info.configured) {
            status = 'Not set up on this server yet.';

        } else if (info.linked) {
            status = 'Connected. Alerts also arrive in Telegram.';

            buttons =
                '<button type="button" class="alerts-btn" data-setting="tg-test">Send test</button>' +
                '<button type="button" class="alerts-btn danger" data-setting="tg-off">Disconnect</button>';

        } else {
            status = 'Not connected.';

            buttons =
                '<button type="button" class="alerts-btn primary" data-setting="tg-connect">Connect Telegram</button>';
        }

        return `
            <div class="alerts-section">
                <p class="alerts-section-title">Telegram</p>
                <p class="alerts-item-sub">${status}</p>
                <div class="alerts-btn-row">${buttons}</div>
                <p class="alerts-hint" id="alertsTgHint">A dependable backup that works on any phone.</p>
            </div>
        `;
    }

    async function loadSettings() {
        const box = $('alertsSettings');

        box.innerHTML = '<div class="alerts-empty">Loading...</div>';

        const [pushInfo, telegramInfo, local] = await Promise.all([
            apiCall('/push').catch(error => ({ error: error.message })),
            apiCall('/telegram').catch(error => ({ error: error.message })),
            localPushState()
        ]);

        // The user may have left the tab while this was loading
        if (activeTab !== 'settings') {
            return;
        }

        box.innerHTML =
            pushSection(pushInfo, local) +
            telegramSection(telegramInfo);
    }

    async function onSettingsClick(event) {
        const button = event.target.closest('[data-setting]');

        if (!button) {
            return;
        }

        const action = button.dataset.setting;

        button.disabled = true;

        try {
            if (action === 'push-on') {
                await enablePush();

            } else if (action === 'push-off') {
                await disablePush();

            } else if (action === 'push-test') {
                await testPush();

            } else if (action === 'tg-connect') {
                // Keeps the screen as it is, so the "press Start" hint stays
                await connectTelegram();
                button.disabled = false;
                return;

            } else if (action === 'tg-test') {
                await testTelegram();

            } else if (action === 'tg-off') {
                await disconnectTelegram();
            }

            loadSettings();

        } catch (error) {
            toast(error.message, 'error');
            button.disabled = false;
        }
    }


    /* ------------------------------------------
       OPENED FROM A NOTIFICATION
       ------------------------------------------ */

    function listenForNotificationTaps() {
        // Gaze was already open when the notification was tapped
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'open-alerts') {
                    openAlertsModal('notifications');
                }
            });
        }

        // Gaze was closed: the notification opened it with ?alerts=1
        const params = new URLSearchParams(window.location.search);

        if (params.get('alerts') === '1') {
            history.replaceState(
                null,
                '',
                window.location.pathname + window.location.hash
            );

            // Wait for login to finish (up to 10 seconds)
            let tries = 0;

            const timer = setInterval(() => {
                tries++;

                if (isLoggedIn()) {
                    clearInterval(timer);
                    openAlertsModal('notifications');
                } else if (tries > 10) {
                    clearInterval(timer);
                }
            }, 1000);
        }
    }


    /* ------------------------------------------
       START
       ------------------------------------------ */

    function init() {
        injectStyles();
        buildBell();
        buildModal();
        startPolling();
        listenForNotificationTaps();
    }

    window.openAlertsModal = openAlertsModal;
    window.openAlertForStock = openAlertForStock;

    window.GazeAlerts = {
        open: openAlertsModal,
        openFor: openAlertForStock,
        refresh: refreshUnread
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();