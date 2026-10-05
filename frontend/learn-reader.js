/* ============================================
   GAZE LEARN — LESSON READER + KNOWLEDGE CHECK
   (Phase 3)

   Load AFTER learn.js:
   <script src="learn-content.js"></script>
   <script src="learn-progress.js"></script>
   <script src="learn.js"></script>
   <script src="learn-reader.js"></script>

   Opens when a ready lesson is tapped. It draws into the
   same #learnRoot as the Learn screens, and closing it
   returns to whichever screen you came from.

   Phase 3A: **bold** words that match a Dictionary term
   become tappable and open the Dictionary, with a
   "Back to lesson" button that returns to the same place.
   ============================================ */

(function () {

    'use strict';


    const ui = window.GazeLearnUI;
    const progress = window.GazeLearnProgress;

    if (!ui || !progress) {
        return;
    }


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

    // Safe text with **bold**
    const fmt = value =>
        esc(value).replace(
            /\*\*(.+?)\*\*/g,
            '<strong>$1</strong>'
        );

    // Like fmt(), but **bold** words matching a Dictionary term
    // become tappable. Each term links once per screen.
    let linkedThisScreen = new Set();

    function fmtLinked(value) {

        const dict = window.GazeDictionaryUI;

        const canLink =
            dict &&
            typeof dict.resolveTerm === 'function' &&
            typeof dict.openTerm === 'function';

        return esc(value).replace(
            /\*\*(.+?)\*\*/g,
            (m, inner) => {

                const name = canLink ? dict.resolveTerm(inner) : null;

                if (!name || linkedThisScreen.has(name)) {
                    return `<strong>${inner}</strong>`;
                }

                linkedThisScreen.add(name);

                return `<button type="button" class="rd-term" data-rd="term" data-term="${esc(name)}">${inner}</button>`;
            }
        );
    }

    // Phase 3B: Dictionary terms a lesson teaches, found from its
    // own **bold** words. Only real Dictionary matches, in the
    // order they appear, no duplicates, at most 6.
    function lessonTerms(lesson) {

        const dict = window.GazeDictionaryUI;

        if (!dict || typeof dict.resolveTerm !== 'function') {
            return [];
        }

        const found = [];

        (lesson.sections || []).forEach(section => {

            const texts = []
                .concat(section.body || [])
                .concat(section.bullets || [])
                .concat(section.example ? [section.example.text] : []);

            texts.forEach(text => {

                String(text || '').replace(
                    /\*\*(.+?)\*\*/g,
                    (m, inner) => {

                        const name = dict.resolveTerm(inner);

                        if (name && !found.includes(name)) {
                            found.push(name);
                        }

                        return m;
                    }
                );
            });
        });

        return found.slice(0, 6);
    }


    function exploreHtml() {

        const names = lessonTerms(rd.lesson);

        if (names.length === 0) {
            return '';
        }

        return `
            <div class="rd-explore">
                <p class="rd-explore-label">Explore these concepts</p>
                <div class="rd-chips">
                    ${names.map(name => `
                        <button type="button" class="rd-chip"
                            data-rd="term" data-term="${esc(name)}">${esc(name)}</button>
                    `).join('')}
                </div>
            </div>
        `;
    }


    function toast(message, type) {

        if (typeof showToast === 'function') {
            showToast(message, type || 'warning');
        }
    }


    /* ----------------------------------------
       STATE
       ---------------------------------------- */

    // null when no lesson is open
    let rd = null;

    // Set while the user is in the Calculator or Explorer
    // opened from a lesson's "Try it" button
    let returnTo = null;


    // A question the quiz can safely show
    function validQuestion(q) {

        return Boolean(
            q &&
            q.q &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            Number.isInteger(q.answer) &&
            q.answer >= 0 &&
            q.answer < q.options.length
        );
    }


    function validQuestions(lesson) {

        return lesson.check && Array.isArray(lesson.check.questions)
            ? lesson.check.questions.filter(validQuestion)
            : [];
    }


    function hasCheck(lesson) {

        return validQuestions(lesson).length > 0;
    }


    // How many questions each attempt asks
    function sessionSize(lesson) {

        const total = validQuestions(lesson).length;
        const size = Number(lesson.check.perSession);

        return Number.isFinite(size) && size > 0
            ? Math.min(size, total)
            : total;
    }


    // Copy a question with its answer options shuffled
    function shuffled(question) {

        const order = question.options.map((_, i) => i);

        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }

        return {
            id: question.id,
            q: question.q,
            explain: question.explain,
            options: order.map(i => question.options[i]),
            answer: order.indexOf(question.answer)
        };
    }


    function startQuiz() {

        rd.set = progress
            .drawQuestions(
                rd.lesson.id,
                validQuestions(rd.lesson),
                sessionSize(rd.lesson)
            )
            .map(shuffled);

        rd.q = 0;
        rd.picked = null;
        rd.score = 0;
        rd.passed = false;
    }


    function passMark(lesson) {

        const total = sessionSize(lesson);
        const mark = Number(lesson.check.passMark);

        return Number.isFinite(mark) && mark > 0
            ? Math.min(mark, total)
            : total;
    }


    /* ----------------------------------------
       STYLES
       ---------------------------------------- */

    function injectStyles() {

        if (byId('learnReaderStyles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'learnReaderStyles';

        style.textContent = `

            .rd-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 6px;
            }

            .rd-top .learn-back {
                margin-bottom: 0;
            }

            .rd-count {
                font-size: 12px;
                font-weight: 700;
                color: var(--text-secondary);
            }

            .rd-top-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .rd-mark {
                padding: 4px;
                border: none;
                background: none;
                color: var(--g1);
                font-size: 18px;
                cursor: pointer;
            }

            .rd-try {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                margin-top: 14px;
                padding: 12px;
                border: 2px solid var(--g1);
                border-radius: 12px;
                background: transparent;
                color: var(--g1);
                font-family: inherit;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }

            .learn-return {
                display: none;
                position: fixed;
                left: 50%;
                bottom: calc(96px + env(safe-area-inset-bottom, 0px));
                z-index: 1500;
                transform: translateX(-50%);
                padding: 11px 18px;
                border: none;
                border-radius: 999px;
                background: linear-gradient(135deg, #087F73, #126E9A);
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
                color: #fff;
                font-family: inherit;
                font-size: 13px;
                font-weight: 700;
                white-space: nowrap;
                cursor: pointer;
            }

            .learn-return.show {
                display: block;
            }

            .rd-bar {
                margin: 8px 0 14px;
            }

            .rd-lesson {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--text-secondary);
                margin: 0 0 10px;
            }

            .rd-card {
                background: var(--bg-card);
                border-radius: 16px;
                padding: 20px;
                box-shadow: var(--shadow-sm);
            }

            .rd-card h3 {
                font-size: 20px;
                font-weight: 700;
                line-height: 1.25;
                color: var(--text-primary);
                margin: 0 0 12px;
            }

            .rd-card p {
                font-size: 15px;
                line-height: 1.65;
                color: var(--text-primary);
                margin: 0 0 12px;
            }

            .rd-card ul {
                list-style: none;
                margin: 0 0 12px;
                padding: 0;
            }

            .rd-card li {
                position: relative;
                padding-left: 20px;
                margin-bottom: 10px;
                font-size: 15px;
                line-height: 1.6;
                color: var(--text-primary);
            }

            .rd-card li::before {
                content: "";
                position: absolute;
                left: 2px;
                top: 9px;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--g1), var(--g2));
            }

            .rd-example {
                margin-top: 4px;
                padding: 12px 14px;
                border-left: 3px solid var(--g1);
                border-radius: 0 12px 12px 0;
                background: rgba(128, 128, 128, 0.1);
            }

            .rd-card .rd-example p {
                font-size: 14px;
                margin: 0;
            }

            .rd-card .rd-example p.rd-example-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--g1);
                margin: 0 0 4px;
            }

            .rd-sources {
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid rgba(128, 128, 128, 0.25);
                font-size: 12px;
                opacity: 0.85;
            }

            .rd-card .rd-sources p {
                font-size: 12px;
                margin: 0 0 6px;
            }

            .rd-sources a {
                color: var(--g1);
                text-decoration: underline;
            }

            .rd-sources ul {
                margin: 4px 0 0;
                padding-left: 18px;
            }

            .rd-sources li {
                font-size: 12px;
                margin-bottom: 2px;
            }

            .rd-card,
            .rd-opt,
            .rd-feedback {
                overflow-wrap: anywhere;
            }

            .rd-opt {
                min-height: 48px;
            }

            @media (max-width: 360px) {

                .rd-card {
                    padding: 16px;
                }

                .rd-card h3 {
                    font-size: 18px;
                }

                .rd-opt {
                    padding: 12px;
                    gap: 10px;
                    font-size: 13px;
                }
            }

            .rd-actions {
                display: flex;
                gap: 10px;
                margin-top: 16px;
            }

            .rd-btn {
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 12px;
                font-family: inherit;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
            }

            .rd-btn.primary {
                color: #fff;
                background: linear-gradient(135deg, var(--g1), var(--g2));
            }

            .rd-btn.ghost {
                color: var(--text-primary);
                background: var(--bg-card);
                box-shadow: var(--shadow-sm);
            }

            .rd-opts {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 14px;
            }

            .rd-opt {
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 14px;
                border: 2px solid rgba(128, 128, 128, 0.25);
                border-radius: 14px;
                background: var(--bg-card);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 14px;
                font-weight: 600;
                line-height: 1.4;
                text-align: left;
                cursor: pointer;
            }

            .rd-opt-letter {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                flex-shrink: 0;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.15);
                font-size: 12px;
                font-weight: 700;
            }

            .rd-opt.is-correct {
                border-color: #00a651;
                background: rgba(0, 166, 81, 0.12);
            }

            .rd-opt.is-wrong {
                border-color: #d32f2f;
                background: rgba(211, 47, 47, 0.12);
            }

            .rd-opt.is-dim {
                opacity: 0.55;
            }

            .rd-feedback {
                margin-top: 14px;
                padding: 14px 16px;
                border-radius: 14px;
            }

            .rd-feedback.good {
                background: rgba(0, 166, 81, 0.12);
            }

            .rd-feedback.bad {
                background: rgba(211, 47, 47, 0.12);
            }

            .rd-feedback-title {
                margin: 0 0 4px;
                font-size: 14px;
                font-weight: 700;
                color: var(--text-primary);
            }

            .rd-feedback p {
                margin: 0;
                font-size: 13px;
                line-height: 1.55;
                color: var(--text-primary);
            }

            .rd-result {
                text-align: center;
                padding: 24px 18px;
            }

            .rd-result img {
                width: 140px;
                height: 140px;
                object-fit: contain;
            }

            .rd-result h3 {
                margin-top: 8px;
            }

            .rd-score {
                display: inline-block;
                margin: 4px 0 16px;
                padding: 6px 14px;
                border-radius: 999px;
                background: rgba(128, 128, 128, 0.15);
                font-size: 13px;
                font-weight: 700;
                color: var(--text-primary);
            }

            .rd-result .rd-actions {
                flex-direction: column;
            }

            /* Dictionary links inside lessons */

            .rd-card .rd-term {
                display: inline;
                padding: 0;
                border: none;
                border-bottom: 1.5px dotted var(--g1);
                background: none;
                font: inherit;
                font-weight: 700;
                color: var(--g1);
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }

            .rd-card .rd-hint {
                font-size: 12px;
                color: var(--text-secondary);
                margin: 4px 0 0;
            }

            /* Explore these concepts (Phase 3B) */

            .rd-explore {
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid rgba(128, 128, 128, 0.25);
            }

            .rd-card .rd-explore-label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--text-secondary);
                margin: 0 0 8px;
            }

            .rd-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .rd-result .rd-chips {
                justify-content: center;
                margin-bottom: 14px;
            }

            .rd-chip {
                padding: 8px 12px;
                border: 1.5px solid var(--g1);
                border-radius: 999px;
                background: transparent;
                color: var(--g1);
                font-family: inherit;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
            }
        `;

        document.head.appendChild(style);
    }


    /* ----------------------------------------
       DRAWING
       ---------------------------------------- */

    function stepInfo() {

        const sections = rd.lesson.sections.length;
        const total = sections + (hasCheck(rd.lesson) ? 1 : 0);

        let current;
        let label;

        if (rd.mode === 'section') {

            current = rd.step + 1;
            label = `Section ${current} of ${sections}`;

        } else if (rd.mode === 'quiz') {

            current = sections + 1;

            label =
                `Question ${rd.q + 1} of ${rd.set.length}`;

        } else {

            current = total;
            label = 'Result';
        }

        return {
            label,
            percent: Math.round((current / total) * 100)
        };
    }


    function headerHtml() {

        const info = stepInfo();

        return `
            <div class="rd-top">
                <button type="button" class="learn-back" data-rd="exit">‹ Back</button>
                <div class="rd-top-right">
                    <span class="rd-count">${esc(info.label)}</span>
                    <button type="button" class="rd-mark" data-rd="bookmark"
                        aria-label="${progress.isBookmarked(rd.lesson.id) ? 'Remove from saved' : 'Save lesson'}">
                        <i class="fa-${progress.isBookmarked(rd.lesson.id) ? 'solid' : 'regular'} fa-bookmark"></i>
                    </button>
                </div>
            </div>

            <div class="learn-bar rd-bar">
                <div class="learn-bar-fill" style="width: ${info.percent}%"></div>
            </div>

            <p class="rd-lesson">${esc(rd.lesson.title)}</p>
        `;
    }


    function sourcesHtml(lesson) {

        const attr = lesson.attribution;

        const links = (lesson.sources || []).filter(
            src => !(attr && src.url === attr.url)
        );

        if (!attr && links.length === 0) {
            return '';
        }

        const link = (url, text) =>
            `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;

        const credit = attr
            ? `<p>Source: ${esc(attr.by)}, ${
                  attr.url ? link(attr.url, attr.name) : esc(attr.name)
              }. Licensed ${esc(attr.license)}. Simplified and adapted for Gaze.</p>`
            : '';

        const further = links.length
            ? `<p>Further reading</p><ul>${links
                  .map(src => `<li>${link(src.url, src.label || src.url)}</li>`)
                  .join('')}</ul>`
            : '';

        return `<div class="rd-sources">${credit}${further}</div>`;
    }


    function sectionHtml() {

        linkedThisScreen = new Set();

        const lesson = rd.lesson;
        const section = lesson.sections[rd.step];
        const isLast = rd.step === lesson.sections.length - 1;

        const nextLabel =
            !isLast
                ? 'Next'
                : hasCheck(lesson)
                    ? 'Start quiz'
                    : 'Finish';

        return `
            <div class="rd-card">

                <h3>${esc(section.title)}</h3>

                ${(section.body || [])
                    .map(p => `<p>${fmtLinked(p)}</p>`)
                    .join('')}

                ${
                    Array.isArray(section.bullets) && section.bullets.length
                        ? `<ul>${section.bullets
                              .map(b => `<li>${fmtLinked(b)}</li>`)
                              .join('')}</ul>`
                        : ''
                }

                ${
                    section.example
                        ? `<div class="rd-example">
                               <p class="rd-example-label">${esc(section.example.label || 'Example')}</p>
                               <p>${fmtLinked(section.example.text)}</p>
                           </div>`
                        : ''
                }

                ${
                    section.tryIt && section.tryIt.target
                        ? `<button type="button" class="rd-try" data-rd="tryit">
                               <i class="fa-solid fa-flask"></i>
                               ${esc(section.tryIt.label || 'Try it')}
                           </button>`
                        : ''
                }

                ${
                    linkedThisScreen.size
                        ? '<p class="rd-hint">Tap an underlined word to see it in the Dictionary.</p>'
                        : ''
                }

                ${isLast ? exploreHtml() : ''}

                ${isLast ? sourcesHtml(lesson) : ''}

            </div>

            <div class="rd-actions">
                ${
                    rd.step > 0
                        ? '<button type="button" class="rd-btn ghost" data-rd="prev">Back</button>'
                        : ''
                }
                <button type="button" class="rd-btn primary" data-rd="next">${nextLabel}</button>
            </div>
        `;
    }


    function quizHtml() {

        const questions = rd.set;
        const question = questions[rd.q];
        const answered = rd.picked !== null;

        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

        const options = question.options.map((text, i) => {

            let state = '';

            if (answered) {

                if (i === question.answer) {
                    state = 'is-correct';
                } else if (i === rd.picked) {
                    state = 'is-wrong';
                } else {
                    state = 'is-dim';
                }
            }

            return `
                <button type="button" class="rd-opt ${state}"
                    data-rd="pick" data-i="${i}" ${answered ? 'disabled' : ''}>
                    <span class="rd-opt-letter">${letters[i] || i + 1}</span>
                    <span>${esc(text)}</span>
                </button>
            `;
        }).join('');

        const correct = rd.picked === question.answer;

        const isLastQuestion = rd.q === questions.length - 1;

        return `
            <div class="rd-card">
                <h3>${esc(question.q)}</h3>
            </div>

            <div class="rd-opts">${options}</div>

            ${
                answered
                    ? `<div class="rd-feedback ${correct ? 'good' : 'bad'}">
                           <p class="rd-feedback-title">${correct ? 'Correct!' : 'Not quite'}</p>
                           <p>${fmt(question.explain || '')}</p>
                       </div>

                       <div class="rd-actions">
                           <button type="button" class="rd-btn primary" data-rd="qnext">
                               ${isLastQuestion ? 'See result' : 'Next question'}
                           </button>
                       </div>`
                    : ''
            }
        `;
    }


    function nextReadyLesson() {

        const lessons = rd.track.lessons || [];
        const index = lessons.findIndex(l => l.id === rd.lesson.id);

        return lessons
            .slice(index + 1)
            .find(l => l.status === 'ready' && l.sections) || null;
    }


    function resultHtml() {

        const total = rd.set.length;
        const mark = passMark(rd.lesson);

        const owl =
            '<img src="owl_x5f_waving.svg" alt="" ' +
            'onerror="this.style.display=\'none\'">';

        if (rd.passed) {

            const next = nextReadyLesson();

            return `
                <div class="rd-card rd-result">
                    ${owl}
                    <h3>Lesson complete!</h3>
                    <span class="rd-score">${rd.score} of ${total} correct</span>

                    ${exploreHtml()}

                    <div class="rd-actions">
                        ${
                            next
                                ? '<button type="button" class="rd-btn primary" data-rd="nextlesson">Next lesson</button>'
                                : ''
                        }
                        <button type="button" class="rd-btn ${next ? 'ghost' : 'primary'}" data-rd="totrack">Back to track</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="rd-card rd-result">
                ${owl}
                <h3>Not quite yet</h3>
                <p>You need ${mark} correct to pass. Your next try brings new questions.</p>
                <span class="rd-score">${rd.score} of ${total} correct</span>

                <div class="rd-actions">
                    <button type="button" class="rd-btn primary" data-rd="retry">Try again</button>
                    <button type="button" class="rd-btn ghost" data-rd="review">Review the lesson</button>
                </div>
            </div>
        `;
    }


    function draw() {

        const root = byId('learnRoot');

        if (!root || !rd) {
            return;
        }

        const body =
            rd.mode === 'section'
                ? sectionHtml()
                : rd.mode === 'quiz'
                    ? quizHtml()
                    : resultHtml();

        root.innerHTML = `
            <div class="rd learn-theme-${esc(rd.track.theme)}">
                ${headerHtml()}
                ${body}
            </div>
        `;
    }


    /* ----------------------------------------
       ACTIONS
       ---------------------------------------- */

    function open(track, lesson) {

        if (
            !Array.isArray(lesson.sections) ||
            lesson.sections.length === 0
        ) {
            toast('This lesson has no content yet');
            return;
        }

        injectStyles();

        // Resume where you left off (unless already completed)
        const last = progress.getLast();

        let start = 0;

        if (
            last &&
            last.lessonId === lesson.id &&
            !progress.isCompleted(lesson.id)
        ) {
            start = Math.min(
                Math.max(Number(last.section) || 0, 0),
                lesson.sections.length - 1
            );
        }

        rd = {
            track,
            lesson,
            mode: 'section',
            step: start,
            set: [],
            q: 0,
            picked: null,
            score: 0,
            passed: false,
            scrollBefore: window.scrollY || 0
        };

        progress.setLast(track.id, lesson.id, start);

        draw();
        window.scrollTo(0, 0);
    }


    function goTo(mode) {

        rd.mode = mode;

        draw();
        window.scrollTo(0, 0);
    }


    function next() {

        const lastIndex = rd.lesson.sections.length - 1;

        if (rd.step < lastIndex) {

            rd.step += 1;
            progress.setLast(rd.track.id, rd.lesson.id, rd.step);
            goTo('section');
            return;
        }

        if (hasCheck(rd.lesson)) {

            startQuiz();
            goTo('quiz');
            return;
        }

        // Fails gracefully if a lesson has no quiz yet
        progress.markCompleted(rd.lesson.id);
        toast('Lesson complete', 'success');
        exit();
    }


    function prev() {

        if (rd.step > 0) {

            rd.step -= 1;
            progress.setLast(rd.track.id, rd.lesson.id, rd.step);
            goTo('section');
        }
    }


    function pick(index) {

        if (rd.picked !== null) {
            return;
        }

        const question = rd.set[rd.q];

        rd.picked = index;
        progress.markSeen(rd.lesson.id, question.id);

        if (index === question.answer) {
            rd.score += 1;
        }

        draw();
    }


    function nextQuestion() {

        const total = rd.set.length;

        rd.q += 1;
        rd.picked = null;

        if (rd.q >= total) {

            rd.passed = rd.score >= passMark(rd.lesson);

            if (rd.passed) {
                progress.markCompleted(rd.lesson.id);
            }

            goTo('result');
            return;
        }

        draw();
    }


    function retry() {

        startQuiz();

        goTo('quiz');
    }


    function review() {

        rd.step = 0;
        rd.passed = false;

        progress.setLast(rd.track.id, rd.lesson.id, 0);

        goTo('section');
    }


    // Open a Dictionary term from a lesson. "Back to lesson"
    // redraws the same screen at the same scroll position.
    function openDictionaryTerm(name) {

        const dict = window.GazeDictionaryUI;

        if (!dict || !rd) {
            return;
        }

        const resumeAt = window.scrollY || 0;

        dict.openTerm(name, {
            label: 'Back to lesson',
            onBack: function () {

                if (!rd) {
                    ui.render();
                    return;
                }

                draw();
                window.scrollTo(0, resumeAt);
            }
        });
    }


    function toggleBookmark() {

        const saved = progress.toggleBookmark(rd.lesson.id);

        toast(
            saved ? 'Lesson saved' : 'Removed from saved',
            'success'
        );

        draw();
    }


    // Fills in the Calculator or Explorer from the lesson's example
    function applyPrefill(target, prefill) {

        if (!prefill) {
            return;
        }

        const fire = (el, type) => {
            if (el) {
                el.dispatchEvent(new Event(type, { bubbles: true }));
            }
        };

        if (target === 'calculator') {

            if (prefill.market) {

                const btn = document.querySelector(
                    `[data-calc-market="${prefill.market}"]`
                );

                if (btn) {
                    btn.click();
                }
            }

            [
                ['calcShares', 'shares'],
                ['calcBuy', 'buy'],
                ['calcSell', 'sell'],
                ['calcFee', 'fee']
            ].forEach(([id, key]) => {

                const el = byId(id);

                if (el && prefill[key] !== undefined) {
                    el.value = prefill[key];
                    fire(el, 'input');
                }
            });

        } else if (target === 'explorer') {

            const market = byId('exMarket');

            if (market && prefill.market) {
                market.value = prefill.market;
                fire(market, 'change');
            }

            const search = byId('exSearch');

            if (search && prefill.search !== undefined) {
                search.value = prefill.search;
                fire(search, 'input');
            }
        }
    }


    function tryIt() {

        const section = rd.lesson.sections[rd.step];
        const tool = section && section.tryIt;

        if (!tool || typeof switchTab !== 'function') {
            return;
        }

        // Remember exactly where to come back to
        returnTo = {
            trackId: rd.track.id,
            lessonId: rd.lesson.id,
            step: rd.step
        };

        progress.setLast(rd.track.id, rd.lesson.id, rd.step);

        switchTab(tool.target);
        applyPrefill(tool.target, tool.prefill);

        updateReturnButton(tool.target);
        window.scrollTo(0, 0);
    }


    function backToLesson() {

        returnTo = null;
        updateReturnButton('study');

        if (typeof switchTab === 'function') {
            switchTab('study');
        }

        window.scrollTo(0, 0);
    }


    function updateReturnButton(tabName) {

        const button = byId('learnReturn');

        if (!button) {
            return;
        }

        const inTool =
            tabName === 'calculator' ||
            tabName === 'explorer';

        // Leaving the tools any other way clears the shortcut
        if (!inTool) {
            returnTo = null;
        }

        button.classList.toggle('show', Boolean(returnTo && inTool));
    }


    // Back arrow: return to the screen you came from
    function exit() {

        const scroll = rd ? rd.scrollBefore : 0;

        rd = null;

        ui.render();
        window.scrollTo(0, scroll);
    }


    function toTrack() {

        const trackId = rd.track.id;

        rd = null;

        ui.openTrack(trackId);
    }


    function nextLesson() {

        const track = rd.track;
        const lesson = nextReadyLesson();

        if (lesson) {
            open(track, lesson);
        } else {
            toTrack();
        }
    }


    /* ----------------------------------------
       START
       ---------------------------------------- */

    ui.onOpenLesson = open;


    // Track which tab is open so the "Back to lesson" button
    // only shows inside the Calculator and Explorer
    const originalSwitchTab = window.switchTab;

    if (typeof originalSwitchTab === 'function') {

        window.switchTab = function (tabName) {

            const result =
                originalSwitchTab.apply(this, arguments);

            updateReturnButton(tabName);

            return result;
        };
    }


    document.addEventListener('DOMContentLoaded', () => {

        const root = byId('learnRoot');

        if (!root) {
            return;
        }

        injectStyles();

        if (!byId('learnReturn')) {

            const back = document.createElement('button');

            back.type = 'button';
            back.id = 'learnReturn';
            back.className = 'learn-return';
            back.textContent = '‹ Back to lesson';
            back.addEventListener('click', backToLesson);

            document.body.appendChild(back);
        }

        root.addEventListener('click', e => {

            const el = e.target.closest('[data-rd]');

            if (!el || !rd) {
                return;
            }

            switch (el.dataset.rd) {

                case 'exit':
                    exit();
                    break;

                case 'next':
                    next();
                    break;

                case 'prev':
                    prev();
                    break;

                case 'pick':
                    pick(Number(el.dataset.i));
                    break;

                case 'qnext':
                    nextQuestion();
                    break;

                case 'retry':
                    retry();
                    break;

                case 'review':
                    review();
                    break;

                case 'totrack':
                    toTrack();
                    break;

                case 'nextlesson':
                    nextLesson();
                    break;

                case 'bookmark':
                    toggleBookmark();
                    break;

                case 'tryit':
                    tryIt();
                    break;

                case 'term':
                    openDictionaryTerm(el.dataset.term);
                    break;
            }
        });
    });

})();
