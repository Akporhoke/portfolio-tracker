/* ============================================
   SYSTEM STATUS (admin only)
   ============================================

   A small panel that shows how Gaze is doing: price scheduler, providers,
   circuit breakers, markets, alerts and which channels are switched on.

   Self-contained, like alert.js: one <script> line after alert.js.
   It needs API_BASE and state from app.js.

   The button only appears for admins. From the browser console you can
   also open it with:  GazeStatus.open()
*/

(function () {
    'use strict';

    const REFRESH_MS = 15 * 1000;

    let modalEl = null;
    let refreshTimer = null;
    let buttonBuilt = false;


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

    // "5 min ago", "2 h ago"
    function ago(value) {
        const time = new Date(value).getTime();

        if (!Number.isFinite(time)) {
            return 'never';
        }

        const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));

        if (seconds < 60) {
            return `${seconds}s ago`;
        }

        if (seconds < 3600) {
            return `${Math.round(seconds / 60)} min ago`;
        }

        if (seconds < 86400) {
            return `${Math.round(seconds / 3600)} h ago`;
        }

        return `${Math.round(seconds / 86400)} d ago`;
    }

    // "3 d 4 h", "12 min"
    function duration(totalSeconds) {
        const seconds = Number(totalSeconds) || 0;

        if (seconds < 3600) {
            return `${Math.max(1, Math.round(seconds / 60))} min`;
        }

        if (seconds < 86400) {
            return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`;
        }

        return `${Math.floor(seconds / 86400)} d ${Math.round((seconds % 86400) / 3600)} h`;
    }

    function currentUser() {
        try {
            return (
                window.GazeAuth &&
                typeof window.GazeAuth.getUser === 'function' &&
                window.GazeAuth.getUser()
            ) || null;
        } catch (error) {
            return null;
        }
    }

    function isAdmin(user) {
        return Boolean(
            user &&
            (
                user.role === 'admin' ||
                user.isAdmin === true ||
                (Array.isArray(user.roles) && user.roles.includes('admin'))
            )
        );
    }

    async function apiCall(path) {
        const response = await fetch(
            `${API_BASE}/portfolio/${encodeURIComponent(state.userId)}${path}`
        );

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        if (!response.ok) {
            const failure = new Error(
                response.status === 403
                    ? 'Admins only.'
                    : (data && (data.error || data.message)) ||
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
        if ($('statusStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'statusStyles';

        style.textContent = `
            .status-card {
                padding: 12px;
                border-radius: 10px;
                background: rgba(128, 128, 128, 0.1);
                margin-bottom: 10px;
            }

            .status-title {
                font-weight: 600;
                font-size: 14px;
                margin: 0 0 8px;
            }

            .status-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                padding: 3px 0;
            }

            .status-row span:last-child {
                color: #999;
                text-align: right;
            }

            .status-dot {
                display: inline-block;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                margin-right: 6px;
                background: #999;
            }

            .status-dot.good { background: #059669; }
            .status-dot.warn { background: #d97706; }
            .status-dot.bad { background: #dc2626; }

            .status-error {
                font-size: 12px;
                color: #dc2626;
                margin: 4px 0 0;
            }

            .status-foot {
                font-size: 11px;
                color: #999;
                text-align: center;
                margin-top: 6px;
            }
        `;

        document.head.appendChild(style);
    }


    /* ------------------------------------------
       RENDERING
       ------------------------------------------ */

    function row(good, label, value) {
        const dot =
            good === null
                ? ''
                : `<span class="status-dot ${good ? 'good' : 'bad'}"></span>`;

        return `
            <div class="status-row">
                <span>${dot}${esc(label)}</span>
                <span>${esc(value)}</span>
            </div>
        `;
    }

    function card(title, body) {
        return `
            <div class="status-card">
                <p class="status-title">${esc(title)}</p>
                ${body}
            </div>
        `;
    }

    // A part of the snapshot that failed shows its error, not a crash
    function errorLine(part) {
        return part && part.error
            ? `<p class="status-error">${esc(part.error)}</p>`
            : '';
    }

    function marketLabel(marketState) {
        if (!marketState || marketState.error) {
            return { open: null, text: 'unknown' };
        }

        if (typeof marketState.isOpen === 'boolean') {
            return {
                open: marketState.isOpen,
                text: marketState.isOpen ? 'Open' : 'Closed'
            };
        }

        if (typeof marketState.open === 'boolean') {
            return {
                open: marketState.open,
                text: marketState.open ? 'Open' : 'Closed'
            };
        }

        const text = String(marketState.status || marketState.state || 'unknown');

        return { open: /open/i.test(text), text };
    }

    function schedulerCard(snapshot) {
        const job = snapshot.scheduler;

        if (!job || job.error) {
            return card(
                'Price scheduler',
                (job && errorLine(job)) ||
                '<p class="status-error">No run recorded yet.</p>'
            );
        }

        const ok = job.status === 'success';

        return card(
            'Price scheduler',
            row(snapshot.features.priceScheduler, 'Switched on here',
                snapshot.features.priceScheduler ? 'yes' : 'no (off on this server)') +
            row(ok, 'Last run', `${job.status || 'unknown'}, ${ago(job.completedAt || job.startedAt)}`) +
            row(null, 'Last success', ago(job.lastSuccessfulAt)) +
            row(null, 'Stocks tracked', job.stocksFound ?? '—') +
            row(null, 'Refreshed / failed / skipped',
                `${job.apiFetches ?? 0} / ${job.failed ?? 0} / ${job.skipped ?? 0}`) +
            (job.error ? `<p class="status-error">${esc(job.error)}</p>` : '')
        );
    }

    function breakersCard(snapshot) {
        const list = Array.isArray(snapshot.breakers) ? snapshot.breakers : [];

        if (list.length === 0) {
            return card('Provider circuits', '<p class="status-foot">No data</p>');
        }

        const rows = list.map(item => {
            const dotClass =
                item.state === 'closed'
                    ? 'good'
                    : item.state === 'half_open' ? 'warn' : 'bad';

            let detail = item.state === 'closed' ? 'healthy' : item.state.replace('_', ' ');

            if (item.state === 'open') {
                detail += `, retry in ${item.retryInSeconds}s`;
            }

            if (item.lastError && item.state !== 'closed') {
                detail += ` (${item.lastError})`;
            }

            return `
                <div class="status-row">
                    <span><span class="status-dot ${dotClass}"></span>${esc(item.key)}</span>
                    <span>${esc(detail)}</span>
                </div>
            `;
        }).join('');

        return card('Provider circuits', rows);
    }

    function providersCard(snapshot) {
        const list = snapshot.providers;

        if (!Array.isArray(list)) {
            return card('Quota cooldowns', errorLine(list));
        }

        const now = Date.now();

        const rows = list.map(item => {
            const cooling =
                item.cooldownUntil &&
                new Date(item.cooldownUntil).getTime() > now;

            return row(
                !cooling,
                item.provider,
                cooling
                    ? `cooling down until ${new Date(item.cooldownUntil).toLocaleString()}`
                    : 'available'
            );
        }).join('');

        return card(
            'Quota cooldowns',
            rows || '<p class="status-foot">No provider has hit a limit.</p>'
        );
    }

    function marketsCard(snapshot) {
        const ngx = marketLabel(snapshot.markets && snapshot.markets.NGX);
        const us = marketLabel(snapshot.markets && snapshot.markets.US);

        return card(
            'Markets',
            row(ngx.open === null ? null : ngx.open, 'NGX', ngx.text) +
            row(us.open === null ? null : us.open, 'US', us.text)
        );
    }

    function activityCard(snapshot) {
        const counts = snapshot.counts || {};
        const alerts = counts.alerts || {};

        return card(
            'Alerts and channels',
            row(null, 'Alerts active / paused / triggered',
                `${alerts.active ?? '—'} / ${alerts.paused ?? '—'} / ${alerts.triggered ?? '—'}`) +
            row(null, 'Notifications, last 24 h', counts.notificationsLast24h ?? '—') +
            row(snapshot.features.pushConfigured, 'Push set up',
                `${snapshot.features.pushConfigured ? 'yes' : 'no'}, ${counts.pushDevices ?? '—'} device(s)`) +
            row(snapshot.features.telegramConfigured, 'Telegram set up',
                `${snapshot.features.telegramConfigured ? 'yes' : 'no'}, ${counts.telegramLinked ?? '—'} linked`) +
            row(null, 'Telegram listening here',
                snapshot.features.telegramPolling ? 'yes' : 'no')
        );
    }

    function serverCard(snapshot) {
        const server = snapshot.server || {};

        return card(
            'Server',
            row(null, 'Running for', duration(server.uptimeSeconds)) +
            row(null, 'Memory', `${server.memoryMb ?? '—'} MB`) +
            row(null, 'Node', server.node || '—')
        );
    }

    function render(snapshot) {
        $('statusBody').innerHTML =
            schedulerCard(snapshot) +
            breakersCard(snapshot) +
            providersCard(snapshot) +
            marketsCard(snapshot) +
            activityCard(snapshot) +
            serverCard(snapshot) +
            `<p class="status-foot">Updated ${esc(new Date(snapshot.generatedAt).toLocaleTimeString())}. Refreshes every 15 seconds.</p>`;
    }


    /* ------------------------------------------
       LOADING + MODAL
       ------------------------------------------ */

    async function load() {
        try {
            render(await apiCall('/admin/status'));
        } catch (error) {
            $('statusBody').innerHTML =
                `<div class="alerts-empty">${esc(error.message)}</div>`;
        }
    }

    function buildModal() {
        if ($('statusModal')) {
            modalEl = $('statusModal');
            return;
        }

        modalEl = document.createElement('div');
        modalEl.className = 'modal';
        modalEl.id = 'statusModal';

        modalEl.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>System status</h2>
                    <button type="button" class="close-modal" id="statusClose" aria-label="Close status">✕</button>
                </div>
                <div class="modal-body">
                    <div id="statusBody"><div class="alerts-empty">Loading...</div></div>
                </div>
            </div>
        `;

        document.body.appendChild(modalEl);

        $('statusClose').addEventListener('click', close);

        modalEl.addEventListener('click', event => {
            if (event.target === modalEl) {
                close();
            }
        });
    }

    function open() {
        if (!modalEl) {
            return;
        }

        modalEl.classList.add('active');

        $('statusBody').innerHTML = '<div class="alerts-empty">Loading...</div>';

        load();

        clearInterval(refreshTimer);

        // Only refresh while it is open and the tab is visible
        refreshTimer = setInterval(() => {
            if (!document.hidden) {
                load();
            }
        }, REFRESH_MS);
    }

    function close() {
        clearInterval(refreshTimer);
        refreshTimer = null;

        if (modalEl) {
            modalEl.classList.remove('active');
        }
    }


    /* ------------------------------------------
       ADMIN BUTTON
       ------------------------------------------ */

    function buildButton() {
        const host = document.querySelector('.header-actions');

        if (!host || buttonBuilt || $('statusBtn')) {
            return;
        }

        buttonBuilt = true;

        const button = document.createElement('button');
        button.id = 'statusBtn';
        button.type = 'button';
        button.className = 'tab-btn header-icon-btn';
        button.setAttribute('aria-label', 'System status');
        button.innerHTML = '<i class="fa-solid fa-server"></i>';

        button.addEventListener('click', open);

        host.insertBefore(button, host.firstChild);
    }

    // The user is only known after login, so look for a few seconds
    function waitForAdmin() {
        let tries = 0;

        const timer = setInterval(() => {
            tries++;

            if (isAdmin(currentUser())) {
                clearInterval(timer);
                buildButton();
            } else if (tries > 15) {
                clearInterval(timer);
            }
        }, 2000);
    }


    /* ------------------------------------------
       START
       ------------------------------------------ */

    function init() {
        injectStyles();
        buildModal();
        waitForAdmin();
    }

    window.GazeStatus = { open, close };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
