// frontend/logos.js
// Company logos for Gaze stock avatars.

(function () {
    'use strict';

    var DOMAINS = {
        // NGX — Banking and financial services
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
        CUSTODIAN: 'custodianplc.com.ng',
        AIICO: 'aiicoplc.com',
        MANSARD: 'axamansard.com',
        AVACAP: 'avacapitalplcgroup.com',
        AVAIF: 'avacapitalgroup.com',
        ABBEYBANK: 'abbeymortgagebank.com',
        REGALINS: 'regencyalliance.com',
        UCAP: 'unitedcapitalplcgroup.com',
        CORNERST: 'cornerstone.com.ng',
        LASACO: 'lasacoassurance.com',
        LINKASSURE: 'linkageassurance.com',
        MBENEFIT: 'mutualng.com',
        INFINITY: 'infinitytrustbank.com',

        // NGX — Industrial, energy and infrastructure
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
        GEREGU: 'geregupowerplc.com',
        TRANSCORP: 'transcorpnigeria.com',
        JBERGER: 'julius-berger.com',
        BERGER: 'bergerpaintsnig.com',
        NAHCO: 'nahcoaviance.com',
        SKYAVN: 'sahcoplc.com',
        TRANSPOWER: 'transcorppower.com',
        TRANSCOHOT: 'transcorphotels.com',
        TIP: 'initiatesgroup.com',

        // NGX — Consumer goods, agriculture and healthcare
        NESTLE: 'nestle-cwa.com',
        NB: 'nbplc.com',
        INTBREW: 'internationalbreweriesplc.com',
        GUINNESS: 'guinness-nigeria.com',
        UNILEVER: 'unilevernigeria.com',
        CADBURY: 'cadburynigeria.com',
        PZ: 'pzcussons.com.ng',
        PRESCO: 'presco-plc.com',
        LIVESTOCK: 'livestockfeedsplc.com',
        HONEYFLOUR: 'honeywellfood.com',
        HONYFLOUR: 'honeywellfood.com',
        OKOMUOIL: 'okomunigeria.com',
        MAYBAKER: 'may-baker.com',
        VITAFOAM: 'vitafoamng.com',
        NNFM: 'nnfmplc.com',
        ETERNA: 'eternaplc.com',

        // NGX — Other companies
        NGXGROUP: 'ngxgroup.com',
        ACADEMY: 'academypress-plc.com',
        ALEX: 'alexnigeria.com',
        HBMNG: 'hbmngplc.com',
        UPL: 'universitypressplc.com',
        UPDC: 'updcplc.com',
        UPDCREIT: 'updcplc.com',
        ETRANZACT: 'etranzact.com',
        CILEASING: 'cileasing.com',
        CONHALLPLC: 'chiplc.com',
        FTGINSURE: 'fortisglobalinsurance.com',
        AUSTINLAZ: 'austinlaz.com.ng',
        THOMASWY: 'thomaswyattng.com',
        ABCTRANS: 'abctransport.com',
        EKOCORP: 'ekohospitals.com',
        OMATEK: 'omatek.ng',

        // NGX — Additional confirmed company identities
        IKEJAHOTEL: 'ikejahotelplc.com',
        JOHNHOLT: 'johnholt.com',
        LEARNAFRCA: 'learnafrica.com',
        MEYER: 'meyerpaints.com',
        NASCON: 'nascon.dangote.com',

        // US — Existing mappings
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
        TWN: 'taiwanfund.com',
        ARGT: 'globalxetfs.com',

        // US — Additional stocks
        MU: 'micron.com',
        'BRK/A': 'berkshirehathaway.com',
        'BRK/B': 'berkshirehathaway.com',
        'BRK.A': 'berkshirehathaway.com',
        'BRK.B': 'berkshirehathaway.com',
        LLY: 'lilly.com',
        JPM: 'jpmorganchase.com',
        WMT: 'walmart.com',
        V: 'visa.com',
        JNJ: 'jnj.com',
        INTC: 'intel.com',
        MA: 'mastercard.com',
        ABBV: 'abbvie.com',
        PLTR: 'palantir.com',
        CSCO: 'cisco.com',
        ORCL: 'oracle.com',
        COST: 'costco.com',
        CVX: 'chevron.com',
        BAC: 'bankofamerica.com',
        LRCX: 'lamresearch.com',
        AMAT: 'appliedmaterials.com',
        CAT: 'caterpillar.com',
        MRK: 'merck.com',
        DELL: 'dell.com',
        PG: 'pg.com',
        GE: 'ge.com',
        UNH: 'unitedhealthgroup.com',
        MS: 'morganstanley.com',
        PANW: 'paloaltonetworks.com',
        PM: 'pmi.com'
    };

    var LOGO_DEV_TOKEN = 'pk_YeBQRMVKST2Ia_4frzFn7A';
    var LOGO_DIR = 'logos/';
    var MIN_SIZE = 32;

    var AVATAR_SELECTOR = '.stock-avatar, .autocomplete-avatar';
    var SCOPE_SELECTOR =
        '.stock-item, .watchlist-card-main, .autocomplete-item';
    var TICKER_SELECTOR = '.stock-ticker, .autocomplete-ticker';

    var good = Object.create(null);
    var bad = Object.create(null);

    function logoUrl(ticker) {
        var domain = DOMAINS[ticker];

        if (!domain) return null;

        return (
            'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON' +
            '&url=' + encodeURIComponent('https://' + domain) +
            '&size=128'
        );
    }

    function tickerFor(avatar) {
        var scope = avatar.closest(SCOPE_SELECTOR);

        if (!scope) return '';

        var el = scope.querySelector(TICKER_SELECTOR);

        if (!el) return '';

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

    function logoDevUrl(ticker) {
        var domain = DOMAINS[ticker];

        if (!LOGO_DEV_TOKEN || !domain) return null;

        return (
            'https://img.logo.dev/' + encodeURIComponent(domain) +
            '?token=' + encodeURIComponent(LOGO_DEV_TOKEN) +
            '&size=128&format=png&fallback=404'
        );
    }

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
        }).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.body) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

    window.gazeScanLogos = scan;
})();