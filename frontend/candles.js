/* ============================================
   GAZE CANDLESTICKS  (load AFTER app.js)
   Overrides loadWatchlistChart and adds a
   Line | Candles switch to each watchlist card.
   ============================================ */

(function () {

    /* ---------- styles (injected once) ---------- */
    function ensureCandleStyles() {
        if (document.getElementById('candleStyles')) return;

        const style = document.createElement('style');
        style.id = 'candleStyles';
        style.textContent = `
            .chart-mode-bar { display:flex; gap:6px; margin:8px 0; }
            .chart-mode-btn {
                border:1px solid rgba(128,128,128,.35);
                background:transparent; color:inherit;
                font-size:12px; padding:4px 12px;
                border-radius:999px; cursor:pointer;
            }
            .chart-mode-btn.active { background:#6366f1; border-color:#6366f1; color:#fff; }
            .candle-info { font-size:12px; min-height:18px; margin-bottom:4px; color:#999; }
            .candle-svg { width:100%; height:auto; display:block; touch-action:pan-y; }
            .candle-up   { fill:#10b981; stroke:#10b981; }
            .candle-down { fill:#ef4444; stroke:#ef4444; }
            .candle-wick { stroke-width:1.5; }
            .candle-close-only { stroke:#9ca3af; stroke-width:2; }
            .candle-grid { stroke:rgba(128,128,128,.25); stroke-width:1; }
            .candle-label { font-size:10px; fill:#999; }
            .candle-guide { stroke:#6366f1; stroke-width:1; stroke-dasharray:3 3; }
        `;
        document.head.appendChild(style);
    }

    /* ---------- data helpers ---------- */

    // A record counts as real OHLC only if all four prices are valid
    // AND it is not a flat "single observed price" record (no volume).
    function isFullOHLC(item) {
        const o = Number(item.open);
        const h = Number(item.high);
        const l = Number(item.low);
        const c = Number(item.close);

        if (![o, h, l, c].every(Number.isFinite)) return false;
        if (o <= 0 || h <= 0 || l <= 0 || c <= 0) return false;

        const flat = o === h && h === l && l === c;
        const noVolume = item.volume == null;

        return !(flat && noVolume);
    }

    function normalise(history) {
        return history
            .map(item => ({
                date: item.date || item.timestamp || item.datetime,
                open: Number(item.open),
                high: Number(item.high),
                low: Number(item.low),
                close: Number(item.close ?? item.price),
                full: isFullOHLC(item)
            }))
            .filter(r => r.date && Number.isFinite(r.close) && r.close > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /* ---------- candlestick renderer ---------- */

    // Returns true if drawn, false if there was not enough real OHLC.
    function renderCandles(container, history, market) {

        const rows = normalise(history);
        const fullCount = rows.filter(r => r.full).length;

        if (fullCount < 2) return false;

        const currency = market === 'US' ? '$' : '₦';

        const W = 700, H = 260;
        const padL = 45, padR = 15, padT = 20, padB = 35;
        const plotW = W - padL - padR;
        const plotH = H - padT - padB;

        // Price range: highs/lows for real candles, close for the rest
        const highs = rows.map(r => r.full ? r.high : r.close);
        const lows  = rows.map(r => r.full ? r.low  : r.close);
        const maxP = Math.max(...highs);
        const minP = Math.min(...lows);
        const span = (maxP - minP) || Math.max(maxP * 0.01, 1);

        const slot  = plotW / rows.length;
        const bodyW = Math.max(2, slot * 0.6);

        const xAt = i => padL + slot * (i + 0.5);
        const yAt = p => padT + ((maxP - p) / span) * plotH;

        // 3 horizontal grid lines with price labels
        const grid = [0, 0.5, 1].map(f => {
            const price = maxP - span * f;
            const y = yAt(price);
            return `
                <line class="candle-grid" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>
                <text class="candle-label" x="${padL - 4}" y="${y + 3}" text-anchor="end">
                    ${formatNumber(price)}
                </text>`;
        }).join('');

        // One candle (or grey tick) per row
        const candles = rows.map((r, i) => {
            const x = xAt(i);

            // Close-only record: small grey tick, nothing invented
            if (!r.full) {
                const y = yAt(r.close);
                return `<line class="candle-close-only"
                    x1="${x - bodyW / 2}" y1="${y}" x2="${x + bodyW / 2}" y2="${y}"/>`;
            }

            const up = r.close >= r.open;
            const cls = up ? 'candle-up' : 'candle-down';
            const top = yAt(Math.max(r.open, r.close));
            const bodyH = Math.max(1, Math.abs(yAt(r.open) - yAt(r.close)));

            return `
                <line class="${cls} candle-wick"
                      x1="${x}" y1="${yAt(r.high)}" x2="${x}" y2="${yAt(r.low)}"/>
                <rect class="${cls}"
                      x="${x - bodyW / 2}" y="${top}" width="${bodyW}" height="${bodyH}"/>`;
        }).join('');

        container.innerHTML = `
            <div class="candle-info">
                ${fullCount} of ${rows.length} days have full OHLC. Tap a candle for details.
            </div>
            <svg class="candle-svg" viewBox="0 0 ${W} ${H}" role="img"
                 aria-label="Candlestick price chart">
                ${grid}
                ${candles}
                <line class="candle-guide" style="display:none"
                      x1="0" y1="${padT}" x2="0" y2="${H - padB}"/>
                <rect class="candle-hit" x="${padL}" y="${padT}"
                      width="${plotW}" height="${plotH}" fill="transparent"/>
            </svg>
            <div class="chart-date-row">
                <span>${formatChartDate(rows[0].date)}</span>
                <span>${formatChartDate(rows[rows.length - 1].date)}</span>
            </div>
        `;

        /* ----- tap / hover details ----- */
        const svg   = container.querySelector('.candle-svg');
        const info  = container.querySelector('.candle-info');
        const guide = container.querySelector('.candle-guide');
        const hit   = container.querySelector('.candle-hit');
        const defaultText = info.textContent;

        function indexFromEvent(e) {
            const rect = svg.getBoundingClientRect();
            const xSvg = ((e.clientX - rect.left) / rect.width) * W;
            const i = Math.floor((xSvg - padL) / slot);
            return Math.max(0, Math.min(rows.length - 1, i));
        }

        function show(i) {
            const r = rows[i];
            guide.setAttribute('x1', xAt(i));
            guide.setAttribute('x2', xAt(i));
            guide.style.display = 'block';

            info.textContent = r.full
                ? `${formatChartDate(r.date)}  O ${currency}${formatNumber(r.open)}  ` +
                  `H ${currency}${formatNumber(r.high)}  L ${currency}${formatNumber(r.low)}  ` +
                  `C ${currency}${formatNumber(r.close)}`
                : `${formatChartDate(r.date)}  Close ${currency}${formatNumber(r.close)}  ` +
                  `(Open/High/Low unavailable)`;
        }

        function reset() {
            guide.style.display = 'none';
            info.textContent = defaultText;
        }

        hit.addEventListener('pointerdown', e => show(indexFromEvent(e)));
        hit.addEventListener('pointermove', e => {
            if (e.pointerType === 'mouse' || e.buttons) show(indexFromEvent(e));
        });
        hit.addEventListener('pointerleave', e => {
            if (e.pointerType === 'mouse') reset();
        });

        return true;
    }

    /* ---------- draw in the chosen mode ---------- */

    function draw(chart, mode, market) {
        const bar = chart.parentElement.querySelector('.chart-mode-bar');

        if (mode === 'candles') {
            const ok = renderCandles(chart, chart._history, market);

            if (!ok) {
                // Not enough real OHLC: fall back to line and say why
                renderRealStockChart(chart, chart._history, market);
                chart.insertAdjacentHTML(
                    'afterbegin',
                    '<div class="candle-info">Not enough full OHLC data for candles yet. Showing line.</div>'
                );
                mode = 'line';
            }
        } else {
            renderRealStockChart(chart, chart._history, market);
        }

        if (bar) {
            bar.querySelectorAll('.chart-mode-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.mode === mode)
            );
        }
    }

    /* ---------- override of the original loader ---------- */

    window.loadWatchlistChart = async function (ticker, market, index) {

        const chart   = document.getElementById(`stock-chart-${index}`);
        const loading = document.getElementById(`chart-loading-${index}`);

        if (!chart) return;
        if (chart.dataset.loaded === 'true') return;

        ensureCandleStyles();

        chart.innerHTML =
            '<div class="chart-placeholder">Loading real price history...</div>';

        if (loading) {
            loading.textContent = 'Loading...';
            loading.style.display = 'inline';
        }

        try {
            const response = await fetch(
                `${API_BASE}/stocks/history/${encodeURIComponent(ticker)}` +
                `?market=${encodeURIComponent(market)}&days=30`
            );

            if (!response.ok) {
                throw new Error(`History request failed: ${response.status}`);
            }

            const data = await response.json();
            const history = Array.isArray(data) ? data : data.data;

            if (!Array.isArray(history) || history.length < 2) {
                throw new Error('Not enough real historical data');
            }

            // Keep the data on the element so toggling needs no refetch
            chart._history = history;

            // Build the Line | Candles switch once, above the chart
            if (!chart.parentElement.querySelector('.chart-mode-bar')) {
                const bar = document.createElement('div');
                bar.className = 'chart-mode-bar';
                bar.innerHTML = `
                    <button type="button" class="chart-mode-btn active" data-mode="line">Line</button>
                    <button type="button" class="chart-mode-btn" data-mode="candles">Candles</button>
                `;

                bar.addEventListener('click', e => {
                    e.stopPropagation(); // don't collapse the card
                    const btn = e.target.closest('.chart-mode-btn');
                    if (btn) draw(chart, btn.dataset.mode, market);
                });

                chart.parentElement.insertBefore(bar, chart);
            }

            draw(chart, 'line', market);   // default view unchanged
            chart.dataset.loaded = 'true';

            if (loading) loading.style.display = 'none';

        } catch (error) {
            console.error(`[Watchlist Chart] ${ticker}:`, error);

            chart.innerHTML =
                '<div class="chart-placeholder chart-error">Unable to load real price history</div>';

            if (loading) loading.style.display = 'none';
        }
    };

})();
