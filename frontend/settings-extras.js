/* ============================================
   GAZE — SETTINGS EXTRAS (Part 2)

   Load this AFTER app.js:
   <script src="app.js"></script>
   <script src="settings-extras.js"></script>

   It adds Theme, Language, saved settings, the
   sector fix and the Profit / Loss calculator
   without editing y app.js.
   ============================================ */

(function () {

  


    /* ----------------------------------------
       SAFE STORAGE
       ---------------------------------------- */

    const store = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (err) {
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (err) {
                /* storage unavailable: ignore */
            }
        }
    };

    const THEME_KEY = 'gazeTheme';
    const LANG_KEY = 'gazeLang';
    const GOAL_KEY = 'gazeGoalAmount';

    const byId = id => document.getElementById(id);


    /* ----------------------------------------
       WRAP HELPER
       Runs extra code before/after a function
       that already exists in app.js.
       ---------------------------------------- */

    function wrap(name, hooks) {

        const original = window[name];

        if (typeof original !== 'function') {
            console.warn(`[extras] ${name} not found, skipped`);
            return;
        }

        window[name] = function (...args) {

            if (hooks.before) {
                try {
                    hooks.before.apply(this, args);
                } catch (err) {
                    console.error(`[extras] ${name} before-hook:`, err);
                }
            }

            const result = original.apply(this, args);

            if (hooks.after) {
                try {
                    hooks.after.apply(this, args);
                } catch (err) {
                    console.error(`[extras] ${name} after-hook:`, err);
                }
            }

            return result;
        };
    }


    /* ============================================
       1. THEME
       ============================================ */

    function getThemeChoice() {

        const saved = store.get(THEME_KEY);

        return ['light', 'dark', 'system'].includes(saved)
            ? saved
            : 'system';
    }


    function applyTheme(choice) {

        const prefersDark =
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;

        const resolved =
            choice === 'system'
                ? (prefersDark ? 'dark' : 'light')
                : choice;

        document.documentElement.setAttribute(
            'data-theme',
            resolved
        );
    }


    function markThemeButtons() {

        const choice = getThemeChoice();

        document
            .querySelectorAll('[data-theme-choice]')
            .forEach(btn => {

                btn.classList.toggle(
                    'active',
                    btn.dataset.themeChoice === choice
                );
            });
    }


    // Apply right away to avoid a flash of the wrong theme
    applyTheme(getThemeChoice());


    if (window.matchMedia) {

        const mq =
            window.matchMedia('(prefers-color-scheme: dark)');

        const onSystemChange = () => {
            if (getThemeChoice() === 'system') {
                applyTheme('system');
            }
        };

        if (mq.addEventListener) {
            mq.addEventListener('change', onSystemChange);
        } else if (mq.addListener) {
            mq.addListener(onSystemChange);
        }
    }


    /* ============================================
       2. LANGUAGE (English / French)
       Existing English text is kept as the
       original; French is swapped in on top.
       ============================================ */

    const FR = {

        // Bottom tabs
        'Home': 'Accueil',
        'Analytics': 'Analyses',
        'Watchlist:tab': 'Suivi',
        'Study': 'Étudier',

        // Home
        'Watching': 'Suivies',
        'Held': 'Détenues',
        'Sold': 'Vendues',
        'Total Portfolio': 'Portefeuille total',
        'Top Performer': 'Meilleure performance',
        'Sector Allocation': 'Répartition sectorielle',
        'Goal Progress': 'Progression de l’objectif',
        'NSE Portfolio': 'Portefeuille NSE',
        'US Portfolio': 'Portefeuille US',
        'Portfolio Performance': 'Performance du portefeuille',
        'Recent Activity': 'Activité récente',

        // Screen titles
        'Watchlist': 'Liste de surveillance',
        'Portfolio': 'Portefeuille',
        'Sold Stocks': 'Actions vendues',

        // Settings
        'Settings': 'Paramètres',
        'Gaze investor': 'Investisseur Gaze',
        'Account': 'Compte',
        'Name': 'Nom',
        'Password & Security': 'Mot de passe et sécurité',
        'Notifications': 'Notifications',
        'Soon': 'Bientôt',
        'Preferences': 'Préférences',
        'Portfolio Goal (₦)': 'Objectif du portefeuille (₦)',
        'Display Total In': 'Afficher le total en',
        'Theme': 'Thème',
        'Light': 'Clair',
        'Dark': 'Sombre',
        'System': 'Système',
        'Language': 'Langue',
        'Tools': 'Outils',
        'Floating Tools': 'Outils flottants',
        'Quick access from anywhere': 'Accès rapide depuis n’importe où',
        'Choose your tools': 'Choisissez vos outils',
        'Select up to 3': 'Sélectionnez jusqu’à 3',
        'Stock Explorer': 'Explorateur d’actions',
        'Profit / Loss': 'Gains / Pertes',
        'Support': 'Assistance',
        'About Us': 'À propos',
        'Save Settings': 'Enregistrer les paramètres',
        '‹ Back': '‹ Retour',

        // Calculator
        'Market': 'Marché',
        'Shares': 'Nombre d’actions',
        'Buy price': 'Prix d’achat',
        'Target sell price': 'Prix de vente visé',
        'Fee per trade (%)': 'Frais par transaction (%)',
        'Invested': 'Investi',
        'Sale value': 'Valeur de vente',
        'Profit / Loss': 'Gain / Perte',
        'Return': 'Rendement',
        'Break-even price': 'Seuil de rentabilité',
        'The fee is applied to both the buy and the sell. Results are estimates only.':
        'Les frais s’appliquent à l’achat et à la vente. Les résultats sont des estimations.',
        'Market Calendar': 'Calendrier des marchés'
    };

    const FR_GREETING = {
        'Good Morning,': 'Bonjour,',
        'Good Afternoon,': 'Bon après-midi,',
        'Good Evening,': 'Bonsoir,'
    };

    // [selector, optional dictionary key]
    const LANG_TARGETS = [
        ['.tabs .tab-btn[data-tab="home"] p'],
        ['.tabs .tab-btn[data-tab="analytics"] p'],
        ['.tabs .tab-btn[data-tab="watchlist"] p', 'Watchlist:tab'],
        ['.tabs .tab-btn[data-tab="study"] p'],

        ['.quick-stats .stat-label'],
        ['.portfolio-label'],
        ['.top-performer-label'],
        ['.sector-label'],
        ['.goal-label'],
        ['#nseCard .mini-label'],
        ['#usCard .mini-label'],
        ['.chart-header h3'],
        ['.activity-header h3'],

        ['.watchlist-container h2'],
        ['.portfolio-container h2'],
        ['.sold-container h2'],
        ['.analytics-container h2'],
        ['.study-container h2'],

        ['#settingsTab .settings-title'],
        ['.settings-profile-sub'],
        ['.settings-section-label'],
        ['#settingsTab .settings-row-label'],
        ['.settings-soon'],
        ['#themeToggle .segmented-btn'],
        ['#saveSetting'],

        ['#explorerTab .settings-title'],
        ['#calculatorTab .settings-title'],
        ['.tool-back'],

        ['#calculatorTab .settings-row-label'],
        ['#calculatorTab .calc-result-row > span'],
        ['#calculatorTab .calc-hint'],
        ['#calendarTab .settings-title'],

        ['.floating-tools-setting-row .settings-row-label'],
        ['.floating-tools-setting-hint'],
        ['.floating-tools-picker-header strong'],
        ['.floating-tools-picker-header span']
    ];


    let currentLang =
        store.get(LANG_KEY) === 'fr'
            ? 'fr'
            : 'en';


    function applyLanguage() {

        document.documentElement.lang = currentLang;

        LANG_TARGETS.forEach(([selector, key]) => {

            document
                .querySelectorAll(selector)
                .forEach(el => {

                    if (el.dataset.i18nOrig === undefined) {
                        el.dataset.i18nOrig =
                            el.textContent.trim();
                    }

                    const original = el.dataset.i18nOrig;

                    const french =
                        FR[key || original];

                    el.textContent =
                        currentLang === 'fr' && french
                            ? french
                            : original;
                });
        });

        applyGreeting();
    }


    // The greeting changes by time of day, so it
    // is handled separately.
    function applyGreeting() {

        const el = byId('greetingText');

        if (!el) {
            return;
        }

        const hour = new Date().getHours();

        const english =
            hour < 12
                ? 'Good Morning,'
                : hour < 17
                    ? 'Good Afternoon,'
                    : 'Good Evening,';

        el.textContent =
            currentLang === 'fr'
                ? FR_GREETING[english]
                : english;
    }


    setInterval(applyGreeting, 30000);


    /* ============================================
       3. SETTINGS THAT ACTUALLY SAVE
       ============================================ */

    let floatingToolReturnTab = null;
    let floatingToolBackButton = null;
    let openingFloatingTool = false;
    let returningFromFloatingTool = false;

        function syncSettingsProfile() {

        const nameEl = byId('settingsProfileName');
        const avatarEl = byId('settingsAvatar');

        // displayName() lives in app.js: Guest when logged out, nickname when logged in
        const name =
            typeof displayName === 'function'
                ? displayName()
                : 'Guest';

        if (nameEl) {
            nameEl.textContent = name;
        }

        if (avatarEl) {
            avatarEl.textContent =
                name.charAt(0).toUpperCase();
        }
    }


    function fillSettingsInputs() {

        const nameInput = byId('settingName');
        const goalInput = byId('settingGoal');

        // The Name box is the account nickname (empty when logged out)
        if (nameInput) {
            const account =
                window.GazeAuth && window.GazeAuth.getUser();

            nameInput.value =
                account ? (account.nickname || '') : '';
        }

        if (goalInput && typeof state !== 'undefined') {

            const goal =
                state.settings &&
                state.settings.goalAmount;

            goalInput.value = goal || '';
        }
    }

    // Keep the settings profile card in step with
    // the header name/avatar
    wrap('updateHeader', {
        after: syncSettingsProfile
    });


// Fill the inputs whenever Settings is opened.
// Preserve the existing switchTab function from app.js.
wrap('switchTab', {
    after(tabName) {
        document.body.classList.toggle(
            'calendar-tool-open',
            tabName === 'calendar'
        );

        // Hide Back during normal navigation, but preserve it
        // while a floating tool is opening or Back is returning.
        if (
            !openingFloatingTool &&
            !returningFromFloatingTool &&
            floatingToolBackButton
        ) {
            floatingToolBackButton.style.display = 'none';
            floatingToolReturnTab = null;
        }

        if (tabName === 'settings') {
            fillSettingsInputs();
            syncSettingsProfile();
        }
    }
});


    // Remember the goal on this device. Without this,
    // the next sync from the server overwrites it.
    wrap('saveSettings', {

        before() {

            const goalInput = byId('settingGoal');

            const goal =
                goalInput
                    ? parseInt(goalInput.value, 10)
                    : NaN;

            if (goal > 0) {
                store.set(GOAL_KEY, String(goal));
            }
        },

        after: syncSettingsProfile
    });


    /* ============================================
       4. SECTOR BAR FIX
       Maps your real sector names to Finance /
       Tech / Consumer / Other.
       ============================================ */

    function sectorGroup(name) {

        const s = String(name || '').toLowerCase();

        if (/financ|bank|insur/.test(s)) {
            return 'finance';
        }

        if (/tech/.test(s)) {
            return 'tech';
        }

        if (/consumer/.test(s)) {
            return 'consumer';
        }

        return 'other';
    }


    function applySectorBar() {

        if (typeof state === 'undefined') {
            return;
        }

        const stocks =
            (state.portfolio && state.portfolio.stocks) || [];

        const rate =
            Number(
                state.exchangeRate &&
                state.exchangeRate.usdToNgn
            ) || 1650;

        const totals = {
            finance: 0,
            tech: 0,
            consumer: 0,
            other: 0
        };

        stocks.forEach(stock => {

            let value =
                (Number(stock.quantity) || 0) *
                (Number(stock.buyPrice) || 0);

            if (stock.market === 'US') {
                value *= rate;
            }

            if (!(value > 0)) {
                return;
            }

            totals[sectorGroup(stock.sector)] += value;
        });

        const sum =
            totals.finance +
            totals.tech +
            totals.consumer +
            totals.other;

        const pct = key =>
            sum > 0
                ? (totals[key] / sum) * 100
                : 0;

        const parts = [
            ['finance', 'sectorFinance', 'financePercent'],
            ['tech', 'sectorTech', 'techPercent'],
            ['consumer', 'sectorConsumer', 'consumerPercent'],
            ['other', 'sectorOther', 'otherPercent']
        ];

        parts.forEach(([key, barId, textId]) => {

            const bar = byId(barId);
            const text = byId(textId);
            const value = pct(key);

            if (bar) {
                bar.style.flex = `${value} 0 0%`;
            }

            if (text) {
                text.textContent = Math.round(value);
            }
        });
    }


    wrap('updatePortfolioCard', {

        // Apply the saved goal before the card is drawn
        before() {

            const savedGoal =
                Number(store.get(GOAL_KEY));

            if (
                savedGoal > 0 &&
                typeof state !== 'undefined' &&
                state.settings
            ) {
                state.settings.goalAmount = savedGoal;
            }
        },

        after: applySectorBar
    });


    /* ============================================
       5. PROFIT / LOSS CALCULATOR
       ============================================ */

    let calcMarket = 'NGX';


    function fmt(value) {

        if (typeof formatNumber === 'function') {
            return formatNumber(value);
        }

        return Number(value).toLocaleString(
            'en-US',
            { maximumFractionDigits: 2 }
        );
    }


    function setResult(id, text, tone) {

        const el = byId(id);

        if (!el) {
            return;
        }

        el.textContent = text;
        el.classList.remove('positive', 'negative');

        if (tone) {
            el.classList.add(tone);
        }
    }


    function runCalculator() {

        const shares = parseFloat(byId('calcShares')?.value);
        const buy = parseFloat(byId('calcBuy')?.value);
        const sell = parseFloat(byId('calcSell')?.value);
        const feePct = parseFloat(byId('calcFee')?.value);

        const fee =
            Number.isFinite(feePct) && feePct > 0
                ? Math.min(feePct, 99) / 100
                : 0;

        const cur = calcMarket === 'US' ? '$' : '₦';

        const blank = [
            'calcInvested',
            'calcProceeds',
            'calcProfit',
            'calcReturn',
            'calcBreakeven'
        ];

        if (!(shares > 0 && buy > 0)) {
            blank.forEach(id => setResult(id, '—'));
            return;
        }

        const invested = shares * buy * (1 + fee);
        const breakEven = (buy * (1 + fee)) / (1 - fee);

        setResult('calcInvested', `${cur}${fmt(invested)}`);
        setResult('calcBreakeven', `${cur}${fmt(breakEven)}`);

        if (!(sell > 0)) {
            ['calcProceeds', 'calcProfit', 'calcReturn']
                .forEach(id => setResult(id, '—'));
            return;
        }

        const proceeds = shares * sell * (1 - fee);
        const profit = proceeds - invested;
        const returnPct = (profit / invested) * 100;

        const tone =
            profit > 0
                ? 'positive'
                : profit < 0
                    ? 'negative'
                    : null;

        const sign =
            profit > 0
                ? '+'
                : profit < 0
                    ? '-'
                    : '';

        setResult('calcProceeds', `${cur}${fmt(proceeds)}`);

        setResult(
            'calcProfit',
            `${sign}${cur}${fmt(Math.abs(profit))}`,
            tone
        );

        setResult(
            'calcReturn',
            `${sign}${Math.abs(returnPct).toFixed(2)}%`,
            tone
        );
    }



        /* ============================================
       6. FLOATING TOOLS SPHERE
       ============================================ */

    const FLOATING_TOOLS_ENABLED_KEY =
        'gazeFloatingToolsEnabled';

    const FLOATING_TOOLS_SELECTION_KEY =
        'gazeFloatingTools';

    const MAX_FLOATING_TOOLS = 3;
    let floatingToolsCloseTimer = null;
    /* ============================================
   FLOATING TOOL BACK BUTTON
   Returns users to the screen they came from.
   ============================================ */




function getCurrentGazeTab() {
    const activeTab = document.querySelector(
        '.tabs .tab-btn.active'
    );

    return activeTab?.dataset.tab || 'home';
}


function createFloatingToolBackButton() {
    if (floatingToolBackButton) {
        return floatingToolBackButton;
    }

    const button = document.createElement('button');

    button.type = 'button';
    button.id = 'gazeFloatingToolBack';

    button.innerHTML = `
    <span style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.16);
        font-size: 17px;
        line-height: 1;
    ">‹</span>
    <span>Back</span>
`;

    button.setAttribute(
        'aria-label',
        'Return to previous screen'
    );

    button.style.cssText = `
    position: fixed;
    bottom: 105px;
    right: 22px;
    z-index: 10001;

    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;

    min-width: 92px;
    height: 46px;
    padding: 0 18px;

    border: 1px solid rgba(8, 127, 115, 0.35);
    border-radius: 50px;

    background: linear-gradient(
        135deg,
        rgba(4, 63, 53, 0.96),
        rgba(8, 127, 115, 0.94)
    );

    color: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;

    box-shadow:
        0 8px 24px rgba(4, 63, 53, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);

    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        opacity 0.2s ease;
`;

button.addEventListener('click', () => {
    const returnTab = floatingToolReturnTab || 'home';

    button.style.display = 'none';
    floatingToolReturnTab = null;

    returningFromFloatingTool = true;

    try {
        if (typeof window.switchTab === 'function') {
            window.switchTab(returnTab);
        }
    } finally {
        returningFromFloatingTool = false;
    }
});

    document.body.appendChild(button);

    floatingToolBackButton = button;

    return button;
}


function positionFloatingToolBackButton(button) {
    const sphere = document.getElementById('floatingToolsSphere');

    if (!button || !sphere) return;

    const sphereRect = sphere.getBoundingClientRect();

    const buttonWidth = button.offsetWidth || 92;
    const buttonHeight = button.offsetHeight || 46;
    const gap = 12;
    const edge = 12;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Prefer placing the Back button above the toolbox.
    let left = sphereRect.left + (sphereRect.width / 2) - (buttonWidth / 2);
    let top = sphereRect.top - buttonHeight - gap;

    // If there's insufficient room above, place it below.
    if (top < edge) {
        top = sphereRect.bottom + gap;
    }

    // Keep the button inside the screen horizontally.
    left = Math.max(
        edge,
        Math.min(left, viewportWidth - buttonWidth - edge)
    );

    // If the bottom placement doesn't fit, place it above instead.
    if (top + buttonHeight > viewportHeight - edge) {
        top = sphereRect.top - buttonHeight - gap;
    }

    // Final vertical safety check.
    top = Math.max(
        edge,
        Math.min(top, viewportHeight - buttonHeight - edge)
    );

    button.style.left = left + 'px';
    button.style.top = top + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
}

function openFloatingTool(tool) {
    if (!tool || typeof tool.open !== 'function') {
        return;
    }

    // Remember the screen before opening the tool.
    floatingToolReturnTab = getCurrentGazeTab();

    openingFloatingTool = true;

    try {
        tool.open();
    } finally {
        openingFloatingTool = false;
    }

    const button = createFloatingToolBackButton();

button.style.display = 'inline-flex';

// Wait for the button to become measurable, then position it.
requestAnimationFrame(function () {
    positionFloatingToolBackButton(button);
});
}


    /*
       Only tools that actually exist in Gaze are
       registered here.

       When a new tool is built later, add it here
       with its own open() function.
    */

           const FLOATING_TOOLS = {

        explorer: {
            id: 'explorer',
            label: 'Stock Explorer',
            icon: 'fa-regular fa-compass',

            open() {
                switchTab('explorer');
            }
        },

        calculator: {
            id: 'calculator',
            label: 'Profit / Loss',
            icon: 'fa-solid fa-calculator',

            open() {
                switchTab('calculator');
            }
        },

        calendar: {
            id: 'calendar',
            label: 'Market Calendar',
            icon: 'fa-regular fa-calendar',

            open() {
                switchTab('calendar');
            }
        },

        dictionary: {
    id: 'dictionary',
    label: 'Investing Dictionary',
    icon: 'fa-solid fa-book-open',

    open() {
        // Switch to the Study tab first so #learnRoot is visible.
        if (typeof window.switchTab === 'function') {
            window.switchTab('study');
        }

        // Open the existing Gaze Investing Dictionary.
        if (typeof window.GazeDictionaryUI?.open === 'function') {
            window.GazeDictionaryUI.open();
        } else {
            console.warn(
                '[Gaze] Investing Dictionary is not available. ' +
                'Check that dictionary.js has loaded.'
            );
        }
    }
}

    };

    function getFloatingToolsEnabled() {

        return store.get(
            FLOATING_TOOLS_ENABLED_KEY
        ) === 'true';
    }


    function getFloatingToolsSelection() {

        let saved = [];

        try {
            saved =
                JSON.parse(
                    store.get(FLOATING_TOOLS_SELECTION_KEY) || '[]'
                );
        } catch (err) {
            saved = [];
        }

        if (!Array.isArray(saved)) {
            saved = [];
        }

        /*
           Remove tools that no longer exist.
        */

        saved = saved.filter(
            id => Boolean(FLOATING_TOOLS[id])
        );

        return saved.slice(0, MAX_FLOATING_TOOLS);
    }


    function saveFloatingToolsSelection(selection) {

        const cleaned = selection
            .filter(id => Boolean(FLOATING_TOOLS[id]))
            .slice(0, MAX_FLOATING_TOOLS);

        store.set(
            FLOATING_TOOLS_SELECTION_KEY,
            JSON.stringify(cleaned)
        );
    }


    function setFloatingToolsEnabled(enabled) {

        store.set(
            FLOATING_TOOLS_ENABLED_KEY,
            enabled ? 'true' : 'false'
        );

        renderFloatingToolsSphere();
        syncFloatingToolsSettings();
    }


    function syncFloatingToolsSettings() {

        const toggle =
            byId('floatingToolsEnabled');

        const picker =
            byId('floatingToolsPicker');

        if (toggle) {
            toggle.checked =
                getFloatingToolsEnabled();
        }

        if (picker) {

            picker.classList.toggle(
                'visible',
                getFloatingToolsEnabled()
            );
        }

        renderFloatingToolsOptions();
    }


    function renderFloatingToolsOptions() {

        const container =
            byId('floatingToolsOptions');

        const countEl =
            byId('floatingToolsCount');

        if (!container) {
            return;
        }

        const selected =
            getFloatingToolsSelection();

        if (countEl) {
            countEl.textContent =
                `${selected.length}/${MAX_FLOATING_TOOLS}`;
        }

        container.innerHTML = '';

        Object.values(FLOATING_TOOLS)
            .forEach(tool => {

                const checked =
                    selected.includes(tool.id);

                const maxReached =
                    selected.length >= MAX_FLOATING_TOOLS;

                const disabled =
                    !checked && maxReached;

                const label =
                    document.createElement('label');

                label.className =
                    'floating-tool-option';

                if (disabled) {
                    label.classList.add('disabled');
                }

                label.innerHTML = `
                    <input
                        type="checkbox"
                        value="${tool.id}"
                        ${checked ? 'checked' : ''}
                        ${disabled ? 'disabled' : ''}
                    >

                    <i class="${tool.icon} floating-tool-option-icon"></i>

                    <span class="floating-tool-option-label">
                        ${tool.label}
                    </span>
                `;

                const checkbox =
                    label.querySelector('input');

                checkbox.addEventListener(
                    'change',
                    () => {

                        let current =
                            getFloatingToolsSelection();

                        if (checkbox.checked) {

                            if (
                                current.length >=
                                MAX_FLOATING_TOOLS
                            ) {
                                checkbox.checked = false;
                                return;
                            }

                            current.push(tool.id);

                        } else {

                            current =
                                current.filter(
                                    id => id !== tool.id
                                );
                        }

                        saveFloatingToolsSelection(current);

                        renderFloatingToolsOptions();
                        renderFloatingToolsSphere();
                    }
                );

                container.appendChild(label);
            });
    }


    function renderFloatingToolsSphere() {

        const sphere =
            byId('floatingToolsSphere');

        const menu =
            byId('floatingToolsMenu');

        const toggle =
            byId('floatingToolsToggle');

        if (!sphere || !menu || !toggle) {
            return;
        }

        const enabled =
            getFloatingToolsEnabled();

        const selected =
            getFloatingToolsSelection();

        /*
           Hide completely when disabled or when
           there are no selected tools.
        */

        const shouldShow =
            enabled && selected.length > 0;

        sphere.classList.toggle(
            'enabled',
            shouldShow
        );

        if (!shouldShow) {

            sphere.classList.remove('open');

            toggle.setAttribute(
                'aria-expanded',
                'false'
            );

            menu.setAttribute(
                'aria-hidden',
                'true'
            );

            menu.innerHTML = '';

            return;
        }


        menu.innerHTML = '';


        selected.forEach(id => {

            const tool =
                FLOATING_TOOLS[id];

            if (!tool) {
                return;
            }

            const button =
                document.createElement('button');

            button.type = 'button';

            button.className =
                'floating-tool-button';

            button.innerHTML = `
                <span class="floating-tool-icon">
                    <i class="${tool.icon}"></i>
                </span>

                <span class="floating-tool-label">
                    ${tool.label}
                </span>
            `;

            button.addEventListener(
                'click',
                () => {

                    /*
                       Close the sphere first.
                    */

                    sphere.classList.remove('open');

                    toggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );

                    menu.setAttribute(
                        'aria-hidden',
                        'true'
                    );

                    /*
                       Then open the selected tool.
                    */

                    openFloatingTool(tool);
                }
            );

            menu.appendChild(button);
        });
    }


    function closeFloatingToolsSphere() {

const sphere = byId('floatingToolsSphere');
const toggle = byId('floatingToolsToggle');
const menu = byId('floatingToolsMenu');

if (!sphere || !toggle || !menu) {
    return;
}

// Already closed or currently closing.
if (
    !sphere.classList.contains('open') ||
    sphere.classList.contains('closing')
) {
    return;
}

// Cancel any previous closing timer.
if (floatingToolsCloseTimer) {
    clearTimeout(floatingToolsCloseTimer);
    floatingToolsCloseTimer = null;
}

// Keep the menu open temporarily so the exit animation can play.
sphere.classList.add('closing');

toggle.setAttribute('aria-expanded', 'false');
menu.setAttribute('aria-hidden', 'true');

// Wait for the longest exit animation to finish.
floatingToolsCloseTimer = setTimeout(() => {

    sphere.classList.remove('open', 'closing');

    floatingToolsCloseTimer = null;

}, 350);

}

    function setupFloatingTools() {

        const toggle =
            byId('floatingToolsToggle');

        const enabledToggle =
            byId('floatingToolsEnabled');

        if (!toggle || !enabledToggle) {
            return;
        }


        /*
           Main sphere button
        */

        toggle.addEventListener(
'click',
event => {

    event.stopPropagation();

    const sphere = byId('floatingToolsSphere');
    const menu = byId('floatingToolsMenu');

    if (!sphere || !menu) {
        return;
    }

    // If the toolbox is open, play its closing animation.
    if (sphere.classList.contains('open')) {
        closeFloatingToolsSphere();
        return;
    }

    // Cancel a pending close if the toolbox is reopened quickly.
    if (floatingToolsCloseTimer) {
        clearTimeout(floatingToolsCloseTimer);
        floatingToolsCloseTimer = null;
    }

    sphere.classList.remove('closing');
    sphere.classList.add('open');

    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
}

);

        /*
           Settings toggle
        */

        enabledToggle.addEventListener(
    'change',
    () => {
        setFloatingToolsEnabled(
            enabledToggle.checked
        );
    }
);


        /*
           Clicking outside closes the sphere.
        */

        document.addEventListener(
            'click',
            event => {

                const sphere =
                    byId('floatingToolsSphere');

                if (
                    sphere &&
                    !sphere.contains(event.target)
                ) {
                    closeFloatingToolsSphere();
                }
            }
        );


        /*
           Initial state
        */

        syncFloatingToolsSettings();
        renderFloatingToolsSphere();
    }

    /* ============================================
       INIT
       ============================================ */

    document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization
    syncSettingsProfile();
    applySectorBar();

    // Floating Tools
    setupFloatingTools();

        // Theme buttons
        document
            .querySelectorAll('[data-theme-choice]')
            .forEach(btn => {

                btn.addEventListener('click', () => {

                    const choice = btn.dataset.themeChoice;

                    store.set(THEME_KEY, choice);
                    applyTheme(choice);
                    markThemeButtons();
                });
            });

        markThemeButtons();


        // Language select
        const langSelect = byId('settingLanguage');

        if (langSelect) {

            langSelect.value = currentLang;

            langSelect.addEventListener('change', () => {

                currentLang =
                    langSelect.value === 'fr'
                        ? 'fr'
                        : 'en';

                store.set(LANG_KEY, currentLang);
                applyLanguage();
            });
        }

        applyLanguage();


        // Calculator
        ['calcShares', 'calcBuy', 'calcSell', 'calcFee']
            .forEach(id => {

                const input = byId(id);

                if (input) {
                    input.addEventListener('input', runCalculator);
                }
            });

        document
            .querySelectorAll('[data-calc-market]')
            .forEach(btn => {

                btn.addEventListener('click', () => {

                    calcMarket = btn.dataset.calcMarket;

                    document
                        .querySelectorAll('[data-calc-market]')
                        .forEach(b =>
                            b.classList.toggle(
                                'active',
                                b === btn
                            )
                        );

                    runCalculator();
                });
            });

        runCalculator();


             
    });

})();


/* =========================================================
   GAZE FLOATING TOOLS — TOUCH DRAG, EDGE SNAP & POSITION
   ========================================================= */

(function setupGazeFloatingToolsTouch() {
    'use strict';

    const STORAGE_KEY = 'gazeFloatingToolsPosition';
    const HOLD_DURATION = 500;
    const SAVE_DELAY = 1000;
    const EDGE_PADDING = 8;
    const MOVEMENT_THRESHOLD = 8;

    const sphere = document.getElementById('floatingToolsSphere');
    const toggle = document.getElementById('floatingToolsToggle');
    const menu = document.getElementById('floatingToolsMenu');

    if (!sphere || !toggle || !menu) {
        console.warn(
            '[Gaze] Floating tools touch controller: required elements not found.'
        );
        return;
    }

    /*
     * Touch capability is detected separately from viewport width.
     * A narrow desktop window alone does not activate dragging.
     *
     * Set window.GAZE_TEST_TOUCH_TOOLS = true in DevTools before
     * reloading to test the touch interactions on a desktop.
     */
    function supportsTouchInteraction() {
        return (
            window.GAZE_TEST_TOUCH_TOOLS === true ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches
        );
    }

    let touchMode = supportsTouchInteraction();
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let originalX = 0;
    let originalY = 0;
    let holdTimer = null;
    let saveTimer = null;
    let holdStarted = 0;
    let dragging = false;
    let holdActivated = false;
    let moved = false;
    let suppressNextClick = false;
    let animationFrame = null;
    let holdRing = null;
    let holdRingProgress = null;

    const originalTouchAction = toggle.style.touchAction;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), Math.max(min, max));
    }

    function viewportSize() {
        const viewport = window.visualViewport;

        return {
            width: viewport ? viewport.width : window.innerWidth,
            height: viewport ? viewport.height : window.innerHeight
        };
    }

    function sphereSize() {
        const rect = sphere.getBoundingClientRect();

        return {
            width: rect.width,
            height: rect.height
        };
    }

    function isMenuOpen() {
        return sphere.classList.contains('open');
    }

    function cancelSave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
    }

    function getCurrentPosition() {
        const rect = sphere.getBoundingClientRect();

        return {
            x: rect.left,
            y: rect.top
        };
    }

    function setPosition(x, y, side) {
        const viewport = viewportSize();
        const size = sphereSize();

        const maxX = viewport.width - size.width - EDGE_PADDING;
        const maxY = viewport.height - size.height - EDGE_PADDING;

        x = clamp(x, EDGE_PADDING, maxX);
        y = clamp(y, EDGE_PADDING, maxY);

        sphere.style.position = 'fixed';
        sphere.style.top = `${y}px`;
        sphere.style.bottom = 'auto';

        if (side === 'left') {
            sphere.style.left = `${EDGE_PADDING}px`;
            sphere.style.right = 'auto';
            sphere.dataset.edge = 'left';
        } else if (side === 'right') {
            sphere.style.left = 'auto';
            sphere.style.right = `${EDGE_PADDING}px`;
            sphere.dataset.edge = 'right';
        } else {
            sphere.style.left = `${x}px`;
            sphere.style.right = 'auto';
        }

        updateMenuPlacement();
    }

    function savePosition() {
        const rect = sphere.getBoundingClientRect();

        const position = {
            side: sphere.dataset.edge || 'right',
            top: Math.round(rect.top),
            savedAt: Date.now()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(position));

            sphere.classList.remove('gaze-position-saved');

            // Restart the confirmation animation on every save.
            void sphere.offsetWidth;

            sphere.classList.add('gaze-position-saved');

            window.setTimeout(() => {
                sphere.classList.remove('gaze-position-saved');
            }, 900);
        } catch (error) {
            console.warn('[Gaze] Could not save toolbox position.', error);
        }
    }

    function scheduleSave() {
        cancelSave();

        saveTimer = window.setTimeout(() => {
            saveTimer = null;
            savePosition();
        }, SAVE_DELAY);
    }

    function restorePosition() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (!saved || !Number.isFinite(saved.top)) {
                return;
            }

            const viewport = viewportSize();
            const size = sphereSize();

            const maxY = viewport.height - size.height - EDGE_PADDING;
            const y = clamp(saved.top, EDGE_PADDING, maxY);

            const side = saved.side === 'left' ? 'left' : 'right';

            setPosition(
                side === 'left'
                    ? EDGE_PADDING
                    : viewport.width - size.width - EDGE_PADDING,
                y,
                side
            );
        } catch (error) {
            console.warn('[Gaze] Could not restore toolbox position.', error);
        }
    }

    /* ---------- Long-press progress indicator ---------- */

    function createHoldRing() {
        if (holdRing) return;

        holdRing = document.createElement('span');
        holdRing.className = 'gaze-hold-ring';
        holdRing.setAttribute('aria-hidden', 'true');

        holdRingProgress = document.createElement('span');
        holdRingProgress.className = 'gaze-hold-ring-progress';

        holdRing.appendChild(holdRingProgress);
        toggle.appendChild(holdRing);
    }

    function showHoldProgress(progress) {
        createHoldRing();

        holdRing.style.opacity = '1';
        holdRingProgress.style.setProperty(
            '--gaze-hold-progress',
            `${Math.round(progress * 360)}deg`
        );
    }

    function hideHoldProgress() {
        if (holdRing) {
            holdRing.style.opacity = '0';
        }
    }

    function updateHoldProgress() {
        if (!holdStarted || !holdTimer) return;

        const elapsed = performance.now() - holdStarted;
        const progress = Math.min(elapsed / HOLD_DURATION, 1);

        showHoldProgress(progress);

        if (progress < 1) {
            animationFrame = requestAnimationFrame(updateHoldProgress);
        }
    }

    /* ---------- Menu positioning ---------- */

    function updateMenuPlacement() {
        if (!menu || !sphere.isConnected) return;

        const viewport = viewportSize();
        const sphereRect = sphere.getBoundingClientRect();

        const previousVisibility = menu.style.visibility;
        const previousDisplay = menu.style.display;

        // Measure the actual menu even if it is currently closed.
        menu.style.visibility = 'hidden';
        menu.style.display = 'flex';

        const menuRect = menu.getBoundingClientRect();
        const menuHeight = menu.scrollHeight || menuRect.height;
        const menuWidth = menu.scrollWidth || menuRect.width;

        const spaceBelow =
            viewport.height - sphereRect.bottom - EDGE_PADDING;

        const spaceAbove =
            sphereRect.top - EDGE_PADDING;

        const fitsBelow = spaceBelow >= menuHeight;
        const fitsAbove = spaceAbove >= menuHeight;

        let direction;

        if (fitsBelow && !fitsAbove) {
            direction = 'down';
        } else if (fitsAbove && !fitsBelow) {
            direction = 'up';
        } else if (fitsAbove && fitsBelow) {
            direction = 'down';
        } else {
            direction =
                spaceAbove > spaceBelow ? 'up' : 'down';
        }

        sphere.dataset.menuDirection = direction;

        /*
         * Keep the menu within the viewport horizontally.
         * The menu opens inward from whichever side the sphere occupies.
         */
        const centerX = sphereRect.left + sphereRect.width / 2;

        sphere.dataset.menuAlignment =
            centerX > viewport.width / 2 ? 'right' : 'left';

        const maxMenuWidth = Math.max(
            100,
            viewport.width - EDGE_PADDING * 2
        );

        menu.style.maxWidth = `${maxMenuWidth}px`;
        menu.style.maxHeight = `${Math.max(
            80,
            viewport.height - EDGE_PADDING * 2
        )}px`;
        menu.style.overflowY = 'auto';

        menu.style.visibility = previousVisibility;
        menu.style.display = previousDisplay;
    }

    /* ---------- Dragging ---------- */

    function clearHoldTimer() {
        if (holdTimer) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        holdStarted = 0;
        hideHoldProgress();
    }

    function activateDragMode() {
        if (!pointerId || isMenuOpen()) return;

        holdActivated = true;
        dragging = true;

        sphere.classList.add('gaze-drag-ready');

        if (navigator.vibrate) {
            try {
                navigator.vibrate(20);
            } catch (_) {
                // Vibration is optional.
            }
        }
    }

    function onPointerDown(event) {
        touchMode = supportsTouchInteraction();

        if (!touchMode) return;
        if (event.pointerType === 'mouse') return;
        if (event.button !== undefined && event.button !== 0) return;
        if (isMenuOpen()) return;

        pointerId = event.pointerId;

        const rect = sphere.getBoundingClientRect();

        startX = event.clientX;
        startY = event.clientY;

        originalX = rect.left;
        originalY = rect.top;

        moved = false;
        dragging = false;
        holdActivated = false;

        cancelSave();

        holdStarted = performance.now();

        holdTimer = window.setTimeout(() => {
            holdTimer = null;
            activateDragMode();
        }, HOLD_DURATION);

        animationFrame = requestAnimationFrame(updateHoldProgress);
    }

    function onPointerMove(event) {
        if (pointerId === null || event.pointerId !== pointerId) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (
            Math.abs(dx) > MOVEMENT_THRESHOLD ||
            Math.abs(dy) > MOVEMENT_THRESHOLD
        ) {
            moved = true;
        }

        /*
         * Movement before the 2-second hold does not drag the sphere.
         * It cancels the hold instead.
         */
        if (!holdActivated && moved) {
            clearHoldTimer();
            return;
        }

        if (!dragging) return;

        event.preventDefault();

        const viewport = viewportSize();
        const size = sphereSize();

        const x = clamp(
            originalX + dx,
            EDGE_PADDING,
            viewport.width - size.width - EDGE_PADDING
        );

        const y = clamp(
            originalY + dy,
            EDGE_PADDING,
            viewport.height - size.height - EDGE_PADDING
        );

        sphere.style.left = `${x}px`;
        sphere.style.right = 'auto';
        sphere.style.top = `${y}px`;
        sphere.style.bottom = 'auto';

        updateMenuPlacement();
    }

    function onPointerUp(event) {
        if (pointerId === null || event.pointerId !== pointerId) return;

        clearHoldTimer();

        const wasDrag = dragging;
        const wasHold = holdActivated;

        pointerId = null;

        dragging = false;
        holdActivated = false;

        sphere.classList.remove('gaze-drag-ready');

        if (wasDrag) {
            const viewport = viewportSize();
            const rect = sphere.getBoundingClientRect();

            const centerX = rect.left + rect.width / 2;
            const side = centerX < viewport.width / 2
                ? 'left'
                : 'right';

            const targetX = side === 'left'
                ? EDGE_PADDING
                : viewport.width - rect.width - EDGE_PADDING;

            setPosition(targetX, rect.top, side);

            suppressNextClick = true;

            // Save one second after the sphere settles.
            scheduleSave();
        } else if (wasHold) {
            /*
             * A completed hold without a drag must not open the toolbox.
             */
            suppressNextClick = true;
        }

        sphere.classList.remove('gaze-drag-ready');
    }

    function onPointerCancel(event) {
        if (pointerId === null || event.pointerId !== pointerId) return;

        clearHoldTimer();

        pointerId = null;
        dragging = false;
        holdActivated = false;

        sphere.classList.remove('gaze-drag-ready');
    }

    /*
     * Capture phase lets us suppress the click generated after a drag,
     * without replacing the existing toolbox click handler.
     */
    function onClickCapture(event) {
        if (suppressNextClick) {
            event.preventDefault();
            event.stopImmediatePropagation();

            suppressNextClick = false;
        }
    }

    toggle.addEventListener('pointerdown', onPointerDown, {
        passive: true
    });

    window.addEventListener('pointermove', onPointerMove, {
        passive: false
    });

    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    toggle.addEventListener('click', onClickCapture, true);

    /* ---------- Resize and orientation ---------- */

    function keepSphereVisible() {
        if (!touchMode) return;

        const rect = sphere.getBoundingClientRect();
        const viewport = viewportSize();

        const side = sphere.dataset.edge === 'left'
            ? 'left'
            : 'right';

        const x = side === 'left'
            ? EDGE_PADDING
            : viewport.width - rect.width - EDGE_PADDING;

        const y = clamp(
            rect.top,
            EDGE_PADDING,
            viewport.height - rect.height - EDGE_PADDING
        );

        setPosition(x, y, side);
        updateMenuPlacement();
    }

    window.addEventListener('resize', keepSphereVisible);
    window.addEventListener('orientationchange', keepSphereVisible);

    if (window.visualViewport) {
        window.visualViewport.addEventListener(
            'resize',
            keepSphereVisible
        );
    }

    /*
     * Recalculate placement whenever the existing toolbox opens.
     * This does not add or replace the existing open/close handler.
     */
    const menuObserver = new MutationObserver(() => {
        if (isMenuOpen()) {
            requestAnimationFrame(updateMenuPlacement);
        }
    });

    menuObserver.observe(sphere, {
        attributes: true,
        attributeFilter: ['class']
    });

    /* ---------- Initialize ---------- */

    toggle.style.touchAction = 'none';

    if (touchMode) {
        restorePosition();
    }

    console.info(
        '[Gaze] Floating tools touch controller initialized.',
        { touchMode }
    );

})();
