/* ============================================
   QUICK STATS: COLORS + COUNT-UP
   ============================================
   Load this AFTER app.js:

       <script src="app.js"></script>
       <script src="quick-stats.js"></script>

   Because it loads later, the updateQuickStats() below replaces
   the one in app.js, so app.js itself does not need to change.
   ============================================ */


// ------------------------------------------------
// Colors for Watching / Held / Sold
// (matched to the dot colors already in style.css)
// ------------------------------------------------

(function addQuickStatsStyles() {

    if (document.getElementById('quickStatsColorStyles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'quickStatsColorStyles';

    // The dividers occupy positions 2 and 4, so the stats are 1, 3 and 5
    style.textContent = `
        .quick-stats .stat:nth-child(1) .stat-label,
        .quick-stats .stat:nth-child(1) .stat-number {
            color: #087F73;
        }

        .quick-stats .stat:nth-child(3) .stat-label,
        .quick-stats .stat:nth-child(3) .stat-number {
            color: #1E4F9A;
        }

        .quick-stats .stat:nth-child(5) .stat-label,
        .quick-stats .stat:nth-child(5) .stat-number {
            color: #9A6070;
        }

        .quick-stats .stat-label {
            font-weight: 700;
        }
    `;

    document.head.appendChild(style);
})();


// ------------------------------------------------
// Count-up animation (same ease-out as the portfolio value)
// ------------------------------------------------

function animateCount(element, targetValue, duration = 900) {

    if (!element) {
        return;
    }

    const endValue =
        Math.max(0, Math.round(Number(targetValue) || 0));

    // Where the last animation finished (0 on first load)
    let startValue =
        Number(element.dataset.value) || 0;

    // If an animation is still running, continue from what is on screen
    if (element._countFrame) {
        cancelAnimationFrame(element._countFrame);
        element._countFrame = null;
        startValue = Number(element.textContent) || 0;
    }

    // Nothing changed: show the value, no animation
    if (startValue === endValue) {
        element.textContent = endValue;
        element.dataset.value = endValue;
        return;
    }

    const startTime = performance.now();

    function update(now) {

        const progress =
            Math.min((now - startTime) / duration, 1);

        const eased =
            1 - Math.pow(1 - progress, 3);

        element.textContent =
            Math.round(startValue + (endValue - startValue) * eased);

        if (progress < 1) {

            element._countFrame =
                requestAnimationFrame(update);

        } else {

            element.textContent = endValue;
            element.dataset.value = endValue;
            element._countFrame = null;
        }
    }

    element._countFrame = requestAnimationFrame(update);
}


// ------------------------------------------------
// Replaces updateQuickStats() from app.js
// ------------------------------------------------

function updateQuickStats() {

    animateCount(
        document.getElementById('statWatching'),
        state.watchlist.stocks?.length || 0
    );

    animateCount(
        document.getElementById('statHeld'),
        state.portfolio.stocks?.length || 0
    );

    animateCount(
        document.getElementById('statSold'),
        state.sold.stocks?.length || 0
    );
}


// ------------------------------------------------
// Top Performer: hide the panel when there is nothing to show
// ------------------------------------------------
//
// app.js writes a dash into the ticker when there are no valid
// holdings. This watches that text and hides the whole panel
// while it is empty, then shows it again as soon as a real
// ticker appears.

(function setupTopPerformerVisibility() {

    const EM_DASH = '\u2014';

    function refresh() {

        const panel =
            document.querySelector('.portfolio-right');

        const ticker =
            document.getElementById('topPerformerTicker');

        if (!panel || !ticker) {
            return;
        }

        const text = ticker.textContent.trim();

        // Empty = no text yet, or the dash app.js uses for "no holdings"
        const isEmpty =
            text === '' ||
            text === EM_DASH ||
            text === '-';

        panel.style.display =
            isEmpty ? 'none' : '';
    }

    function start() {

        const ticker =
            document.getElementById('topPerformerTicker');

        if (!ticker) {
            return;
        }

        // Re-check whenever app.js changes the ticker text
        new MutationObserver(refresh).observe(
            ticker,
            {
                childList: true,
                characterData: true,
                subtree: true
            }
        );

        refresh();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();