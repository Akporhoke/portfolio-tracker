(function () {
  const root = document.getElementById('fxRatesRoot');
  if (!root) return;

  // Session hours (Lagos time). Change these to whatever you want to show.
  const SESSION = { openHour: 8, closeHour: 17 };

  root.innerHTML = `
    <div class="fx-section">
      <p class="fx-title">FX rates</p>
      <div class="fx-card">
        <div class="fx-rates">
          <div class="fx-tile"><span class="fx-icon">$</span>
            <div><small>USD to NGN</small><b id="fxUsdNgn">—</b></div></div>
          <div class="fx-divider"></div>
          <div class="fx-tile"><span class="fx-icon">£</span>
            <div><small>GBP to USD</small><b id="fxGbpUsd">—</b></div></div>
        </div>
                <div class="fx-status">
          <span>Trading session: <span id="fxSession">—</span></span>
          <span class="fx-actions">
            <button type="button" class="fx-more" id="fxConvert">Convert</button>
            <button type="button" class="fx-more" id="fxMore">See more</button>
          </span>
        </div>
        <div class="fx-details" id="fxDetails"></div>
      </div>
    </div>`;

  const $ = id => document.getElementById(id);
  let latest = null;

  function sessionOpen() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos', weekday: 'short', hour: 'numeric', hour12: false
    }).formatToParts(new Date());
    const day = parts.find(p => p.type === 'weekday').value;
    const hour = Number(parts.find(p => p.type === 'hour').value);
    return !['Sat', 'Sun'].includes(day) && hour >= SESSION.openHour && hour < SESSION.closeHour;
  }

  function paintSession() {
    const open = sessionOpen();
    const el = $('fxSession');
    el.textContent = open ? 'Open' : 'Closed';
    el.className = open ? 'fx-open' : 'fx-closed';
  }

  function paintRates(r) {
    latest = r;
    $('fxUsdNgn').textContent = `$1 = ₦${r.usdToNgn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    $('fxGbpUsd').textContent = `£1 = $${r.gbpToUsd.toFixed(4)}`;
    $('fxDetails').innerHTML =
      `₦1 = $${(1 / r.usdToNgn).toFixed(6)}<br>` +
      `Updated ${new Date(r.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br>` +
      `Mid-market rates. Your bank or exchange will differ slightly.`;
    try { localStorage.setItem('gazeFxRates', JSON.stringify(r)); } catch (e) {}
  }

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/fx`);
      if (!res.ok) throw new Error(res.status);
      paintRates(await res.json());
    } catch (e) {
      if (!latest) {
        try {
          const cached = JSON.parse(localStorage.getItem('gazeFxRates'));
          if (cached) paintRates(cached);
        } catch (_) {}
      }
    }
  }

  $('fxMore').addEventListener('click', () => {
    const d = $('fxDetails');
    d.classList.toggle('open');
    $('fxMore').textContent = d.classList.contains('open') ? 'Show less' : 'See more';
    $('fxConvert').addEventListener('click', () => {
    if (typeof window.openGazeTool === 'function') {
      window.openGazeTool('converter');
    } else if (typeof window.switchTab === 'function') {
      window.switchTab('converter');
    }
  });
});

  paintSession();
  load();
  setInterval(paintSession, 60000);
  setInterval(load, 300000); // same 5 min as REFRESH_INTERVAL
})();