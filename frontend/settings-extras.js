/* ============================================
   GAZE — SETTINGS EXTRAS (Part 2)

   Load this AFTER app.js:
   <script src="app.js"></script>
   <script src="settings-extras.js"></script>

   It adds Theme, Language, saved settings, the
   sector fix and the Profit / Loss calculator
   without editing app.js.
   ============================================ */

(function () {

    'use strict';


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
        'Stock Explorer': 'Explorateur d’actions',
        'Profit / Loss Calculator': 'Calculateur de gains / pertes',
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
            'Les frais s’appliquent à l’achat et à la vente. Les résultats sont des estimations.'
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
        ['#calculatorTab .calc-hint']
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

    function syncSettingsProfile() {

        const nameEl = byId('settingsProfileName');
        const avatarEl = byId('settingsAvatar');

        const name =
            (typeof state !== 'undefined' && state.userName)
                ? state.userName
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

        if (nameInput && typeof state !== 'undefined') {
            nameInput.value = state.userName || '';
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


    // Fill the inputs whenever Settings is opened
    wrap('switchTab', {
        after(tabName) {
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
       INIT
       ============================================ */

    document.addEventListener('DOMContentLoaded', () => {

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


        // Settings profile + sector bar for the first paint
        syncSettingsProfile();
        applySectorBar();
    });

})();
