// frontend/logos.js
// Company logos for Gaze stock avatars (watchlist, portfolio, sold,
// market popup and search suggestions).
//
// No changes to app.js are needed. This file watches the page; whenever a
// letter avatar appears, it reads the ticker shown beside it, finds the
// company's website, and swaps the letter for the logo. If there is no
// website listed, or the icon is missing or too small, the letter stays.
//
// Where each logo comes from, in this order:
//   1. Your own file:  logos/TICKER.png   (best quality, always wins)
//   2. Logo.dev real company logo (needs LOGO_DEV_TOKEN and the ticker in DOMAINS)
//   3. The company's website icon (needs the ticker in DOMAINS below)
//   4. The original coloured letter
//
// LOGO.DEV: create a free account at logo.dev, copy your PUBLISHABLE key
// (it starts with pk_) and paste it between the quotes below. This key is
// meant to be public. Check their current terms for the free plan, which
// may ask you to credit them somewhere in your app.
//
// TO ADD A LOGO FILE: save it as  frontend/logos/GTCO.png  (ticker in capitals).
// TO ADD A WEBSITE:   add  TICKER: 'website.com'  to DOMAINS below.

(function () {
    'use strict';

    var DOMAINS = {
        // NGX
        GTCO: 'gtbank.com',
        ZENITHBANK: 'zenithbank.com',
        ACCESSCORP: 'accessbankplc.com',
        UBA: 'ubagroup.com',
        FIRSTHOLDCO: 'firstbanknigeria.com',
        FCMB: 'fcmb.com',
        STERLINGNG: 'sterling.ng',
        FIDELITYBK: 'fidelitybank.ng',
        WEMABANK: 'wemabank.com',
        STANBIC: 'stanbicibtcbank.com',
        ETI: 'ecobank.com',
        MTNN: 'mtnonline.com',
        AIRTELAFRI: 'airtel.africa',
        DANGCEM: 'dangotecement.com',
        DANGSUGAR: 'dangotesugar.com.ng',
        BUACEMENT: 'buacement.com',
        BUAFOODS: 'buafoodsplc.com',
        SEPLAT: 'seplatenergy.com',
        ARADEL: 'aradel.com',
        OANDO: 'oandoplc.com',
        CONOIL: 'conoilplc.com',
        TOTAL: 'totalenergies.ng',
        GEREGU: 'gereguplc.com',
        TRANSCORP: 'transcorpnigeria.com',
        NESTLE: 'nestle-cwa.com',
        NB: 'nbplc.com',
        GUINNESS: 'guinness-nigeria.com',
        UNILEVER: 'unilevernigeria.com',
        CADBURY: 'cadburynigeria.com',
        PZ: 'pzcussons.com.ng',
        NAHCO: 'nahcoaviance.com',
        UACN: 'uacnplc.com',
        CUSTODIAN: 'custodianplc.com.ng',
        AIICO: 'aiicoplc.com',
        MANSARD: 'axamansard.com',
        PRESCO: 'presco-plc.com',
        NGXGROUP: 'ngxgroup.com',
        JBERGER: 'julius-berger.com',
        UPDC: 'updcplc.com',
        ETRANZACT: 'etranzact.com',
        CILEASING: 'cileasing.com',
        VITAFOAM: 'vitafoamng.com',
        TIP: 'initiatesgroup.com',
        CONHALLPLC: 'chiplc.com',
        ABBEYBANK: 'abbeymortgagebank.com',
        BERGER: 'bergerpaintsnig.com',
        TRANSCOHOT: 'transcorphotels.com',
        TRANSPOWER: 'transcorppower.com',
        FTGINSURE: 'fortisglobalinsurance.com',
        // NGX — add these entries
ACADEMY: 'academypress-plc.com',
ALEX: 'alexnigeria.com',
AVACAP: 'avacapitalplcgroup.com',
AVAIF: 'avacapitalgroup.com',
HBMNG: 'hbmngplc.com',
INTBREW: 'internationalbreweriesplc.com',
LIVESTOCK: 'livestockfeedsplc.com',
REGALINS: 'regencyalliance.com',
UPL: 'universitypressplc.com',
UPDCREIT: 'updcplc.com',
OMATEK: 'omatek.ng',
OKOMUOIL: 'okomunigeria.com',
SKYAVN: 'sahcoplc.com',
NNFM: 'nnfmplc.com',
HONEYFLOUR: 'honeywellfood.com',
HONYFLOUR: 'honeywellfood.com',
ETERNA: 'eternaplc.com',

// US
ARGT: 'globalxetfs.com',
        UCAP: 'unitedcapitalplcgroup.com',
        // US
        AAPL: 'apple.com',
        TSLA: 'tesla.com',
        NVDA: 'nvidia.com',
        MSFT: 'microsoft.com',
        GOOGL: 'google.com',
        GOOG: 'google.com',
        META: 'meta.com',
        AMZN: 'amazon.com',
        NFLX: 'netflix.com',
        AMD: 'amd.com',
        AVGO: 'broadcom.com',
        KO: 'coca-cola.com',
        COKE: 'cokeconsolidated.com',
        PEP: 'pepsico.com',
        XOM: 'exxonmobil.com',
        HPQ: 'hp.com',
        SPOT: 'spotify.com',
        QBTS: 'dwavequantum.com',
        GBTG: 'gbtg.com',
        GBTC: 'grayscale.com',
        NXT: 'nextracker.com',
        DMAC: 'diamedica.com',
        TWN: 'taiwanfund.com'
    };

    var LOGO_DEV_TOKEN = 'pk_YeBQRMVKST2Ia_4frzFn7A';           // paste your pk_... key here
    var LOGO_DIR = 'logos/';           // folder for your own logo files
    var MIN_SIZE = 32;                 // smaller icons look blurry, skip them
    var AVATAR_SELECTOR = '.stock-avatar, .autocomplete-avatar';
    var SCOPE_SELECTOR = '.stock-item, .watchlist-card-main, .autocomplete-item';
    var TICKER_SELECTOR = '.stock-ticker, .autocomplete-ticker';

    // Remembered per ticker so lists that redraw do not flicker or re-test.
    var good = Object.create(null);    // ticker -> url that worked
    var bad = Object.create(null);     // ticker -> true if no usable logo

    function logoUrl(ticker) {
        var domain = DOMAINS[ticker];

        if (!domain) return null;

        // Answers 404 when the site has no icon, so onerror can fall back.
        return (
            'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON' +
            '&url=' + encodeURIComponent('https://' + domain) +
            '&size=128'
        );
    }

    // Reads the ticker from the card the avatar belongs to.
    function tickerFor(avatar) {
        var scope = avatar.closest(SCOPE_SELECTOR);

        if (!scope) return '';

        var el = scope.querySelector(TICKER_SELECTOR);

        if (!el) return '';

        // The ticker is the first text; a confidence badge may follow it.
        for (var i = 0; i < el.childNodes.length; i++) {
            var node = el.childNodes[i];

            if (node.nodeType === 3 && node.textContent.trim()) {
                return node.textContent.trim().toUpperCase();
            }
        }

        return el.textContent.trim().split(/\s+/)[0].toUpperCase();
    }

    function showLogo(avatar, img) {
        avatar.setAttribute('data-letter', avatar.textContent);
        avatar.textContent = '';

        avatar.style.background = '#fff';
        avatar.style.overflow = 'hidden';
        avatar.style.padding = '8px';
        avatar.style.boxSizing = 'border-box';

        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';

        avatar.appendChild(img);
        avatar.setAttribute('data-logo', 'ok');
    }

    function restoreLetter(avatar, ticker) {
        bad[ticker] = true;
        delete good[ticker];

        var letter = avatar.getAttribute('data-letter');

        if (letter !== null) {
            avatar.textContent = letter;
        }

        avatar.setAttribute('data-logo', 'none');
    }

    // Real company logo from Logo.dev. fallback=404 means "no logo found"
    // is reported as an error, so we move on instead of showing a placeholder.
    function logoDevUrl(ticker) {
        var domain = DOMAINS[ticker];

        if (!LOGO_DEV_TOKEN || !domain) return null;

        return (
            'https://img.logo.dev/' + encodeURIComponent(domain) +
            '?token=' + encodeURIComponent(LOGO_DEV_TOKEN) +
            '&size=128&format=png&fallback=404'
        );
    }

    // Places to try for a ticker, best first.
    function sourcesFor(ticker) {
        var list = [LOGO_DIR + encodeURIComponent(ticker) + '.png'];
        var real = logoDevUrl(ticker);
        var web = logoUrl(ticker);

        if (real) list.push(real);
        if (web) list.push(web);

        return list;
    }

    function applyTo(avatar) {
        if (!avatar || avatar.getAttribute('data-logo')) return;

        var ticker = tickerFor(avatar);

        if (!ticker || bad[ticker]) return;

        avatar.setAttribute('data-logo', 'loading');

        // Already confirmed earlier: show it at once so redrawn lists
        // do not flicker.
        if (good[ticker]) {
            var cached = new Image();

            cached.referrerPolicy = 'no-referrer';
            cached.alt = '';
            cached.onerror = function () {
                restoreLetter(avatar, ticker);
            };
            cached.src = good[ticker];
            showLogo(avatar, cached);
            return;
        }

        var sources = sourcesFor(ticker);

        function tryNext(i) {
            if (i >= sources.length) {
                bad[ticker] = true;
                avatar.setAttribute('data-logo', 'none');
                return;
            }

            var img = new Image();

            img.referrerPolicy = 'no-referrer';
            img.decoding = 'async';
            img.alt = '';

            img.onload = function () {
                if (img.naturalWidth < MIN_SIZE) {
                    tryNext(i + 1);
                    return;
                }

                good[ticker] = sources[i];
                showLogo(avatar, img);
            };

            img.onerror = function () {
                tryNext(i + 1);
            };

            img.src = sources[i];
        }

        tryNext(0);
    }

    function scan(root) {
        if (!root || root.nodeType !== 1) return;

        if (root.matches && root.matches(AVATAR_SELECTOR)) {
            applyTo(root);
        }

        var found = root.querySelectorAll
            ? root.querySelectorAll(AVATAR_SELECTOR)
            : [];

        for (var i = 0; i < found.length; i++) {
            applyTo(found[i]);
        }
    }

    function start() {
        scan(document.body);

        new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;

                for (var j = 0; j < added.length; j++) {
                    scan(added[j]);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

    // Optional manual use: window.gazeScanLogos(containerElement)
    window.gazeScanLogos = scan;
})();
