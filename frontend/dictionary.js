/* =========================================================
   GAZE DICTIONARY — PHASE 2 + 3A

   Features:
   - Search
   - Category filter
   - Level filter
   - A-Z browser
   - Saved terms
   - Recently viewed
   - Quick knowledge checks
   - Related concepts
   - Dark mode
   - Responsive layout
   - Local persistence
   - Phase 3A: opened from a lesson with "Back to lesson"

   Data source:
   window.GAZE_DICTIONARY

   No backend required.
   ========================================================= */

(function () {
    'use strict';

    const data = window.GAZE_DICTIONARY || { terms: [] };
    const TERMS = Array.isArray(data.terms) ? data.terms : [];

    const STORAGE = {
        saved: 'gaze_dictionary_saved_terms',
        recent: 'gaze_dictionary_recent_terms',
        checks: 'gaze_dictionary_checks'
    };

    const ui = {
        view: 'home',
        selectedTerm: null,
        query: '',
        category: 'All',
        level: 'All',
        letter: 'All',
        section: 'all',
        checkAnswered: false,
        checkCorrect: false,
        returnTo: null
    };

    /* =====================================================
       STORAGE
       ===================================================== */

    function readStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);

            if (!raw) return fallback;

            const parsed = JSON.parse(raw);

            return parsed;
        } catch (error) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            /* Ignore storage errors */
        }
    }

    let savedTerms = readStorage(STORAGE.saved, []);
    let recentTerms = readStorage(STORAGE.recent, []);
    let checkResults = readStorage(STORAGE.checks, {});

    if (!Array.isArray(savedTerms)) {
        savedTerms = [];
    }

    if (!Array.isArray(recentTerms)) {
        recentTerms = [];
    }

    if (!checkResults || typeof checkResults !== 'object') {
        checkResults = {};
    }

    /* =====================================================
       HELPERS
       ===================================================== */

    function esc(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalize(value) {
        return String(value || '')
            .trim()
            .toLowerCase();
    }

    function findTerm(termName) {
        const target = normalize(termName);

        return TERMS.find(term =>
            normalize(term.term) === target
        );
    }

    /*
     * Words lessons use that differ from the exact
     * Dictionary term name. Only real Dictionary terms
     * are targets.
     */
    const ALIASES = {
        'nigerian exchange (ngx)': 'NGX',
        'nigerian exchange': 'NGX',
        'exchange': 'Stock Exchange',
        'spread': 'Bid-Ask Spread',
        'market cap': 'Market Capitalization',
        'market capitalisation': 'Market Capitalization',
        'settled': 'Settlement',
        'eps': 'Earnings Per Share (EPS)',
        'roe': 'Return on Equity (ROE)',
        'roa': 'Return on Assets (ROA)'
    };

    function resolveTerm(text) {
        const key = normalize(text).replace(/[.,;:!?]+$/, '');

        if (ALIASES[key]) {
            return findTerm(ALIASES[key]) || null;
        }

        let term = findTerm(key);

        if (!term && key.endsWith('s')) {
            term = findTerm(key.slice(0, -1));
        }

        return term || null;
    }

    function backToSource() {
        const source = ui.returnTo;

        ui.returnTo = null;
        ui.view = 'home';
        ui.selectedTerm = null;

        if (source && typeof source.onBack === 'function') {
            source.onBack();
        }
    }

    /* =====================================================
       LEARNING PATHS (Phase 3D)

       Ordered chains of real Dictionary terms. Each step
       builds on the one before. A step whose name is not
       in dictionary-data.js is skipped, and a path with
       fewer than 2 valid steps is hidden.
       ===================================================== */

    const LEARNING_PATHS = [
        {
            title: 'Company Performance',
            steps: [
                'Revenue',
                'Gross Profit',
                'Operating Income',
                'Net Income',
                'Earnings Per Share (EPS)'
            ]
        },
        {
            title: 'Valuation',
            steps: [
                'Stock Price',
                'Earnings Per Share (EPS)',
                'P/E Ratio',
                'Valuation'
            ]
        },
        {
            title: 'Dividends',
            steps: [
                'Dividend',
                'Dividend Per Share',
                'Dividend Yield',
                'Payout Ratio'
            ]
        }
    ];

    function pathsFor(term) {
        const key = normalize(term.term);

        return LEARNING_PATHS
            .map(path => ({
                title: path.title,
                steps: path.steps.map(findTerm).filter(Boolean)
            }))
            .filter(path =>
                path.steps.length >= 2 &&
                path.steps.some(step =>
                    normalize(step.term) === key
                )
            );
    }

    function pathsHtml(term) {
        const paths = pathsFor(term);

        if (!paths.length) {
            return '';
        }

        const key = normalize(term.term);

        return `
            <section class="gaze-dictionary-section">

                <div class="gaze-dictionary-section-head">
                    <h2 class="gaze-dictionary-section-title">
                        ${paths.length > 1 ? 'Learning Paths' : 'Learning Path'}
                    </h2>
                </div>

                ${
                    paths.map(path => {
                        const at = path.steps.findIndex(step =>
                            normalize(step.term) === key
                        );

                        const next = path.steps[at + 1];

                        return `
                            <div class="gaze-dictionary-path">

                                <div class="gaze-dictionary-path-title">
                                    ${esc(path.title)}
                                </div>

                                <ol class="gaze-dictionary-path-steps">
                                    ${
                                        path.steps.map((step, i) => {
                                            const current = i === at;

                                            const done =
                                                checkResults[
                                                    normalize(step.term)
                                                ] === true;

                                            const num = `
                                                <span class="gaze-dictionary-path-num ${done ? 'done' : ''}">
                                                    ${
                                                        done
                                                            ? '<i class="fa-solid fa-check"></i>'
                                                            : i + 1
                                                    }
                                                </span>
                                            `;

                                            return `
                                                <li>
                                                    ${
                                                        current
                                                            ? `<span class="gaze-dictionary-path-step current">
                                                                   ${num}
                                                                   ${esc(step.term)}
                                                               </span>`
                                                            : `<button
                                                                   class="gaze-dictionary-path-step"
                                                                   data-action="open-term"
                                                                   data-term="${esc(step.term)}">
                                                                   ${num}
                                                                   ${esc(step.term)}
                                                               </button>`
                                                    }
                                                </li>
                                            `;
                                        }).join('')
                                    }
                                </ol>

                                ${
                                    next
                                        ? `<button
                                               class="gaze-dictionary-path-next"
                                               data-action="open-term"
                                               data-term="${esc(next.term)}">
                                               Next: ${esc(next.term)} ›
                                           </button>`
                                        : ''
                                }

                            </div>
                        `;
                    }).join('')
                }

            </section>
        `;
    }

    function categories() {
        return [
            'All',
            ...new Set(
                TERMS
                    .map(term => term.category)
                    .filter(Boolean)
            )
        ];
    }

    function levels() {
        return [
            'All',
            ...new Set(
                TERMS
                    .map(term => term.level)
                    .filter(Boolean)
            )
        ];
    }

    function isSaved(termName) {
        return savedTerms.includes(normalize(termName));
    }

    function isRecent(termName) {
        return recentTerms.includes(normalize(termName));
    }

    function saveTerm(term) {
        const key = normalize(term.term);

        if (!savedTerms.includes(key)) {
            savedTerms.unshift(key);
            writeStorage(STORAGE.saved, savedTerms);
        }

        toast('Term saved');
    }

    function unsaveTerm(term) {
        const key = normalize(term.term);

        savedTerms = savedTerms.filter(item => item !== key);

        writeStorage(STORAGE.saved, savedTerms);

        toast('Removed from saved terms');
    }

    function toggleSaved(termName) {
        const term = findTerm(termName);

        if (!term) return;

        if (isSaved(term.term)) {
            unsaveTerm(term);
        } else {
            saveTerm(term);
        }

        render();
    }

    function addRecent(term) {
        const key = normalize(term.term);

        recentTerms = recentTerms.filter(item => item !== key);

        recentTerms.unshift(key);

        recentTerms = recentTerms.slice(0, 10);

        writeStorage(STORAGE.recent, recentTerms);
    }

    function getSavedTerms() {
        return savedTerms
            .map(findTerm)
            .filter(Boolean);
    }

    function getRecentTerms() {
        return recentTerms
            .map(findTerm)
            .filter(Boolean);
    }

    function getCheckedTerms() {
        return Object.keys(checkResults)
            .filter(key => checkResults[key] === true);
    }

    function toast(message) {
        let el = document.getElementById('gazeDictionaryToast');

        if (!el) {
            el = document.createElement('div');
            el.id = 'gazeDictionaryToast';

            el.className = 'gaze-dictionary-toast';

            document.body.appendChild(el);
        }

        el.textContent = message;

        el.classList.add('show');

        clearTimeout(el._timer);

        el._timer = setTimeout(() => {
            el.classList.remove('show');
        }, 1800);
    }

    /* =====================================================
       FILTERING
       ===================================================== */

    function matchesFilters(term) {
        const q = normalize(ui.query);

        if (q) {
            const searchable = [
                term.term,
                term.definition,
                term.simpleExplanation,
                term.example,
                term.whyItMatters,
                term.category,
                term.level
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (!searchable.includes(q)) {
                return false;
            }
        }

        if (
            ui.category !== 'All' &&
            term.category !== ui.category
        ) {
            return false;
        }

        if (
            ui.level !== 'All' &&
            term.level !== ui.level
        ) {
            return false;
        }

        if (ui.letter !== 'All') {
            const first = normalize(term.term).charAt(0);

            if (first !== ui.letter.toLowerCase()) {
                return false;
            }
        }

        return true;
    }

    function filteredTerms() {
        return TERMS
            .filter(matchesFilters)
            .sort((a, b) =>
                a.term.localeCompare(b.term)
            );
    }

    /* =====================================================
       STYLES
       ===================================================== */

    function injectStyles() {
        if (document.getElementById('gazeDictionaryPhase2Styles')) {
            return;
        }

        const style = document.createElement('style');

        style.id = 'gazeDictionaryPhase2Styles';

        style.textContent = `
        /* =================================================
           ROOT
           ================================================= */

        .gaze-dictionary {
            width: 100%;
            max-width: 1100px;
            margin: 0 auto;
            padding: 18px 16px 60px;
            box-sizing: border-box;
            color: #17202a;
        }

        .gaze-dictionary *,
        .gaze-dictionary *::before,
        .gaze-dictionary *::after {
            box-sizing: border-box;
        }

        /* =================================================
           HEADER
           ================================================= */

        .gaze-dictionary-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
        }

        .gaze-dictionary-title {
            margin: 0;
            font-size: 28px;
            line-height: 1.15;
            font-weight: 800;
        }

        .gaze-dictionary-subtitle {
            margin: 6px 0 0;
            color: #68727d;
            font-size: 14px;
            line-height: 1.5;
        }

        .gaze-dictionary-back {
            border: 0;
            background: transparent;
            color: #168447;
            font-weight: 700;
            cursor: pointer;
            padding: 8px 4px;
            white-space: nowrap;
        }

        /* =================================================
           SEARCH
           ================================================= */

        .gaze-dictionary-search {
            position: relative;
            margin-bottom: 14px;
        }

        .gaze-dictionary-search i {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #7a858f;
            pointer-events: none;
        }

        .gaze-dictionary-search input {
            width: 100%;
            height: 48px;
            padding: 0 15px 0 44px;
            border: 1px solid #d9dfe4;
            border-radius: 13px;
            background: #fff;
            color: inherit;
            outline: none;
            font-size: 15px;
        }

        .gaze-dictionary-search input:focus {
            border-color: #168447;
            box-shadow: 0 0 0 3px rgba(22,132,71,.10);
        }

        /* =================================================
           CONTROLS
           ================================================= */

        .gaze-dictionary-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 14px;
        }

        .gaze-dictionary-select {
            min-width: 190px;
            height: 42px;
            padding: 0 12px;
            border: 1px solid #d9dfe4;
            border-radius: 10px;
            background: #fff;
            color: inherit;
            font-size: 14px;
            outline: none;
        }

        .gaze-dictionary-levels {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
        }

        .gaze-dictionary-pill {
            border: 1px solid #d9dfe4;
            background: #fff;
            color: #56616c;
            border-radius: 999px;
            padding: 8px 13px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
        }

        .gaze-dictionary-pill.active {
            background: #168447;
            border-color: #168447;
            color: #fff;
        }

        /* =================================================
           QUICK NAV
           ================================================= */

        .gaze-dictionary-nav {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 15px 0;
        }

        .gaze-dictionary-nav button {
            border: 1px solid #d9dfe4;
            background: #fff;
            color: #4e5963;
            border-radius: 10px;
            padding: 9px 13px;
            cursor: pointer;
            font-weight: 700;
            font-size: 13px;
        }

        .gaze-dictionary-nav button.active {
            background: #edf8f1;
            border-color: #a8d8b9;
            color: #168447;
        }

        /* =================================================
           A-Z
           ================================================= */

        .gaze-dictionary-az {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            padding: 12px;
            margin-bottom: 18px;
            border: 1px solid #e1e5e8;
            border-radius: 13px;
            background: #fff;
        }

        .gaze-dictionary-letter {
            width: 31px;
            height: 31px;
            border: 0;
            border-radius: 7px;
            background: #f2f4f6;
            color: #45515c;
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
        }

        .gaze-dictionary-letter:hover:not(:disabled) {
            background: #e6f5eb;
            color: #168447;
        }

        .gaze-dictionary-letter.active {
            background: #168447;
            color: #fff;
        }

        .gaze-dictionary-letter:disabled {
            opacity: .35;
            cursor: not-allowed;
        }

        /* =================================================
           FILTER SUMMARY
           ================================================= */

        .gaze-dictionary-summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            color: #68727d;
            font-size: 13px;
        }

        .gaze-dictionary-clear {
            border: 0;
            background: transparent;
            color: #168447;
            font-weight: 700;
            cursor: pointer;
        }

        /* =================================================
           HOME SECTIONS
           ================================================= */

        .gaze-dictionary-section {
            margin-top: 25px;
        }

        .gaze-dictionary-section-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        .gaze-dictionary-section-title {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
        }

        .gaze-dictionary-section-count {
            color: #7b858e;
            font-size: 12px;
            font-weight: 700;
        }

        /* =================================================
           TERM GRID
           ================================================= */

        .gaze-dictionary-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 11px;
        }

        .gaze-dictionary-card {
            position: relative;
            border: 1px solid #e1e5e8;
            border-radius: 14px;
            background: #fff;
            padding: 15px;
            cursor: pointer;
            transition:
                transform .16s ease,
                border-color .16s ease,
                box-shadow .16s ease;
        }

        .gaze-dictionary-card:hover {
            transform: translateY(-1px);
            border-color: #b9cfc1;
            box-shadow: 0 5px 18px rgba(20,35,25,.06);
        }

        .gaze-dictionary-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
        }

        .gaze-dictionary-card h3 {
            margin: 0;
            font-size: 16px;
            line-height: 1.25;
        }

        .gaze-dictionary-card p {
            margin: 9px 0 0;
            color: #68727d;
            font-size: 13px;
            line-height: 1.5;
        }

        .gaze-dictionary-card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 11px;
        }

        .gaze-dictionary-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 4px 8px;
            background: #f1f4f5;
            color: #5e6872;
            font-size: 10px;
            font-weight: 800;
        }

        .gaze-dictionary-badge.green {
            background: #eaf7ee;
            color: #168447;
        }

        .gaze-dictionary-save {
            width: 32px;
            height: 32px;
            flex-shrink: 0;
            border: 1px solid #dce2e6;
            border-radius: 9px;
            background: #fff;
            color: #78838d;
            cursor: pointer;
        }

        .gaze-dictionary-save.saved {
            color: #168447;
            background: #edf8f1;
            border-color: #b7ddc3;
        }

        /* =================================================
           EMPTY
           ================================================= */

        .gaze-dictionary-empty {
            border: 1px dashed #cfd6dc;
            border-radius: 14px;
            padding: 30px 18px;
            text-align: center;
            color: #6e7882;
            background: #fff;
        }

        .gaze-dictionary-empty i {
            font-size: 25px;
            margin-bottom: 10px;
            opacity: .65;
        }

        .gaze-dictionary-empty h3 {
            margin: 0 0 5px;
            color: #27313a;
            font-size: 16px;
        }

        .gaze-dictionary-empty p {
            margin: 0;
            font-size: 13px;
        }

        /* =================================================
           DETAIL
           ================================================= */

        .gaze-dictionary-detail {
            max-width: 850px;
            margin: 0 auto;
        }

        .gaze-dictionary-detail-back {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: 0;
            background: transparent;
            color: #168447;
            padding: 7px 0;
            margin-bottom: 14px;
            cursor: pointer;
            font-weight: 800;
        }

        .gaze-dictionary-detail-title-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
        }

        .gaze-dictionary-detail-title {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
        }

        .gaze-dictionary-detail-actions {
            display: flex;
            gap: 8px;
        }

        .gaze-dictionary-action {
            min-height: 40px;
            border: 1px solid #d9dfe4;
            border-radius: 10px;
            background: #fff;
            color: #4d5963;
            padding: 0 12px;
            cursor: pointer;
            font-weight: 800;
        }

        .gaze-dictionary-action.saved {
            color: #168447;
            border-color: #b7ddc3;
            background: #edf8f1;
        }

        .gaze-dictionary-detail-card {
            border: 1px solid #e0e5e8;
            border-radius: 15px;
            background: #fff;
            padding: 18px;
            margin-bottom: 12px;
        }

        .gaze-dictionary-detail-card h3 {
            margin: 0 0 8px;
            font-size: 15px;
        }

        .gaze-dictionary-detail-card p {
            margin: 0;
            color: #53606b;
            font-size: 14px;
            line-height: 1.65;
        }

        .gaze-dictionary-example {
            border-left: 3px solid #168447;
            background: #f5faf7;
        }

        /* =================================================
           KNOWLEDGE CHECK
           ================================================= */

        .gaze-dictionary-check {
            border: 1px solid #dce6e0;
            border-radius: 15px;
            background: #f7fbf8;
            padding: 18px;
            margin-top: 18px;
        }

        .gaze-dictionary-check-label {
            color: #168447;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .06em;
            margin-bottom: 7px;
        }

        .gaze-dictionary-check h3 {
            margin: 0 0 15px;
            font-size: 17px;
        }

        .gaze-dictionary-option {
            display: block;
            width: 100%;
            text-align: left;
            border: 1px solid #d8e0db;
            border-radius: 10px;
            background: #fff;
            padding: 12px;
            margin-top: 8px;
            cursor: pointer;
            color: #39444d;
            line-height: 1.45;
            font-size: 13px;
        }

        .gaze-dictionary-option:hover {
            border-color: #8fc4a1;
        }

        .gaze-dictionary-option.correct {
            border-color: #65ad7d;
            background: #eaf7ee;
            color: #176d39;
        }

        .gaze-dictionary-option.wrong {
            border-color: #dc8d8d;
            background: #fff1f1;
            color: #a53d3d;
        }

        .gaze-dictionary-check-result {
            margin-top: 12px;
            font-size: 13px;
            line-height: 1.5;
            font-weight: 700;
        }

        /* =================================================
           RELATED
           ================================================= */

        .gaze-dictionary-related {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
        }

        .gaze-dictionary-related-card {
            border: 1px solid #e0e5e8;
            border-radius: 12px;
            background: #fff;
            padding: 13px;
            cursor: pointer;
            text-align: left;
        }

        .gaze-dictionary-related-card:hover {
            border-color: #a8cfb5;
        }

        .gaze-dictionary-related-card strong {
            display: block;
            color: #27313a;
            font-size: 14px;
        }

        .gaze-dictionary-related-card span {
            display: block;
            margin-top: 4px;
            color: #7a858e;
            font-size: 11px;
        }

        /* =================================================
           TOAST
           ================================================= */

        /* =================================================
           LEARNING PATHS
           ================================================= */

        .gaze-dictionary-path {
            border: 1px solid #e0e5e8;
            border-radius: 15px;
            background: #fff;
            padding: 16px;
            margin-bottom: 12px;
        }

        .gaze-dictionary-path-title {
            margin-bottom: 10px;
            color: #168447;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .06em;
        }

        .gaze-dictionary-path-steps {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .gaze-dictionary-path-steps li {
            margin: 0 0 6px;
        }

        .gaze-dictionary-path-step {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 9px 10px;
            border: 1px solid #e0e5e8;
            border-radius: 10px;
            background: #fff;
            color: #27313a;
            font-family: inherit;
            font-size: 14px;
            font-weight: 700;
            text-align: left;
        }

        button.gaze-dictionary-path-step {
            cursor: pointer;
        }

        button.gaze-dictionary-path-step:hover {
            border-color: #a8cfb5;
        }

        .gaze-dictionary-path-step.current {
            background: #edf8f1;
            border-color: #a8d8b9;
            color: #168447;
        }

        .gaze-dictionary-path-num {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            border-radius: 50%;
            background: #f2f4f6;
            color: #45515c;
            font-size: 11px;
            font-weight: 800;
        }

        .gaze-dictionary-path-num.done {
            background: #eaf7ee;
            color: #168447;
        }

        .gaze-dictionary-path-step.current .gaze-dictionary-path-num {
            background: #168447;
            color: #fff;
        }

        .gaze-dictionary-path-next {
            margin-top: 6px;
            padding: 6px 0;
            border: 0;
            background: transparent;
            color: #168447;
            font-family: inherit;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
        }

        /* =================================================
           TOAST
           ================================================= */

        .gaze-dictionary-toast {
            position: fixed;
            left: 50%;
            bottom: 22px;
            transform: translate(-50%, 15px);
            opacity: 0;
            pointer-events: none;
            z-index: 99999;
            padding: 10px 14px;
            border-radius: 10px;
            background: #20272d;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            transition: .2s ease;
        }

        .gaze-dictionary-toast.show {
            opacity: 1;
            transform: translate(-50%, 0);
        }

        /* =================================================
           DARK MODE
           ================================================= */

        html.dark-mode .gaze-dictionary,
        body.dark-mode .gaze-dictionary,
        [data-theme="dark"] .gaze-dictionary {
            color: #edf2f4;
        }

        html.dark-mode .gaze-dictionary-subtitle,
        body.dark-mode .gaze-dictionary-subtitle,
        [data-theme="dark"] .gaze-dictionary-subtitle,
        html.dark-mode .gaze-dictionary-summary,
        body.dark-mode .gaze-dictionary-summary,
        [data-theme="dark"] .gaze-dictionary-summary {
            color: #a8b1b9;
        }

        html.dark-mode .gaze-dictionary-search input,
        body.dark-mode .gaze-dictionary-search input,
        [data-theme="dark"] .gaze-dictionary-search input,
        html.dark-mode .gaze-dictionary-select,
        body.dark-mode .gaze-dictionary-select,
        [data-theme="dark"] .gaze-dictionary-select,
        html.dark-mode .gaze-dictionary-pill,
        body.dark-mode .gaze-dictionary-pill,
        [data-theme="dark"] .gaze-dictionary-pill,
        html.dark-mode .gaze-dictionary-nav button,
        body.dark-mode .gaze-dictionary-nav button,
        [data-theme="dark"] .gaze-dictionary-nav button {
            background: #171c20;
            border-color: #30383f;
            color: #e8edf0;
        }

        html.dark-mode .gaze-dictionary-card,
        body.dark-mode .gaze-dictionary-card,
        [data-theme="dark"] .gaze-dictionary-card,
        html.dark-mode .gaze-dictionary-detail-card,
        body.dark-mode .gaze-dictionary-detail-card,
        [data-theme="dark"] .gaze-dictionary-detail-card,
        html.dark-mode .gaze-dictionary-related-card,
        body.dark-mode .gaze-dictionary-related-card,
        [data-theme="dark"] .gaze-dictionary-related-card,
        html.dark-mode .gaze-dictionary-empty,
        body.dark-mode .gaze-dictionary-empty,
        [data-theme="dark"] .gaze-dictionary-empty,
        html.dark-mode .gaze-dictionary-az,
        body.dark-mode .gaze-dictionary-az,
        [data-theme="dark"] .gaze-dictionary-az {
            background: #171c20;
            border-color: #30383f;
        }

        html.dark-mode .gaze-dictionary-card p,
        body.dark-mode .gaze-dictionary-card p,
        [data-theme="dark"] .gaze-dictionary-card p,
        html.dark-mode .gaze-dictionary-detail-card p,
        body.dark-mode .gaze-dictionary-detail-card p,
        [data-theme="dark"] .gaze-dictionary-detail-card p {
            color: #aab3ba;
        }

        html.dark-mode .gaze-dictionary-card h3,
        body.dark-mode .gaze-dictionary-card h3,
        [data-theme="dark"] .gaze-dictionary-card h3,
        html.dark-mode .gaze-dictionary-related-card strong,
        body.dark-mode .gaze-dictionary-related-card strong,
        [data-theme="dark"] .gaze-dictionary-related-card strong,
        html.dark-mode .gaze-dictionary-empty h3,
        body.dark-mode .gaze-dictionary-empty h3,
        [data-theme="dark"] .gaze-dictionary-empty h3 {
            color: #f0f4f6;
        }

        html.dark-mode .gaze-dictionary-save,
        body.dark-mode .gaze-dictionary-save,
        [data-theme="dark"] .gaze-dictionary-save,
        html.dark-mode .gaze-dictionary-action,
        body.dark-mode .gaze-dictionary-action,
        [data-theme="dark"] .gaze-dictionary-action {
            background: #171c20;
            border-color: #30383f;
            color: #c2cad0;
        }

        html.dark-mode .gaze-dictionary-badge,
        body.dark-mode .gaze-dictionary-badge,
        [data-theme="dark"] .gaze-dictionary-badge {
            background: #252c31;
            color: #b8c0c6;
        }

        html.dark-mode .gaze-dictionary-letter,
        body.dark-mode .gaze-dictionary-letter,
        [data-theme="dark"] .gaze-dictionary-letter {
            background: #252c31;
            color: #c8d0d5;
        }

        html.dark-mode .gaze-dictionary-check,
        body.dark-mode .gaze-dictionary-check,
        [data-theme="dark"] .gaze-dictionary-check {
            background: #17221b;
            border-color: #2f4737;
        }

        html.dark-mode .gaze-dictionary-option,
        body.dark-mode .gaze-dictionary-option,
        [data-theme="dark"] .gaze-dictionary-option {
            background: #171c20;
            border-color: #30383f;
            color: #dce2e6;
        }

        html.dark-mode .gaze-dictionary-example,
        body.dark-mode .gaze-dictionary-example,
        [data-theme="dark"] .gaze-dictionary-example {
            background: #17221b;
        }

        html.dark-mode .gaze-dictionary-path,
        body.dark-mode .gaze-dictionary-path,
        [data-theme="dark"] .gaze-dictionary-path,
        html.dark-mode .gaze-dictionary-path-step,
        body.dark-mode .gaze-dictionary-path-step,
        [data-theme="dark"] .gaze-dictionary-path-step {
            background: #171c20;
            border-color: #30383f;
            color: #e8edf0;
        }

        html.dark-mode .gaze-dictionary-path-step.current,
        body.dark-mode .gaze-dictionary-path-step.current,
        [data-theme="dark"] .gaze-dictionary-path-step.current {
            background: #17221b;
            border-color: #2f4737;
            color: #6fd19a;
        }

        html.dark-mode .gaze-dictionary-path-num,
        body.dark-mode .gaze-dictionary-path-num,
        [data-theme="dark"] .gaze-dictionary-path-num {
            background: #252c31;
            color: #c8d0d5;
        }

        html.dark-mode .gaze-dictionary-path-step.current .gaze-dictionary-path-num,
        body.dark-mode .gaze-dictionary-path-step.current .gaze-dictionary-path-num,
        [data-theme="dark"] .gaze-dictionary-path-step.current .gaze-dictionary-path-num {
            background: #168447;
            color: #fff;
        }

        /* =================================================
           SYSTEM DARK MODE
           ================================================= */

        @media (prefers-color-scheme: dark) {
            body:not(.light-mode):not([data-theme="light"]) .gaze-dictionary {
                color: #edf2f4;
            }

            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-subtitle,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-summary {
                color: #a8b1b9;
            }

            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-card,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-detail-card,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-related-card,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-empty,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-az {
                background: #171c20;
                border-color: #30383f;
            }

            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-card h3,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-related-card strong,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-empty h3 {
                color: #f0f4f6;
            }

            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-card p,
            body:not(.light-mode):not([data-theme="light"])
            .gaze-dictionary-detail-card p {
                color: #aab3ba;
            }
        }

        /* =================================================
           MOBILE
           ================================================= */

        @media (max-width: 650px) {

            .gaze-dictionary {
                padding: 14px 12px 45px;
            }

            .gaze-dictionary-header {
                align-items: flex-start;
            }

            .gaze-dictionary-title {
                font-size: 24px;
            }

            .gaze-dictionary-grid {
                grid-template-columns: 1fr;
            }

            .gaze-dictionary-related {
                grid-template-columns: 1fr;
            }

            .gaze-dictionary-detail-title-row {
                flex-direction: column;
            }

            .gaze-dictionary-detail-title {
                font-size: 26px;
            }

            .gaze-dictionary-detail-actions {
                width: 100%;
            }

            .gaze-dictionary-action {
                flex: 1;
            }

            .gaze-dictionary-select {
                width: 100%;
            }

            .gaze-dictionary-controls {
                display: block;
            }

            .gaze-dictionary-levels {
                margin-top: 9px;
            }

            .gaze-dictionary-letter {
                width: 29px;
                height: 29px;
            }
        }
        `;

        document.head.appendChild(style);
    }

    /* =====================================================
       TERM CARD
       ===================================================== */

    function termCard(term) {
        const saved = isSaved(term.term);

        return `
            <article
                class="gaze-dictionary-card"
                data-action="open-term"
                data-term="${esc(term.term)}"
            >
                <div class="gaze-dictionary-card-top">

                    <div>
                        <h3>${esc(term.term)}</h3>
                    </div>

                    <button
                        class="gaze-dictionary-save ${saved ? 'saved' : ''}"
                        data-action="toggle-save"
                        data-term="${esc(term.term)}"
                        aria-label="${saved ? 'Remove saved term' : 'Save term'}"
                    >
                        <i class="fa-${saved ? 'solid' : 'regular'} fa-bookmark"></i>
                    </button>

                </div>

                <p>
                    ${esc(
                        term.simpleExplanation ||
                        term.definition ||
                        ''
                    )}
                </p>

                <div class="gaze-dictionary-card-meta">

                    ${
                        term.category
                            ? `
                                <span class="gaze-dictionary-badge">
                                    ${esc(term.category)}
                                </span>
                              `
                            : ''
                    }

                    ${
                        term.level
                            ? `
                                <span class="gaze-dictionary-badge green">
                                    ${esc(term.level)}
                                </span>
                              `
                            : ''
                    }

                    ${
                        checkResults[normalize(term.term)]
                            ? `
                                <span class="gaze-dictionary-badge green">
                                    <i class="fa-solid fa-check"></i>
                                    &nbsp;Checked
                                </span>
                              `
                            : ''
                    }

                </div>
            </article>
        `;
    }

    /* =====================================================
       SECTION
       ===================================================== */

    function sectionHtml(title, terms) {
        if (!terms.length) {
            return '';
        }

        return `
            <section class="gaze-dictionary-section">

                <div class="gaze-dictionary-section-head">
                    <h2 class="gaze-dictionary-section-title">
                        ${esc(title)}
                    </h2>

                    <span class="gaze-dictionary-section-count">
                        ${terms.length}
                    </span>
                </div>

                <div class="gaze-dictionary-grid">
                    ${terms.map(termCard).join('')}
                </div>

            </section>
        `;
    }

    /* =====================================================
       A-Z
       ===================================================== */

    function azHtml() {
        const available = new Set(
            TERMS.map(term =>
                normalize(term.term).charAt(0)
            )
        );

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        return `
            <div class="gaze-dictionary-az">

                <button
                    class="gaze-dictionary-letter ${
                        ui.letter === 'All' ? 'active' : ''
                    }"
                    data-action="letter"
                    data-letter="All"
                >
                    All
                </button>

                ${
                    letters.map(letter => `
                        <button
                            class="gaze-dictionary-letter ${
                                ui.letter === letter ? 'active' : ''
                            }"
                            data-action="letter"
                            data-letter="${letter}"
                            ${available.has(letter.toLowerCase()) ? '' : 'disabled'}
                        >
                            ${letter}
                        </button>
                    `).join('')
                }

            </div>
        `;
    }

    /* =====================================================
       FILTER CONTROLS
       ===================================================== */

    function controlsHtml() {
        return `
            <div class="gaze-dictionary-search">
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                    id="gazeDictionarySearch"
                    type="search"
                    placeholder="Search terms, definitions or concepts..."
                    value="${esc(ui.query)}"
                    autocomplete="off"
                >
            </div>

            <div class="gaze-dictionary-controls">

                <select
                    class="gaze-dictionary-select"
                    id="gazeDictionaryCategory"
                >
                    ${
                        categories().map(category => `
                            <option
                                value="${esc(category)}"
                                ${
                                    ui.category === category
                                        ? 'selected'
                                        : ''
                                }
                            >
                                ${esc(category === 'All'
                                    ? 'All categories'
                                    : category)}
                            </option>
                        `).join('')
                    }
                </select>

            </div>

            <div class="gaze-dictionary-levels">

                ${
                    levels().map(level => `
                        <button
                            class="gaze-dictionary-pill ${
                                ui.level === level ? 'active' : ''
                            }"
                            data-action="level"
                            data-level="${esc(level)}"
                        >
                            ${esc(level === 'All' ? 'All levels' : level)}
                        </button>
                    `).join('')
                }

            </div>

            <div class="gaze-dictionary-nav">

                <button
                    class="${ui.section === 'all' ? 'active' : ''}"
                    data-action="section"
                    data-section="all"
                >
                    All Terms
                </button>

                <button
                    class="${ui.section === 'saved' ? 'active' : ''}"
                    data-action="section"
                    data-section="saved"
                >
                    <i class="fa-regular fa-bookmark"></i>
                    Saved
                    ${
                        savedTerms.length
                            ? ` (${savedTerms.length})`
                            : ''
                    }
                </button>

                <button
                    class="${ui.section === 'recent' ? 'active' : ''}"
                    data-action="section"
                    data-section="recent"
                >
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Recent
                </button>

            </div>
        `;
    }

    /* =====================================================
       HOME
       ===================================================== */

    function homeHtml() {
        let body = '';

        if (ui.section === 'saved') {
            const saved = getSavedTerms();

            body = saved.length
                ? sectionHtml('Saved Terms', saved)
                : `
                    <div class="gaze-dictionary-empty">
                        <i class="fa-regular fa-bookmark"></i>
                        <h3>No saved terms yet</h3>
                        <p>
                            Save useful concepts while you study.
                        </p>
                    </div>
                `;

            return `
                <div class="gaze-dictionary">

                    ${headerHtml()}

                    ${controlsHtml()}

                    ${body}

                </div>
            `;
        }

        if (ui.section === 'recent') {
            const recent = getRecentTerms();

            body = recent.length
                ? sectionHtml('Recently Viewed', recent)
                : `
                    <div class="gaze-dictionary-empty">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <h3>No recently viewed terms</h3>
                        <p>
                            Terms you open will appear here.
                        </p>
                    </div>
                `;

            return `
                <div class="gaze-dictionary">

                    ${headerHtml()}

                    ${controlsHtml()}

                    ${body}

                </div>
            `;
        }

        const results = filteredTerms();

        const checkedCount = getCheckedTerms().length;

        body = results.length
            ? sectionHtml('Dictionary', results)
            : `
                <div class="gaze-dictionary-empty">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <h3>No matching terms</h3>
                    <p>
                        Try another search or clear your filters.
                    </p>
                </div>
            `;

        return `
            <div class="gaze-dictionary">

                ${headerHtml()}

                ${controlsHtml()}

                ${azHtml()}

                <div class="gaze-dictionary-summary">

                    <span>
                        ${results.length}
                        ${results.length === 1 ? 'term' : 'terms'}
                        ${checkedCount ? ` · ${checkedCount} checked` : ''}
                    </span>

                    ${
                        ui.query ||
                        ui.category !== 'All' ||
                        ui.level !== 'All' ||
                        ui.letter !== 'All'
                            ? `
                                <button
                                    class="gaze-dictionary-clear"
                                    data-action="clear-filters"
                                >
                                    Clear filters
                                </button>
                              `
                            : ''
                    }

                </div>

                ${body}

            </div>
        `;
    }

    function headerHtml() {
        return `
            <header class="gaze-dictionary-header">

                <div>
                    <h1 class="gaze-dictionary-title">
                        Investing Dictionary
                    </h1>

                    <p class="gaze-dictionary-subtitle">
                        Understand the language of investing,
                        one concept at a time.
                    </p>
                </div>

                <button
                    class="gaze-dictionary-back"
                    data-action="back-learn"
                >
                    <i class="fa-solid fa-arrow-left"></i>
                    Back to Learn
                </button>

            </header>
        `;
    }

    /* =====================================================
       KNOWLEDGE CHECK
       ===================================================== */

    function getQuestion(term) {
        /*
         * The correct answer is the existing
         * simpleExplanation/definition.
         *
         * Distractors are taken from other real dictionary
         * terms. No generated financial facts are introduced.
         */

        const correct =
            term.simpleExplanation ||
            term.definition ||
            '';

        const candidates = TERMS
            .filter(item =>
                normalize(item.term) !== normalize(term.term)
            )
            .map(item => ({
                text:
                    item.simpleExplanation ||
                    item.definition ||
                    '',
                term: item.term
            }))
            .filter(item => item.text);

        /*
         * Deterministic selection so the question does not
         * randomly change every render.
         */
        const seed = normalize(term.term)
            .split('')
            .reduce(
                (total, char) => total + char.charCodeAt(0),
                0
            );

        const distractors = [];

        for (let i = 0; i < candidates.length && distractors.length < 2; i++) {
            const index =
                (seed + i * 7) % candidates.length;

            const candidate = candidates[index];

            if (
                candidate &&
                normalize(candidate.text) !== normalize(correct)
            ) {
                if (
                    !distractors.some(
                        item => item.text === candidate.text
                    )
                ) {
                    distractors.push(candidate);
                }
            }
        }

        const options = [
            {
                text: correct,
                correct: true
            },
            ...distractors.map(item => ({
                text: item.text,
                correct: false
            }))
        ];

        /*
         * Stable shuffle.
         */
        return {
            question: `Which explanation best describes "${term.term}"?`,
            options: options.sort((a, b) => {
                const aScore =
                    normalize(a.text)
                        .split('')
                        .reduce(
                            (sum, char) =>
                                sum + char.charCodeAt(0),
                            0
                        );

                const bScore =
                    normalize(b.text)
                        .split('')
                        .reduce(
                            (sum, char) =>
                                sum + char.charCodeAt(0),
                            0
                        );

                return (
                    (aScore + seed) -
                    (bScore + seed)
                );
            })
        };
    }

    function knowledgeCheckHtml(term) {
        const question = getQuestion(term);

        if (!question.options.length) {
            return '';
        }

        return `
            <section class="gaze-dictionary-check">

                <div class="gaze-dictionary-check-label">
                    Quick Knowledge Check
                </div>

                <h3>
                    ${esc(question.question)}
                </h3>

                <div>
                    ${
                        question.options.map((option, index) => `
                            <button
                                class="gaze-dictionary-option"
                                data-action="answer-check"
                                data-index="${index}"
                                data-correct="${option.correct}"
                            >
                                ${esc(option.text)}
                            </button>
                        `).join('')
                    }
                </div>

                <div
                    class="gaze-dictionary-check-result"
                    id="gazeDictionaryCheckResult"
                ></div>

            </section>
        `;
    }

    /* =====================================================
       RELATED
       ===================================================== */

    function relatedHtml(term) {
        if (!Array.isArray(term.related) || !term.related.length) {
            return '';
        }

        const related = term.related
            .map(findTerm)
            .filter(Boolean);

        if (!related.length) {
            return '';
        }

        return `
            <section class="gaze-dictionary-section">

                <div class="gaze-dictionary-section-head">
                    <h2 class="gaze-dictionary-section-title">
                        Related Concepts
                    </h2>
                </div>

                <div class="gaze-dictionary-related">

                    ${
                        related.map(item => `
                            <button
                                class="gaze-dictionary-related-card"
                                data-action="open-term"
                                data-term="${esc(item.term)}"
                            >
                                <strong>
                                    ${esc(item.term)}
                                </strong>

                                <span>
                                    ${
                                        esc(
                                            item.simpleExplanation ||
                                            item.definition ||
                                            ''
                                        )
                                    }
                                </span>
                            </button>
                        `).join('')
                    }

                </div>

            </section>
        `;
    }

    /* =====================================================
       DETAIL
       ===================================================== */

    function detailHtml(term) {
        const saved = isSaved(term.term);

        return `
            <div class="gaze-dictionary">

                <div class="gaze-dictionary-detail">

                    ${
                        ui.returnTo
                            ? `
                                <button
                                    class="gaze-dictionary-detail-back"
                                    data-action="back-source"
                                >
                                    <i class="fa-solid fa-arrow-left"></i>
                                    ${esc(ui.returnTo.label)}
                                </button>
                              `
                            : ''
                    }

                    <button
                        class="gaze-dictionary-detail-back"
                        ${ui.returnTo ? 'style="margin-left:16px"' : ''}
                        data-action="back-dictionary"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                        ${ui.returnTo ? 'Dictionary' : 'Back to Dictionary'}
                    </button>

                    <div class="gaze-dictionary-detail-title-row">

                        <div>
                            <h1 class="gaze-dictionary-detail-title">
                                ${esc(term.term)}
                            </h1>

                            <div class="gaze-dictionary-card-meta">

                                ${
                                    term.category
                                        ? `
                                            <span class="gaze-dictionary-badge">
                                                ${esc(term.category)}
                                            </span>
                                          `
                                        : ''
                                }

                                ${
                                    term.level
                                        ? `
                                            <span class="gaze-dictionary-badge green">
                                                ${esc(term.level)}
                                            </span>
                                          `
                                        : ''
                                }

                            </div>
                        </div>

                        <div class="gaze-dictionary-detail-actions">

                            <button
                                class="gaze-dictionary-action ${
                                    saved ? 'saved' : ''
                                }"
                                data-action="toggle-save"
                                data-term="${esc(term.term)}"
                            >
                                <i class="fa-${
                                    saved ? 'solid' : 'regular'
                                } fa-bookmark"></i>

                                ${
                                    saved
                                        ? ' Saved'
                                        : ' Save'
                                }
                            </button>

                        </div>

                    </div>

                    ${
                        term.definition
                            ? `
                                <section class="gaze-dictionary-detail-card">
                                    <h3>Definition</h3>
                                    <p>
                                        ${esc(term.definition)}
                                    </p>
                                </section>
                              `
                            : ''
                    }

                    ${
                        term.simpleExplanation
                            ? `
                                <section class="gaze-dictionary-detail-card">
                                    <h3>In simple terms</h3>
                                    <p>
                                        ${esc(term.simpleExplanation)}
                                    </p>
                                </section>
                              `
                            : ''
                    }

                    ${
                        term.example
                            ? `
                                <section class="gaze-dictionary-detail-card gaze-dictionary-example">
                                    <h3>Example</h3>
                                    <p>
                                        ${esc(term.example)}
                                    </p>
                                </section>
                              `
                            : ''
                    }

                    ${
                        term.whyItMatters
                            ? `
                                <section class="gaze-dictionary-detail-card">
                                    <h3>Why it matters</h3>
                                    <p>
                                        ${esc(term.whyItMatters)}
                                    </p>
                                </section>
                              `
                            : ''
                    }

                    ${pathsHtml(term)}

                    ${knowledgeCheckHtml(term)}

                    ${relatedHtml(term)}

                </div>

            </div>
        `;
    }

    /* =====================================================
       RENDER
       ===================================================== */

    function root() {
        return document.getElementById('learnRoot');
    }

    function render() {
        injectStyles();

        const el = root();

        if (!el) {
            return;
        }

        if (
            ui.view === 'detail' &&
            ui.selectedTerm
        ) {
            const term = findTerm(ui.selectedTerm);

            if (!term) {
                ui.view = 'home';
                ui.selectedTerm = null;
            } else {
                el.innerHTML = detailHtml(term);
                return;
            }
        }

        el.innerHTML = homeHtml();

        bindSearch();
    }

    /* =====================================================
       OPEN TERM
       ===================================================== */

    function openTerm(termName, opts) {
        const term = findTerm(termName);

        if (!term) {
            return;
        }

        /*
         * When opened from a lesson, remember how to get
         * back. Navigating between related terms keeps it.
         */
        if (opts && typeof opts.onBack === 'function') {
            ui.returnTo = {
                label: opts.label || 'Back',
                onBack: opts.onBack
            };
        }

        ui.view = 'detail';
        ui.selectedTerm = term.term;

        addRecent(term);

        ui.checkAnswered = false;
        ui.checkCorrect = false;

        render();

        window.scrollTo(0, 0);
    }

    /* =====================================================
       OPEN DICTIONARY
       ===================================================== */

    function openDictionary() {
        ui.view = 'home';
        ui.selectedTerm = null;

        ui.query = '';
        ui.category = 'All';
        ui.level = 'All';
        ui.letter = 'All';
        ui.section = 'all';
        ui.returnTo = null;

        render();
    }

    /* =====================================================
       CLOSE
       ===================================================== */

    function closeDictionary() {
        if (
            window.GazeLearnUI &&
            typeof window.GazeLearnUI.showHome === 'function'
        ) {
            window.GazeLearnUI.showHome();
            return;
        }

        ui.view = 'home';
        ui.selectedTerm = null;

        render();
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    function bindSearch() {
        const input =
            document.getElementById(
                'gazeDictionarySearch'
            );

        if (!input) {
            return;
        }

        input.addEventListener('input', function () {
            ui.query = this.value;

            render();

            const newInput =
                document.getElementById(
                    'gazeDictionarySearch'
                );

            if (newInput) {
                newInput.focus();

                try {
                    newInput.setSelectionRange(
                        newInput.value.length,
                        newInput.value.length
                    );
                } catch (error) {}
            }
        });

        const category =
            document.getElementById(
                'gazeDictionaryCategory'
            );

        if (category) {
            category.addEventListener('change', function () {
                ui.category = this.value;
                render();
            });
        }
    }

    /* =====================================================
       CLEAR FILTERS
       ===================================================== */

    function clearFilters() {
        ui.query = '';
        ui.category = 'All';
        ui.level = 'All';
        ui.letter = 'All';

        render();
    }

    /* =====================================================
       KNOWLEDGE CHECK ANSWER
       ===================================================== */

    function answerCheck(button) {
        const term = findTerm(ui.selectedTerm);

        if (!term) {
            return;
        }

        const correct =
            button.dataset.correct === 'true';

        const container =
            button.closest(
                '.gaze-dictionary-check'
            );

        if (!container) {
            return;
        }

        const options =
            container.querySelectorAll(
                '.gaze-dictionary-option'
            );

        options.forEach(option => {
            option.disabled = true;

            if (
                option.dataset.correct === 'true'
            ) {
                option.classList.add('correct');
            }
        });

        if (!correct) {
            button.classList.add('wrong');
        }

        const result =
            container.querySelector(
                '#gazeDictionaryCheckResult'
            );

        if (correct) {
            checkResults[
                normalize(term.term)
            ] = true;

            writeStorage(
                STORAGE.checks,
                checkResults
            );

            if (result) {
                result.textContent =
                    'Correct. You understand the core idea.';
                result.style.color = '#168447';
            }

            toast('Knowledge check passed');
        } else {
            if (result) {
                result.textContent =
                    'Not quite. The correct explanation is highlighted above. Review the term and try again later.';
                result.style.color = '#a53d3d';
            }
        }
    }

    /* =====================================================
       EVENT DELEGATION
       ===================================================== */

    function bindGlobalEvents() {
        document.addEventListener('click', function (event) {

            const target =
                event.target.closest(
                    '[data-action]'
                );

            if (!target) {
                return;
            }

            const action =
                target.dataset.action;

            /* ---------------------------------------------
               OPEN TERM
               --------------------------------------------- */

            if (action === 'open-term') {
                event.stopPropagation();

                openTerm(
                    target.dataset.term
                );

                return;
            }

            /* ---------------------------------------------
               SAVE
               --------------------------------------------- */

            if (action === 'toggle-save') {
                event.stopPropagation();

                toggleSaved(
                    target.dataset.term
                );

                return;
            }

            /* ---------------------------------------------
               LEVEL
               --------------------------------------------- */

            if (action === 'level') {
                ui.level =
                    target.dataset.level || 'All';

                ui.letter = 'All';

                render();

                return;
            }

            /* ---------------------------------------------
               CATEGORY
               --------------------------------------------- */

            if (action === 'category') {
                ui.category =
                    target.dataset.category || 'All';

                render();

                return;
            }

            /* ---------------------------------------------
               LETTER
               --------------------------------------------- */

            if (action === 'letter') {
                ui.letter =
                    target.dataset.letter || 'All';

                ui.section = 'all';

                render();

                return;
            }

            /* ---------------------------------------------
               SECTION
               --------------------------------------------- */

            if (action === 'section') {
                ui.section =
                    target.dataset.section || 'all';

                ui.query = '';
                ui.category = 'All';
                ui.level = 'All';
                ui.letter = 'All';

                render();

                return;
            }

            /* ---------------------------------------------
               CLEAR FILTERS
               --------------------------------------------- */

            if (action === 'clear-filters') {
                clearFilters();
                return;
            }

            /* ---------------------------------------------
               BACK TO LESSON (or other source)
               --------------------------------------------- */

            if (action === 'back-source') {
                backToSource();
                return;
            }

            /* ---------------------------------------------
               BACK TO DICTIONARY
               --------------------------------------------- */

            if (action === 'back-dictionary') {
                ui.returnTo = null;
                ui.view = 'home';
                ui.selectedTerm = null;

                render();

                return;
            }

            /* ---------------------------------------------
               BACK TO LEARN
               --------------------------------------------- */

            if (action === 'back-learn') {
                closeDictionary();
                return;
            }

            /* ---------------------------------------------
               KNOWLEDGE CHECK
               --------------------------------------------- */

            if (action === 'answer-check') {
                answerCheck(target);
                return;
            }
        });
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.GazeDictionaryUI = {

        open: openDictionary,

        render: render,

        /*
         * openTerm(name, { label, onBack })
         * label/onBack are optional. When given, the detail
         * page shows a button that calls onBack.
         */
        openTerm: openTerm,

        close: closeDictionary,

        /*
         * Returns the exact Dictionary term name for a word
         * used in a lesson, or null if there is no match.
         */
        resolveTerm: function (text) {
            const term = resolveTerm(text);
            return term ? term.term : null;
        },

        getSavedTerms: function () {
            return getSavedTerms();
        },

        getRecentTerms: function () {
            return getRecentTerms();
        },

        getProgress: function () {
            return {
                saved: savedTerms.length,
                recentlyViewed: recentTerms.length,
                checksCompleted: getCheckedTerms().length
            };
        }
    };

    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {
        injectStyles();
        bindGlobalEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            init
        );
    } else {
        init();
    }

})();
