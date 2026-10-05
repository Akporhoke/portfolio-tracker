/* ============================================
   GAZE LEARN — SCREENS (Phases 1 and 2)

   Load AFTER app.js and the two data files:
   <script src="learn-content.js"></script>
   <script src="learn-progress.js"></script>
   <script src="learn.js"></script>

   Draws into <div id="learnRoot"> inside the Study tab.
   Screens: Learn home, Track (lesson list).
   The lesson reader arrives in Phase 3.
   ============================================ */

(function () {

    'use strict';


    const content = window.GAZE_LEARN || { tracks: [] };
    const progress = window.GazeLearnProgress;

    const byId = id => document.getElementById(id);

    const esc = value =>
        String(value == null ? '' : value).replace(
            /[&<>"']/g,
            c => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[c])
        );


    // Where the user is inside Learn
    const ui = {
        view: 'home',       // 'home' or 'track'
        trackId: null,
        homeScroll: 0
    };


    function toast(message, type) {

        if (typeof showToast === 'function') {
            showToast(message, type || 'warning');
        }
    }


    /* ----------------------------------------
       STYLES (use Gaze colours and theme variables)
       ---------------------------------------- */

    function injectStyles() {

        if (byId('learnStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'learnStyles';

        style.textContent = `

            /* Hide the portfolio cards on the Learn screens */
            .container:has(#studyTab.active)
            :is(.quick-stats, .portfolio-card, .mini-cards) {
                display: none;
            }

            .learn-theme-teal   { --g1: #087F73; --g2: #126E9A; }
            .learn-theme-blue   { --g1: #1E4F9A; --g2: #2D73C5; }
            .learn-theme-green  { --g1: #2E7D32; --g2: #43A047; }
            .learn-theme-mauve  { --g1: #9A6070; --g2: #C0809A; }
            .learn-theme-amber  { --g1: #B26A00; --g2: #E8A23A; }
            .learn-theme-indigo { --g1: #4B4FA8; --g2: #667eea; }

            .learn-head {
                margin-bottom: 16px;
            }

            .learn-title {
                font-size: 22px;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0;
            }

            .learn-sub {
                font-size: 13px;
                color: var(--text-secondary);
                margin: 4px 0 0;
            }

            .learn-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-secondary);
                margin: 20px 0 8px 2px;
            }

            /* Hero card (same look as the Total Portfolio card) */
            .learn-hero {
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 20px;
                margin-bottom: 14px;
                border-radius: 16px;
                color: #fff;
                background: linear-gradient(
                    120deg,
                    #043F35 0%,
                    #087F73 42%,
                    #126E9A 72%,
                    #1E4F9A 100%
                );
                box-shadow: 0 12px 30px rgba(8, 80, 100, 0.16);
            }

            .learn-hero.is-track {
                background: linear-gradient(135deg, var(--g1), var(--g2));
            }

            .learn-hero-body {
                flex: 1;
                min-width: 0;
            }

            .learn-hero-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.7);
                margin: 0 0 6px;
            }

            .learn-hero-title {
                font-size: 20px;
                font-weight: 700;
                line-height: 1.2;
                margin: 0;
            }

            .learn-hero-text {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.8);
                margin: 6px 0 0;
            }

            .learn-hero-btn {
                margin-top: 14px;
                padding: 10px 16px;
                border: none;
                border-radius: 10px;
                background: #fff;
                color: #087F73;
                font-family: inherit;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
            }

            .learn-hero img {
                width: 84px;
                height: 84px;
                object-fit: contain;
                flex-shrink: 0;
            }

            .learn-hero .learn-bar {
                background: rgba(255, 255, 255, 0.25);
                margin-top: 14px;
            }

            .learn-hero .learn-bar-fill {
                background: #fff;
            }

            /* Overall progress */
            .learn-summary {
                background: var(--bg-card);
                border-radius: 16px;
                padding: 14px 16px;
                box-shadow: var(--shadow-sm);
            }

            .learn-summary-top {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 10px;
            }

            .learn-summary-top span:last-child {
                color: var(--text-secondary);
                font-weight: 500;
            }

            /* Progress bar */
            .learn-bar {
                height: 6px;
                border-radius: 999px;
                background: rgba(128, 128, 128, 0.22);
                overflow: hidden;
            }

            .learn-bar-fill {
                height: 100%;
                border-radius: inherit;
                background: linear-gradient(90deg, var(--g1, #087F73), var(--g2, #126E9A));
                transition: width 0.4s ease;
            }

            /* Track cards */
            .learn-tracks,
            .learn-lessons {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .learn-track,
            .learn-lesson {
                display: flex;
                align-items: center;
                gap: 14px;
                width: 100%;
                padding: 14px;
                border: none;
                border-radius: 16px;
                background: var(--bg-card);
                box-shadow: var(--shadow-sm);
                color: var(--text-primary);
                font-family: inherit;
                text-align: left;
                cursor: pointer;
                transition: transform 0.15s ease;
                -webkit-tap-highlight-color: transparent;
            }

            .learn-track:active,
            .learn-lesson:active {
                transform: scale(0.99);
            }

            .learn-track.is-soon,
            .learn-lesson.is-soon {
                opacity: 0.6;
            }

            .learn-track-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 46px;
                height: 46px;
                flex-shrink: 0;
                border-radius: 14px;
                background: linear-gradient(135deg, var(--g1), var(--g2));
                color: #fff;
                font-size: 19px;
            }

            .learn-track-body,
            .learn-lesson-body {
                flex: 1;
                min-width: 0;
            }

            .learn-track-title,
            .learn-lesson-title {
                font-size: 15px;
                font-weight: 600;
                margin: 0;
            }

            .learn-track-sub {
                font-size: 12px;
                color: var(--text-secondary);
                margin: 3px 0 0;
            }

            .learn-track-meta,
            .learn-lesson-meta {
                font-size: 11px;
                color: var(--text-secondary);
                margin: 6px 0 0;
            }

            .learn-track .learn-bar {
                margin-top: 10px;
            }

            .learn-chip {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 999px;
                background: rgba(128, 128, 128, 0.15);
                color: var(--text-secondary);
                font-size: 10px;
                font-weight: 700;
                vertical-align: middle;
                margin-left: 6px;
                white-space: nowrap;
            }

            .learn-chip.is-done {
                background: rgba(0, 166, 81, 0.15);
                color: #00a651;
            }

            .learn-chevron {
                color: var(--text-secondary);
                font-size: 12px;
                flex-shrink: 0;
            }

            /* Lesson rows */
            .learn-lesson-num {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 34px;
                height: 34px;
                flex-shrink: 0;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.15);
                color: var(--text-secondary);
                font-size: 13px;
                font-weight: 700;
            }

            .learn-lesson.is-done .learn-lesson-num {
                background: rgba(0, 166, 81, 0.15);
                color: #00a651;
            }

            .learn-saved-mark {
                color: var(--g1, #087F73);
                font-size: 11px;
                margin-left: 6px;
            }

            .learn-lesson .learn-saved-num {
                background: linear-gradient(135deg, var(--g1), var(--g2));
                color: #fff;
                font-size: 13px;
            }

            .learn-back {
                background: none;
                border: none;
                padding: 0;
                margin-bottom: 12px;
                font-family: inherit;
                font-size: 14px;
                font-weight: 600;
                color: var(--primary);
                cursor: pointer;
            }
        `;

        document.head.appendChild(style);
    }


    /* ----------------------------------------
       HELPERS
       ---------------------------------------- */

    function findTrack(trackId) {

        return content.tracks.find(t => t.id === trackId) || null;
    }


    function findLesson(track, lessonId) {

        return (track.lessons || []).find(l => l.id === lessonId) || null;
    }


    function readyLessons(track) {

        return (track.lessons || []).filter(
            l => l.status === 'ready'
        );
    }


    // The lesson the hero card should offer
    function pickTarget() {

        const last = progress.getLast();

        if (last) {

            const track = findTrack(last.trackId);
            const lesson = track && findLesson(track, last.lessonId);

            if (
                lesson &&
                lesson.status === 'ready' &&
                !progress.isCompleted(lesson.id)
            ) {
                return {
                    kind: 'continue',
                    track,
                    lesson,
                    section: Number(last.section) || 0
                };
            }
        }

        for (const track of content.tracks) {

            const next = readyLessons(track).find(
                l => !progress.isCompleted(l.id)
            );

            if (next) {
                return { kind: 'start', track, lesson: next };
            }
        }

        return { kind: 'none' };
    }


    function trackMeta(track, p) {

        if (p.total > 0) {
            return `${p.done} of ${p.total} lessons`;
        }

        if (p.planned > 0) {
            return `${p.planned} lessons • coming soon`;
        }

        return 'Coming soon';
    }


    /* ----------------------------------------
       HOME SCREEN
       ---------------------------------------- */

    function heroHtml() {

        const target = pickTarget();

        const owl =
            '<img src="owl_x5f_waving.svg" alt="" ' +
            'onerror="this.style.display=\'none\'">';

        if (target.kind === 'none') {

            const firstWithLessons = content.tracks.find(
                t => (t.lessons || []).length > 0
            );

            return `
                <div class="learn-hero">
                    <div class="learn-hero-body">
                        <p class="learn-hero-label">Welcome</p>
                        <p class="learn-hero-title">Start learning to invest</p>
                        <p class="learn-hero-text">
                            Short lessons are on the way. Take a look at what is planned.
                        </p>
                        ${
                            firstWithLessons
                                ? `<button type="button" class="learn-hero-btn"
                                       data-action="open-track"
                                       data-track="${esc(firstWithLessons.id)}">
                                       See ${esc(firstWithLessons.title)}
                                   </button>`
                                : ''
                        }
                    </div>
                    ${owl}
                </div>
            `;
        }

        const label =
            target.kind === 'continue'
                ? 'Continue learning'
                : 'Start here';

        return `
            <div class="learn-hero">
                <div class="learn-hero-body">
                    <p class="learn-hero-label">${label}</p>
                    <p class="learn-hero-title">${esc(target.lesson.title)}</p>
                    <p class="learn-hero-text">
                        ${esc(target.track.title)} • ${
                            target.kind === 'continue' &&
                            Array.isArray(target.lesson.sections)
                                ? `Section ${Math.min(target.section + 1, target.lesson.sections.length)} of ${target.lesson.sections.length}`
                                : `${esc(target.lesson.minutes)} min`
                        }
                    </p>
                    <button type="button" class="learn-hero-btn"
                        data-action="open-lesson"
                        data-track="${esc(target.track.id)}"
                        data-lesson="${esc(target.lesson.id)}">
                        ${target.kind === 'continue' ? 'Continue' : 'Start lesson'}
                    </button>
                </div>
                ${owl}
            </div>
        `;
    }


    function summaryHtml() {

        const o = progress.overallProgress(content.tracks);

        if (o.total === 0) {
            return '';
        }

        return `
            <div class="learn-summary">
                <div class="learn-summary-top">
                    <span>Your progress</span>
                    <span>${o.done} of ${o.total} lessons</span>
                </div>
                <div class="learn-bar">
                    <div class="learn-bar-fill" style="width: ${o.percent}%"></div>
                </div>
            </div>
        `;
    }


    function trackCardHtml(track) {

        const p = progress.trackProgress(track);
        const isSoon = p.planned === 0;

        return `
            <button type="button"
                class="learn-track learn-theme-${esc(track.theme)} ${isSoon ? 'is-soon' : ''}"
                data-action="${isSoon ? 'soon' : 'open-track'}"
                data-track="${esc(track.id)}">

                <div class="learn-track-icon">
                    <i class="fa-solid ${esc(track.icon)}"></i>
                </div>

                <div class="learn-track-body">
                    <p class="learn-track-title">
                        ${esc(track.title)}
                        <span class="learn-chip">${esc(track.level)}</span>
                    </p>
                    <p class="learn-track-sub">${esc(track.summary)}</p>

                    ${
                        p.total > 0
                            ? `<div class="learn-bar">
                                   <div class="learn-bar-fill" style="width: ${p.percent}%"></div>
                               </div>`
                            : ''
                    }

                    <p class="learn-track-meta">${esc(trackMeta(track, p))}</p>
                </div>

                <i class="fa-solid fa-chevron-right learn-chevron"></i>
            </button>
        `;
    }


    function savedHtml() {

        const items = progress.getBookmarks()
            .map(id => {

                for (const track of content.tracks) {

                    const lesson = findLesson(track, id);

                    if (lesson) {
                        return { track, lesson };
                    }
                }

                return null;
            })
            .filter(Boolean);

        if (items.length === 0) {
            return '';
        }

        return `
            <p class="learn-label">Saved lessons</p>

            <div class="learn-lessons">
                ${items.map(({ track, lesson }) => `
                    <button type="button"
                        class="learn-lesson learn-theme-${esc(track.theme)} ${lesson.status === 'ready' ? '' : 'is-soon'}"
                        data-action="open-lesson"
                        data-track="${esc(track.id)}"
                        data-lesson="${esc(lesson.id)}">

                        <div class="learn-lesson-num learn-saved-num">
                            <i class="fa-solid fa-bookmark"></i>
                        </div>

                        <div class="learn-lesson-body">
                            <p class="learn-lesson-title">${esc(lesson.title)}</p>
                            <p class="learn-lesson-meta">${esc(track.title)} • ${esc(lesson.minutes)} min</p>
                        </div>

                        <i class="fa-solid fa-chevron-right learn-chevron"></i>
                    </button>
                `).join('')}
            </div>
        `;
    }


    function renderHome() {

        return `
            <div class="learn-head">
                <h2 class="learn-title">Learn</h2>
                <p class="learn-sub">Build your investing knowledge, one short lesson at a time.</p>
            </div>

            ${heroHtml()}
            ${summaryHtml()}

            <p class="learn-label">Tracks</p>

            <div class="learn-tracks">
                ${content.tracks.map(trackCardHtml).join('')}
            </div>

            ${savedHtml()}
        `;
    }


    /* ----------------------------------------
       TRACK SCREEN
       ---------------------------------------- */

    function lessonRowHtml(track, lesson, index) {

        const done = progress.isCompleted(lesson.id);
        const ready = lesson.status === 'ready';

        const right =
            done
                ? '<span class="learn-chip is-done">Done</span>'
                : ready
                    ? '<i class="fa-solid fa-chevron-right learn-chevron"></i>'
                    : '<span class="learn-chip">Soon</span>';

        return `
            <button type="button"
                class="learn-lesson ${done ? 'is-done' : ''} ${ready ? '' : 'is-soon'}"
                data-action="open-lesson"
                data-track="${esc(track.id)}"
                data-lesson="${esc(lesson.id)}">

                <div class="learn-lesson-num">
                    ${done ? '<i class="fa-solid fa-check"></i>' : index + 1}
                </div>

                <div class="learn-lesson-body">
                    <p class="learn-lesson-title">
                        ${esc(lesson.title)}
                        ${
                            progress.isBookmarked(lesson.id)
                                ? '<i class="fa-solid fa-bookmark learn-saved-mark"></i>'
                                : ''
                        }
                    </p>
                    <p class="learn-lesson-meta">${esc(lesson.minutes)} min read</p>
                </div>

                ${right}
            </button>
        `;
    }


    function renderTrack(track) {

        const p = progress.trackProgress(track);

        return `
            <button type="button" class="learn-back" data-action="back">‹ Back</button>

            <div class="learn-hero is-track learn-theme-${esc(track.theme)}">
                <div class="learn-hero-body">
                    <p class="learn-hero-label">${esc(track.level)}</p>
                    <p class="learn-hero-title">${esc(track.title)}</p>
                    <p class="learn-hero-text">${esc(track.summary)}</p>

                    ${
                        p.total > 0
                            ? `<div class="learn-bar">
                                   <div class="learn-bar-fill" style="width: ${p.percent}%"></div>
                               </div>
                               <p class="learn-hero-text">${p.done} of ${p.total} lessons done</p>`
                            : '<p class="learn-hero-text">Lessons are coming soon.</p>'
                    }
                </div>
            </div>

            <p class="learn-label">Lessons</p>

            <div class="learn-lessons">
                ${(track.lessons || [])
                    .map((lesson, i) => lessonRowHtml(track, lesson, i))
                    .join('')}
            </div>
        `;
    }


    /* ----------------------------------------
       NAVIGATION
       ---------------------------------------- */

    function render() {

        const root = byId('learnRoot');

        if (!root) {
            return;
        }

        const track =
            ui.view === 'track'
                ? findTrack(ui.trackId)
                : null;

        // Missing content fails gracefully: go back home
        if (ui.view === 'track' && !track) {
            ui.view = 'home';
            ui.trackId = null;
        }

        root.innerHTML =
            track
                ? renderTrack(track)
                : renderHome();
    }


    function openTrack(trackId) {

        if (!findTrack(trackId)) {
            toast('That track is not available yet');
            return;
        }

        ui.homeScroll = window.scrollY || 0;
        ui.view = 'track';
        ui.trackId = trackId;

        render();
        window.scrollTo(0, 0);
    }


    function backHome() {

        ui.view = 'home';
        ui.trackId = null;

        render();
        window.scrollTo(0, ui.homeScroll || 0);
    }


    function openLesson(trackId, lessonId) {

        const track = findTrack(trackId);
        const lesson = track && findLesson(track, lessonId);

        if (!lesson) {
            toast('That lesson is not available');
            return;
        }

        if (lesson.status !== 'ready') {
            toast('This lesson is coming soon');
            return;
        }

        // Phase 3 plugs the reader in here
        if (typeof api.onOpenLesson === 'function') {
            api.onOpenLesson(track, lesson);
            return;
        }

        toast('The lesson reader arrives in the next update');
    }


    const api = {
        render,
        openTrack,
        openLesson,
        onOpenLesson: null
    };

    window.GazeLearnUI = api;


    /* ----------------------------------------
       START
       ---------------------------------------- */

    document.addEventListener('DOMContentLoaded', () => {

        const root = byId('learnRoot');

        if (!root || !progress) {
            return;
        }

        injectStyles();

        root.addEventListener('click', e => {

            const el = e.target.closest('[data-action]');

            if (!el) {
                return;
            }

            switch (el.dataset.action) {

                case 'open-track':
                    openTrack(el.dataset.track);
                    break;

                case 'open-lesson':
                    openLesson(el.dataset.track, el.dataset.lesson);
                    break;

                case 'back':
                    backHome();
                    break;

                case 'soon':
                    toast('This track is coming soon');
                    break;
            }
        });

        render();
    });

})();
