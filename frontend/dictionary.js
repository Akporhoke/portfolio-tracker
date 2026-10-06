/* =========================================================
   GAZE DICTIONARY — PHASE 2 + 3A, 3D, 3E, TAUGHT IN, 3D, 3E, TAUGHT IN, 3D, 3E, TAUGHT IN

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
        checks: 'gaze_dictionary_checks',
        viewed: 'gaze_dictionary_viewed'
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
        checkState: null,
        revealSimple: false,
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

    /*
     * Every term the learner has opened (unique, no cap).
     * "Recent" only keeps 10, so this is what "explored"
     * counts. Terms already in Recent are included.
     */
    let viewedTerms = readStorage(STORAGE.viewed, []);

    if (!Array.isArray(viewedTerms)) {
        viewedTerms = [];
    }

    recentTerms.forEach(key => {
        if (!viewedTerms.includes(key)) {
            viewedTerms.push(key);
        }
    });

    writeStorage(STORAGE.viewed, viewedTerms);

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

    /* =====================================================
       TAUGHT IN (Dictionary -> lessons)

       Finds the lessons that teach a term, using the same
       rule as lesson links: a **bold** word in a published
       lesson that resolves to the term. Nothing is
       hand-written, so it stays right as lessons are added.
       ===================================================== */

    let lessonIndexCache = null;

    function lessonIndex() {
        if (lessonIndexCache) {
            return lessonIndexCache;
        }

        const learn = window.GAZE_LEARN;

        if (!learn || !Array.isArray(learn.tracks)) {
            return {};
        }

        const index = {};

        learn.tracks.forEach(track => {
            (track.lessons || []).forEach(lesson => {
                if (
                    lesson.status !== 'ready' ||
                    !Array.isArray(lesson.sections)
                ) {
                    return;
                }

                const texts = [];

                lesson.sections.forEach(section => {
                    (section.body || []).forEach(t => texts.push(t));
                    (section.bullets || []).forEach(t => texts.push(t));

                    if (section.example && section.example.text) {
                        texts.push(section.example.text);
                    }
                });

                texts.forEach(text => {
                    String(text || '').replace(
                        /\*\*(.+?)\*\*/g,
                        (m, inner) => {
                            const found = resolveTerm(inner);

                            if (found) {
                                const k = normalize(found.term);

                                index[k] = index[k] || [];

                                if (!index[k].some(
                                    item => item.lesson.id === lesson.id
                                )) {
                                    index[k].push({ track, lesson });
                                }
                            }

                            return m;
                        }
                    );
                });
            });
        });

        lessonIndexCache = index;

        return index;
    }

    function taughtInHtml(term) {
        const learnUI = window.GazeLearnUI;

        if (!learnUI || typeof learnUI.openLesson !== 'function') {
            return '';
        }

        const items = lessonIndex()[normalize(term.term)] || [];

        if (!items.length) {
            return '';
        }

        return `
            <section class="gaze-dictionary-section">

                <div class="gaze-dictionary-section-head">
                    <h2 class="gaze-dictionary-section-title">
                        Taught in
                    </h2>
                </div>

                ${
                    items.map(({ track, lesson }) => `
                        <button
                            class="gaze-dictionary-lesson"
                            data-action="open-lesson-from-term"
                            data-track="${esc(track.id)}"
                            data-lesson="${esc(lesson.id)}"
                        >
                            <i class="fa-solid fa-graduation-cap"></i>

                            <span>
                                <strong>${esc(lesson.title)}</strong>
                                <small>
                                    ${esc(track.title)}
                                    ${lesson.minutes ? ` • ${esc(lesson.minutes)} min` : ''}
                                </small>
                            </span>

                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    `).join('')
                }

            </section>
        `;
    }


    // BLOCK: helpers
    function hasFilters() {
        return Boolean(
            ui.query ||
            ui.category !== 'All' ||
            ui.level !== 'All' ||
            ui.letter !== 'All'
        );
    }

    /*
     * Lists names used by paths, aliases and "related" that
     * are not in dictionary-data.js. Run
     * GazeDictionaryUI.validate() in a console, or look for
     * the warning on load.
     */
    function validateData() {
        const missing = [];

        LEARNING_PATHS.forEach(path => {
            path.steps.forEach(name => {
                if (!findTerm(name)) {
                    missing.push(`Path "${path.title}": ${name}`);
                }
            });
        });

        Object.keys(ALIASES).forEach(key => {
            if (!findTerm(ALIASES[key])) {
                missing.push(`Alias "${key}" -> ${ALIASES[key]}`);
            }
        });

        TERMS.forEach(term => {
            if (!Array.isArray(term.related)) {
                return;
            }

            term.related.forEach(name => {
                if (!findTerm(name)) {
                    missing.push(`Related of "${term.term}": ${name}`);
                }
            });
        });

        if (missing.length) {
            console.warn(
                '[Gaze Dictionary] Not found in dictionary-data.js:\n' +
                missing.join('\n')
            );
        }

        return missing;
    }

    /*
     * The quiz answer is the simpleExplanation (or the
     * definition when there is no simpleExplanation). That
     * card stays hidden until the learner answers, passed
     * before, or taps "Show it anyway".
     */
    function isAnswerUnlocked(term) {
        const key = normalize(term.term);

        return (
            ui.revealSimple ||
            checkResults[key] === true ||
            Boolean(
                ui.checkState &&
                normalize(ui.checkState.term) === key
            ) ||
            getQuestion(term).options.length < 2
        );
    }

    function explanationCardHtml(term, title, text, isAnswer) {
        if (!text) {
            return '';
        }

        if (!isAnswer || isAnswerUnlocked(term)) {
            return `
                <section class="gaze-dictionary-detail-card">
                    <h3>${esc(title)}</h3>
                    <p>${esc(text)}</p>
                </section>
            `;
        }

        return `
            <section class="gaze-dictionary-detail-card">
                <h3>${esc(title)}</h3>
                <p>Take the quick knowledge check below first, then this unlocks.</p>
                <button
                    class="gaze-dictionary-action"
                    style="margin-top:12px"
                    data-action="reveal-simple"
                >
                    Show it anyway
                </button>
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

        if (!viewedTerms.includes(key)) {
            viewedTerms.push(key);
            writeStorage(STORAGE.viewed, viewedTerms);
        }
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
           PROGRESS
           ================================================= */

        .gaze-dictionary-progress {
            border: 1px solid #e0e5e8;
            border-radius: 15px;
            background: #fff;
            padding: 16px;
            margin-bottom: 16px;
        }

        .gaze-dictionary-progress-title {
            margin-bottom: 12px;
            color: #168447;
            font-size: 12px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .06em;
        }

        .gaze-dictionary-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
        }

        .gaze-dictionary-stat {
            padding: 10px 8px;
            border-radius: 10px;
            background: #f5faf7;
            text-align: center;
        }

        .gaze-dictionary-stat strong {
            display: block;
            font-size: 20px;
            line-height: 1.1;
        }

        .gaze-dictionary-stat span {
            display: block;
            margin-top: 4px;
            color: #68727d;
            font-size: 11px;
            line-height: 1.3;
        }

        .gaze-dictionary-path-progress {
            margin-top: 14px;
        }

        .gaze-dictionary-path-progress-top {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 6px;
            font-size: 12px;
            font-weight: 700;
        }

        .gaze-dictionary-path-progress-top span:last-child {
            color: #68727d;
            font-weight: 600;
        }

        .gaze-dictionary-bar {
            height: 6px;
            border-radius: 999px;
            background: #e6ebee;
            overflow: hidden;
        }

        .gaze-dictionary-bar-fill {
            height: 100%;
            border-radius: inherit;
            background: #168447;
            transition: width .4s ease;
        }

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
           TAUGHT IN
           ================================================= */

        .gaze-dictionary-lesson {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            margin-bottom: 9px;
            padding: 13px;
            border: 1px solid #e0e5e8;
            border-radius: 12px;
            background: #fff;
            color: #27313a;
            font-family: inherit;
            text-align: left;
            cursor: pointer;
        }

        .gaze-dictionary-lesson:hover {
            border-color: #a8cfb5;
        }

        .gaze-dictionary-lesson > i:first-child {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border-radius: 10px;
            background: #edf8f1;
            color: #168447;
        }

        .gaze-dictionary-lesson > span {
            flex: 1;
            min-width: 0;
        }

        .gaze-dictionary-lesson strong {
            display: block;
            font-size: 14px;
        }

        .gaze-dictionary-lesson small {
            display: block;
            margin-top: 3px;
            color: #7a858e;
            font-size: 11px;
        }

        .gaze-dictionary-lesson > i:last-child {
            color: #7a858e;
            font-size: 12px;
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
           THEME (follows the app's own colors, like Learn)
           ================================================= */

        .gaze-dictionary {
            color: var(--text-primary, #17202a);
        }

        /* secondary text */
        .gaze-dictionary .gaze-dictionary-subtitle,
        .gaze-dictionary .gaze-dictionary-summary,
        .gaze-dictionary .gaze-dictionary-section-count,
        .gaze-dictionary .gaze-dictionary-stat span,
        .gaze-dictionary .gaze-dictionary-path-progress-top span:last-child,
        .gaze-dictionary .gaze-dictionary-card p,
        .gaze-dictionary .gaze-dictionary-detail-card p,
        .gaze-dictionary .gaze-dictionary-related-card span,
        .gaze-dictionary .gaze-dictionary-lesson small,
        .gaze-dictionary .gaze-dictionary-empty,
        .gaze-dictionary .gaze-dictionary-search i,
        .gaze-dictionary .gaze-dictionary-badge:not(.green),
        .gaze-dictionary .gaze-dictionary-path-step:not(.current) .gaze-dictionary-path-num:not(.done),
        .gaze-dictionary .gaze-dictionary-save:not(.saved),
        .gaze-dictionary .gaze-dictionary-action:not(.saved) {
            color: var(--text-secondary, #68727d);
        }

        /* primary text */
        .gaze-dictionary .gaze-dictionary-card h3,
        .gaze-dictionary .gaze-dictionary-related-card strong,
        .gaze-dictionary .gaze-dictionary-empty h3,
        .gaze-dictionary .gaze-dictionary-lesson,
        .gaze-dictionary .gaze-dictionary-path-step:not(.current),
        .gaze-dictionary .gaze-dictionary-option:not(.correct):not(.wrong),
        .gaze-dictionary .gaze-dictionary-pill:not(.active),
        .gaze-dictionary .gaze-dictionary-nav button:not(.active),
        .gaze-dictionary .gaze-dictionary-letter:not(.active) {
            color: var(--text-primary, #27313a);
        }

        /* card surfaces */
        .gaze-dictionary .gaze-dictionary-search input,
        .gaze-dictionary .gaze-dictionary-select,
        .gaze-dictionary .gaze-dictionary-az,
        .gaze-dictionary .gaze-dictionary-card,
        .gaze-dictionary .gaze-dictionary-empty,
        .gaze-dictionary .gaze-dictionary-detail-card,
        .gaze-dictionary .gaze-dictionary-related-card,
        .gaze-dictionary .gaze-dictionary-progress,
        .gaze-dictionary .gaze-dictionary-path,
        .gaze-dictionary .gaze-dictionary-lesson,
        .gaze-dictionary .gaze-dictionary-path-step:not(.current),
        .gaze-dictionary .gaze-dictionary-option:not(.correct):not(.wrong),
        .gaze-dictionary .gaze-dictionary-pill:not(.active),
        .gaze-dictionary .gaze-dictionary-nav button:not(.active),
        .gaze-dictionary .gaze-dictionary-save:not(.saved),
        .gaze-dictionary .gaze-dictionary-action:not(.saved) {
            background: var(--bg-card, #fff);
            border-color: rgba(128, 128, 128, 0.28);
        }

        /* neutral fills */
        .gaze-dictionary .gaze-dictionary-letter:not(.active),
        .gaze-dictionary .gaze-dictionary-badge:not(.green),
        .gaze-dictionary .gaze-dictionary-path-step:not(.current) .gaze-dictionary-path-num:not(.done),
        .gaze-dictionary .gaze-dictionary-bar {
            background: rgba(128, 128, 128, 0.18);
        }

        /* green tints */
        .gaze-dictionary .gaze-dictionary-nav button.active,
        .gaze-dictionary .gaze-dictionary-save.saved,
        .gaze-dictionary .gaze-dictionary-action.saved,
        .gaze-dictionary .gaze-dictionary-badge.green,
        .gaze-dictionary .gaze-dictionary-path-step.current,
        .gaze-dictionary .gaze-dictionary-path-num.done,
        .gaze-dictionary .gaze-dictionary-lesson > i:first-child,
        .gaze-dictionary .gaze-dictionary-stat,
        .gaze-dictionary .gaze-dictionary-check {
            background: rgba(22, 132, 71, 0.14);
        }

        .gaze-dictionary .gaze-dictionary-check {
            border-color: rgba(22, 132, 71, 0.30);
        }

        .gaze-dictionary .gaze-dictionary-detail-card.gaze-dictionary-example {
            background: rgba(22, 132, 71, 0.10);
            border-left-color: #168447;
        }

        /* answers */
        .gaze-dictionary .gaze-dictionary-option.correct {
            background: rgba(22, 132, 71, 0.14);
            border-color: rgba(22, 132, 71, 0.65);
            color: #1f9a52;
        }

        .gaze-dictionary .gaze-dictionary-option.wrong {
            background: rgba(214, 69, 69, 0.14);
            border-color: rgba(214, 69, 69, 0.65);
            color: #d65a5a;
        }

        /* hover and keyboard focus */
        .gaze-dictionary .gaze-dictionary-card:hover,
        .gaze-dictionary .gaze-dictionary-related-card:hover,
        .gaze-dictionary .gaze-dictionary-lesson:hover,
        .gaze-dictionary button.gaze-dictionary-path-step:hover {
            border-color: rgba(22, 132, 71, 0.55);
        }

        .gaze-dictionary-card:focus-visible {
            outline: 2px solid #168447;
            outline-offset: 2px;
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
                class="gaze-dictionary-card" role="button" tabindex="0"
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

    /*
     * Phase 3E: progress from real activity only.
     * Counts, never a made-up "% understood".
     */
    function progressSnapshot() {
        return {
            totalTerms: TERMS.length,
            explored: viewedTerms.filter(findTerm).length,
            saved: savedTerms.length,
            recentlyViewed: recentTerms.length,
            checksCompleted: getCheckedTerms().length,
            paths: LEARNING_PATHS
                .map(path => {
                    const steps = path.steps
                        .map(findTerm)
                        .filter(Boolean);

                    return {
                        title: path.title,
                        total: steps.length,
                        explored: steps.filter(step =>
                            viewedTerms.includes(normalize(step.term))
                        ).length,
                        checked: steps.filter(step =>
                            checkResults[normalize(step.term)] === true
                        ).length
                    };
                })
                .filter(path => path.total >= 2)
        };
    }

    function progressHtml() {
        if (
            ui.query ||
            ui.category !== 'All' ||
            ui.level !== 'All' ||
            ui.letter !== 'All'
        ) {
            return '';
        }

        const p = progressSnapshot();

        if (!p.explored && !p.saved && !p.checksCompleted) {
            return '';
        }

        const paths = p.paths.filter(path =>
            path.explored > 0 || path.checked > 0
        );

        return `
            <section class="gaze-dictionary-progress">

                <div class="gaze-dictionary-progress-title">
                    Your progress
                </div>

                <div class="gaze-dictionary-stats">

                    <div class="gaze-dictionary-stat">
                        <strong>${p.explored}</strong>
                        <span>explored of ${p.totalTerms}</span>
                    </div>

                    <div class="gaze-dictionary-stat">
                        <strong>${p.saved}</strong>
                        <span>saved</span>
                    </div>

                    <div class="gaze-dictionary-stat">
                        <strong>${p.checksCompleted}</strong>
                        <span>checks passed</span>
                    </div>

                </div>

                ${
                    paths.map(path => `
                        <div class="gaze-dictionary-path-progress">

                            <div class="gaze-dictionary-path-progress-top">
                                <span>${esc(path.title)}</span>
                                <span>${path.checked} of ${path.total} checked</span>
                            </div>

                            <div class="gaze-dictionary-bar">
                                <div
                                    class="gaze-dictionary-bar-fill"
                                    style="width: ${Math.round((path.checked / path.total) * 100)}%">
                                </div>
                            </div>

                        </div>
                    `).join('')
                }

            </section>
        `;
    }

    function homeHtml() {
        let body = '';

        if (ui.section === 'saved') {
            const saved = getSavedTerms().filter(matchesFilters);

            body = saved.length
                ? sectionHtml('Saved Terms', saved)
                : `
                    <div class="gaze-dictionary-empty">
                        <i class="fa-regular fa-bookmark"></i>
                        <h3>${hasFilters() ? 'No saved terms match' : 'No saved terms yet'}</h3>
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
            const recent = getRecentTerms().filter(matchesFilters);

            body = recent.length
                ? sectionHtml('Recently Viewed', recent)
                : `
                    <div class="gaze-dictionary-empty">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <h3>${hasFilters() ? 'No recent terms match' : 'No recently viewed terms'}</h3>
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

                ${progressHtml()}

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

        /*
         * Wrong answers come from the SAME category first, then
         * the same level, then anything else. Same-category
         * terms sound alike, so the question tests real
         * understanding instead of being easy to guess.
         */
        const key = normalize(term.term);

        const tier = item =>
            item.category === term.category
                ? 0
                : item.level === term.level
                    ? 1
                    : 2;

        const candidates = TERMS
            .filter(item =>
                normalize(item.term) !== key &&
                (item.simpleExplanation || item.definition)
            )
            .map(item => ({
                text:
                    item.simpleExplanation ||
                    item.definition,
                term: item.term,
                tier: tier(item)
            }))
            .filter(item =>
                normalize(item.text) !== normalize(correct)
            )
            .sort((a, b) =>
                a.tier - b.tier ||
                a.term.localeCompare(b.term)
            );

        let pool = candidates.filter(item => item.tier === 0);

        if (pool.length < 2) {
            pool = candidates.filter(item => item.tier <= 1);
        }

        if (pool.length < 2) {
            pool = candidates;
        }

        /*
         * Deterministic selection so the question does not
         * randomly change every render.
         */
        const seed = key
            .split('')
            .reduce(
                (total, char) => total + char.charCodeAt(0),
                0
            );

        const gcd = (a, b) => (b ? gcd(b, a % b) : a);

        // A step that is coprime with the pool size always
        // visits different items, so we never repeat one.
        let step = (7 % pool.length) || 1;

        while (pool.length > 1 && gcd(step, pool.length) !== 1) {
            step++;
        }

        const distractors = [];

        for (
            let i = 0;
            i < pool.length && distractors.length < 2;
            i++
        ) {
            const candidate = pool[(seed + i * step) % pool.length];

            if (
                candidate &&
                !distractors.some(
                    item => item.text === candidate.text
                )
            ) {
                distractors.push(candidate);
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
         * Stable order, rotated by the seed so the correct
         * answer is not always in the same position.
         */
        const score = text =>
            normalize(text)
                .split('')
                .reduce(
                    (sum, char) => sum + char.charCodeAt(0),
                    0
                );

        const ordered = options.sort(
            (a, b) => score(a.text) - score(b.text)
        );

        const shift = seed % ordered.length;

        return {
            question: `Which explanation best describes "${term.term}"?`,
            options: ordered
                .slice(shift)
                .concat(ordered.slice(0, shift))
        };
    }

    function knowledgeCheckHtml(term) {
        const question = getQuestion(term);

        if (question.options.length < 2) {
            return '';
        }

        /*
         * If this term's check was already answered (for
         * example the user then saved the term, which redraws
         * the page), draw it in its answered state.
         */
        const answered =
            ui.checkState &&
            normalize(ui.checkState.term) === normalize(term.term)
                ? ui.checkState
                : null;

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
                                class="gaze-dictionary-option ${
                                    answered
                                        ? option.correct
                                            ? 'correct'
                                            : answered.index === index
                                                ? 'wrong'
                                                : ''
                                        : ''
                                }"
                                data-action="answer-check"
                                data-index="${index}"
                                data-correct="${option.correct}"
                                ${answered ? 'disabled' : ''}
                            >
                                ${esc(option.text)}
                            </button>
                        `).join('')
                    }
                </div>

                <div
                    class="gaze-dictionary-check-result"
                    id="gazeDictionaryCheckResult"
                    ${
                        answered
                            ? `style="color: ${answered.correct ? '#168447' : '#a53d3d'}"`
                            : ''
                    }
                >${
                    answered
                        ? answered.correct
                            ? 'Correct. You understand the core idea.'
                            : 'Not quite. The correct explanation is highlighted above. Review the term and try again later.'
                        : ''
                }</div>

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

                                        ${explanationCardHtml(term, 'Definition', term.definition, !term.simpleExplanation)}

                    ${explanationCardHtml(term, 'In simple terms', term.simpleExplanation, true)}

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

                    ${taughtInHtml(term)}

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
        ui.checkState = null;
        ui.revealSimple = false;

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

        ui.checkState = {
            term: term.term,
            index: Number(button.dataset.index),
            correct
        };

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

        // Redraw so the gated card unlocks
        render();
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

            if (!target || !target.closest('.gaze-dictionary')) {
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

            if (action === 'open-lesson-from-term') {
                const learnUI = window.GazeLearnUI;

                if (
                    learnUI &&
                    typeof learnUI.openLesson === 'function'
                ) {
                    learnUI.openLesson(
                        target.dataset.track,
                        target.dataset.lesson
                    );

                    ui.returnTo = null;
                    ui.view = 'home';
                    ui.selectedTerm = null;
                }

                return;
            }

                        if (action === 'reveal-simple') {
                ui.revealSimple = true;
                render();
                return;
            }

            if (action === 'answer-check') {
                answerCheck(target);
                return;
            }
        });
        
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            const card = event.target;

            if (
                !card.classList ||
                !card.classList.contains('gaze-dictionary-card')
            ) {
                return;
            }

            event.preventDefault();

            openTerm(card.dataset.term);
        });
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.GazeDictionaryUI = {

        open: openDictionary,

        validate: validateData,

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
            return progressSnapshot();
        }
    };

    /* =====================================================
       INITIALIZE
       ===================================================== */

    function init() {
        injectStyles();
        bindGlobalEvents();
        validateData();
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
