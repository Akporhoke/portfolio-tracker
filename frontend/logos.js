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

        // NGX — Added from master listing (domains unverified)
        AFRIPRUD: 'africaprudentialplc.com',
        BETAGLAS: 'betaglas.com',
        CAVERTON: 'cavertonoffshore.com',
        CHAMPION: 'championbreweriesplc.com',
        CHAMS: 'chamsplc.com',
        CAP: 'capplc.com',
        CNIF: 'coronationam.com',
        WAPIC: 'coronationinsurance.com',
        CUTIX: 'cutix.com',
        CWG: 'cwg-plc.com',
        ELLAHLAKES: 'ellahlakes.com',
        EUNISELL: 'eunisell.com',
        FIDSON: 'fidson.com',
        JAIZBANK: 'jaizbankplc.com',
        LIVINGTRUST: 'livingtrustmortgagebank.com',
        MULTITREX: 'multitrexgroup.com',
        NPFMCRFBK: 'npfmicrofinancebank.com',
        NEM: 'nem-insurance.com',
        REDSTAREX: 'redstarplc.com',
        RTBRISCOE: 'rtbriscoe.com',
        SFSREIT: 'sfsreit.com',
        SUNUASSUR: 'sunuassurancesnigeria.com',
        UACN: 'uacnplc.com',
        UNIONBANK: 'unionbankng.com',
        UNITYBNK: 'unitybankng.com',
        VFDGROUP: 'vfdgroup.com',
        VERITASKAP: 'veritaskapital.com',

        // NGX — Domains supplied by user for previously skipped tickers
        AFRINSURE: 'africanallianceplc.com',
        AFROMEDIA: 'afromediaplc.com',
        BAPLC: 'btel.com.ng',
        CHELLARAM: 'chellaramsplc.com',
        FTNCOCOA: 'ftncocoa.com.ng',
        HMCALL: 'hmkplc.com',
        MECURE: 'mecure.com',
        MORISON: 'morisonplc.ng',
        UNIVINSURE: 'universalinsuranceplc.com',

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
        PM: 'pmi.com',

        // S&P 500 — Information technology
        ADBE: 'adobe.com',
        CRM: 'salesforce.com',
        IBM: 'ibm.com',
        QCOM: 'qualcomm.com',
        TXN: 'ti.com',
        KLAC: 'kla.com',
        ADI: 'analog.com',
        NOW: 'servicenow.com',
        INTU: 'intuit.com',
        SNPS: 'synopsys.com',
        CDNS: 'cadence.com',
        ANET: 'arista.com',
        CRWD: 'crowdstrike.com',
        FTNT: 'fortinet.com',
        WDAY: 'workday.com',
        ADSK: 'autodesk.com',
        ROP: 'ropertech.com',
        MSI: 'motorolasolutions.com',
        APH: 'amphenol.com',
        TEL: 'te.com',
        GLW: 'corning.com',
        NXPI: 'nxp.com',
        MCHP: 'microchip.com',
        ON: 'onsemi.com',
        MPWR: 'monolithicpower.com',
        SWKS: 'skyworksinc.com',
        QRVO: 'qorvo.com',
        TER: 'teradyne.com',
        FSLR: 'firstsolar.com',
        ENPH: 'enphase.com',
        GEN: 'gendigital.com',
        AKAM: 'akamai.com',
        FFIV: 'f5.com',
        NTAP: 'netapp.com',
        STX: 'seagate.com',
        WDC: 'westerndigital.com',
        SNDK: 'sandisk.com',
        HPE: 'hpe.com',
        PTC: 'ptc.com',
        TYL: 'tylertech.com',
        FICO: 'fico.com',
        CDW: 'cdw.com',
        TRMB: 'trimble.com',
        ZBRA: 'zebra.com',
        KEYS: 'keysight.com',
        GDDY: 'godaddy.com',
        VRSN: 'verisign.com',
        EPAM: 'epam.com',
        IT: 'gartner.com',
        CTSH: 'cognizant.com',
        ACN: 'accenture.com',
        SMCI: 'supermicro.com',
        APP: 'applovin.com',
        DDOG: 'datadoghq.com',
        TTD: 'thetradedesk.com',
        PAYC: 'paycom.com',
        FDS: 'factset.com',
        JKHY: 'jackhenry.com',
        ADP: 'adp.com',
        PAYX: 'paychex.com',
        FI: 'fiserv.com',
        FISV: 'fiserv.com',
        FIS: 'fisglobal.com',
        GPN: 'globalpayments.com',
        PYPL: 'paypal.com',
        XYZ: 'block.xyz',
        SQ: 'block.xyz',
        CPAY: 'corpay.com',
        TDY: 'teledyne.com',
        LDOS: 'leidos.com',

        // S&P 500 — Communication services
        T: 'att.com',
        VZ: 'verizon.com',
        TMUS: 't-mobile.com',
        CMCSA: 'comcast.com',
        CHTR: 'charter.com',
        DIS: 'thewaltdisneycompany.com',
        WBD: 'wbd.com',
        PSKY: 'paramount.com',
        PARA: 'paramount.com',
        FOX: 'foxcorporation.com',
        FOXA: 'foxcorporation.com',
        NWS: 'newscorp.com',
        NWSA: 'newscorp.com',
        OMC: 'omnicomgroup.com',
        LYV: 'livenationentertainment.com',
        EA: 'ea.com',
        TTWO: 'take2games.com',
        MTCH: 'mtch.com',
        TKO: 'tkogrp.com',

        // S&P 500 — Consumer discretionary
        HD: 'homedepot.com',
        LOW: 'lowes.com',
        MCD: 'mcdonalds.com',
        SBUX: 'starbucks.com',
        NKE: 'nike.com',
        TJX: 'tjx.com',
        BKNG: 'bookingholdings.com',
        ABNB: 'airbnb.com',
        UBER: 'uber.com',
        DASH: 'doordash.com',
        CMG: 'chipotle.com',
        ORLY: 'oreillyauto.com',
        AZO: 'autozone.com',
        ROST: 'rossstores.com',
        HLT: 'hilton.com',
        MAR: 'marriott.com',
        GM: 'gm.com',
        F: 'ford.com',
        RCL: 'royalcaribbean.com',
        CCL: 'carnival.com',
        NCLH: 'ncl.com',
        EXPE: 'expediagroup.com',
        YUM: 'yum.com',
        DRI: 'darden.com',
        DPZ: 'dominos.com',
        LULU: 'lululemon.com',
        DECK: 'deckers.com',
        ULTA: 'ulta.com',
        BBY: 'bestbuy.com',
        TSCO: 'tractorsupply.com',
        EBAY: 'ebay.com',
        ETSY: 'etsy.com',
        LVS: 'sands.com',
        WYNN: 'wynnresorts.com',
        MGM: 'mgmresorts.com',
        CZR: 'caesars.com',
        HAS: 'hasbro.com',
        POOL: 'poolcorp.com',
        GPC: 'genpt.com',
        LKQ: 'lkqcorp.com',
        KMX: 'carmax.com',
        APTV: 'aptiv.com',
        BWA: 'borgwarner.com',
        PHM: 'pulte.com',
        DHI: 'drhorton.com',
        LEN: 'lennar.com',
        NVR: 'nvrinc.com',
        GRMN: 'garmin.com',
        TPR: 'tapestry.com',
        RL: 'ralphlauren.com',
        WSM: 'williams-sonoma.com',
        MHK: 'mohawkind.com',
        DG: 'dollargeneral.com',
        DLTR: 'dollartree.com',

        // S&P 500 — Consumer staples
        MDLZ: 'mondelezinternational.com',
        MO: 'altria.com',
        CL: 'colgatepalmolive.com',
        KMB: 'kimberly-clark.com',
        KDP: 'keurigdrpepper.com',
        STZ: 'cbrands.com',
        GIS: 'generalmills.com',
        KHC: 'kraftheinzcompany.com',
        HSY: 'thehersheycompany.com',
        SYY: 'sysco.com',
        KR: 'kroger.com',
        ADM: 'adm.com',
        TGT: 'target.com',
        EL: 'elcompanies.com',
        CHD: 'churchdwight.com',
        CLX: 'thecloroxcompany.com',
        MKC: 'mccormick.com',
        K: 'kellanova.com',
        CAG: 'conagrabrands.com',
        SJM: 'jmsmucker.com',
        HRL: 'hormelfoods.com',
        TSN: 'tysonfoods.com',
        CPB: 'campbellsoupcompany.com',
        LW: 'lambweston.com',
        BG: 'bunge.com',
        MNST: 'monsterbevcorp.com',
        TAP: 'molsoncoors.com',
        'BF/B': 'brown-forman.com',
        'BF.B': 'brown-forman.com',
        KVUE: 'kenvue.com',

        // S&P 500 — Health care
        PFE: 'pfizer.com',
        TMO: 'thermofisher.com',
        ABT: 'abbott.com',
        AMGN: 'amgen.com',
        ISRG: 'intuitive.com',
        DHR: 'danaher.com',
        BSX: 'bostonscientific.com',
        SYK: 'stryker.com',
        GILD: 'gilead.com',
        VRTX: 'vrtx.com',
        REGN: 'regeneron.com',
        MDT: 'medtronic.com',
        BMY: 'bms.com',
        ELV: 'elevancehealth.com',
        CI: 'cigna.com',
        CVS: 'cvshealth.com',
        HCA: 'hcahealthcare.com',
        MCK: 'mckesson.com',
        COR: 'cencora.com',
        CAH: 'cardinalhealth.com',
        ZTS: 'zoetis.com',
        BDX: 'bd.com',
        EW: 'edwards.com',
        IDXX: 'idexx.com',
        A: 'agilent.com',
        IQV: 'iqvia.com',
        RMD: 'resmed.com',
        MTD: 'mt.com',
        WAT: 'waters.com',
        STE: 'steris.com',
        DXCM: 'dexcom.com',
        BIIB: 'biogen.com',
        MRNA: 'modernatx.com',
        HUM: 'humana.com',
        CNC: 'centene.com',
        MOH: 'molinahealthcare.com',
        LH: 'labcorp.com',
        DGX: 'questdiagnostics.com',
        ZBH: 'zimmerbiomet.com',
        BAX: 'baxter.com',
        PODD: 'insulet.com',
        ALGN: 'aligntech.com',
        HOLX: 'hologic.com',
        COO: 'coopercos.com',
        WST: 'westpharma.com',
        TECH: 'bio-techne.com',
        CRL: 'criver.com',
        INCY: 'incyte.com',
        UHS: 'uhsinc.com',
        DVA: 'davita.com',
        HSIC: 'henryschein.com',
        GEHC: 'gehealthcare.com',
        SOLV: 'solventum.com',
        RVTY: 'revvity.com',
        VTRS: 'viatris.com',

        // S&P 500 — Financials
        WFC: 'wellsfargo.com',
        C: 'citigroup.com',
        GS: 'goldmansachs.com',
        AXP: 'americanexpress.com',
        BLK: 'blackrock.com',
        SCHW: 'schwab.com',
        SPGI: 'spglobal.com',
        PGR: 'progressive.com',
        CB: 'chubb.com',
        MMC: 'marsh.com',
        MRSH: 'marsh.com',
        BX: 'blackstone.com',
        KKR: 'kkr.com',
        APO: 'apollo.com',
        COF: 'capitalone.com',
        USB: 'usbank.com',
        PNC: 'pnc.com',
        TFC: 'truist.com',
        BK: 'bny.com',
        STT: 'statestreet.com',
        CME: 'cmegroup.com',
        ICE: 'ice.com',
        MCO: 'moodys.com',
        AON: 'aon.com',
        AJG: 'ajg.com',
        MET: 'metlife.com',
        PRU: 'prudential.com',
        AIG: 'aig.com',
        ALL: 'allstate.com',
        TRV: 'travelers.com',
        AFL: 'aflac.com',
        HIG: 'thehartford.com',
        CINF: 'cinfin.com',
        WRB: 'berkley.com',
        L: 'loews.com',
        ACGL: 'archgroup.com',
        EG: 'everestglobal.com',
        PFG: 'principal.com',
        NDAQ: 'nasdaq.com',
        MSCI: 'msci.com',
        CBOE: 'cboe.com',
        FITB: '53.com',
        HBAN: 'huntington.com',
        RF: 'regions.com',
        KEY: 'key.com',
        CFG: 'citizensbank.com',
        MTB: 'mtb.com',
        NTRS: 'northerntrust.com',
        SYF: 'synchrony.com',
        BRO: 'bbrown.com',
        TROW: 'troweprice.com',
        BEN: 'franklinresources.com',
        IVZ: 'invesco.com',
        AMP: 'ameriprise.com',
        RJF: 'raymondjames.com',
        GL: 'globelifeinsurance.com',
        AIZ: 'assurant.com',
        MKTX: 'marketaxess.com',
        COIN: 'coinbase.com',
        HOOD: 'robinhood.com',
        IBKR: 'interactivebrokers.com',
        ERIE: 'erieinsurance.com',
        BR: 'broadridge.com',
        EQH: 'equitable.com',

        // S&P 500 — Industrials
        RTX: 'rtx.com',
        HON: 'honeywell.com',
        UNP: 'up.com',
        BA: 'boeing.com',
        DE: 'deere.com',
        LMT: 'lockheedmartin.com',
        UPS: 'ups.com',
        ETN: 'eaton.com',
        GEV: 'gevernova.com',
        NOC: 'northropgrumman.com',
        GD: 'gd.com',
        MMM: '3m.com',
        EMR: 'emerson.com',
        ITW: 'itw.com',
        PH: 'parker.com',
        WM: 'wm.com',
        RSG: 'republicservices.com',
        CSX: 'csx.com',
        NSC: 'nscorp.com',
        FDX: 'fedex.com',
        CARR: 'carrier.com',
        TT: 'tranetechnologies.com',
        JCI: 'johnsoncontrols.com',
        PCAR: 'paccar.com',
        CTAS: 'cintas.com',
        CMI: 'cummins.com',
        LHX: 'l3harris.com',
        TDG: 'transdigm.com',
        GWW: 'grainger.com',
        FAST: 'fastenal.com',
        URI: 'unitedrentals.com',
        AME: 'ametek.com',
        ROK: 'rockwellautomation.com',
        OTIS: 'otis.com',
        PWR: 'quantaservices.com',
        VRSK: 'verisk.com',
        CPRT: 'copart.com',
        ODFL: 'odfl.com',
        DAL: 'delta.com',
        UAL: 'united.com',
        LUV: 'southwest.com',
        AAL: 'aa.com',
        HWM: 'howmet.com',
        AXON: 'axon.com',
        XYL: 'xylem.com',
        IR: 'irco.com',
        DOV: 'dovercorporation.com',
        SWK: 'stanleyblackanddecker.com',
        PNR: 'pentair.com',
        FTV: 'fortive.com',
        EFX: 'equifax.com',
        J: 'jacobs.com',
        HUBB: 'hubbell.com',
        GNRC: 'generac.com',
        EXPD: 'expeditors.com',
        CHRW: 'chrobinson.com',
        JBHT: 'jbhunt.com',
        NDSN: 'nordson.com',
        SNA: 'snapon.com',
        TXT: 'textron.com',
        ALLE: 'allegion.com',
        MAS: 'masco.com',
        BLDR: 'buildersfirstsource.com',
        EME: 'emcorgroup.com',
        WAB: 'wabteccorp.com',
        AOS: 'aosmith.com',
        ROL: 'rollins.com',
        VLTO: 'veralto.com',
        AMTM: 'amentum.com',
        LII: 'lennox.com',

        // S&P 500 — Energy
        COP: 'conocophillips.com',
        EOG: 'eogresources.com',
        SLB: 'slb.com',
        WMB: 'williams.com',
        KMI: 'kindermorgan.com',
        OKE: 'oneok.com',
        MPC: 'marathonpetroleum.com',
        PSX: 'phillips66.com',
        VLO: 'valero.com',
        OXY: 'oxy.com',
        BKR: 'bakerhughes.com',
        HAL: 'halliburton.com',
        FANG: 'diamondbackenergy.com',
        DVN: 'devonenergy.com',
        CTRA: 'coterra.com',
        EQT: 'eqt.com',
        TRGP: 'targaresources.com',
        TPL: 'texaspacific.com',
        EXE: 'expandenergy.com',
        APA: 'apacorp.com',

        // S&P 500 — Utilities
        NEE: 'nexteraenergy.com',
        SO: 'southerncompany.com',
        DUK: 'duke-energy.com',
        CEG: 'constellationenergy.com',
        AEP: 'aep.com',
        SRE: 'sempra.com',
        D: 'dominionenergy.com',
        EXC: 'exeloncorp.com',
        XEL: 'xcelenergy.com',
        PEG: 'pseg.com',
        ED: 'coned.com',
        WEC: 'wecenergygroup.com',
        ETR: 'entergy.com',
        EIX: 'edison.com',
        DTE: 'dteenergy.com',
        AEE: 'ameren.com',
        PPL: 'ppl.com',
        FE: 'firstenergycorp.com',
        ATO: 'atmosenergy.com',
        CMS: 'cmsenergy.com',
        CNP: 'centerpointenergy.com',
        NI: 'nisource.com',
        LNT: 'alliantenergy.com',
        EVRG: 'evergy.com',
        PNW: 'pinnaclewest.com',
        AWK: 'amwater.com',
        NRG: 'nrg.com',
        VST: 'vistracorp.com',
        PCG: 'pge.com',
        AES: 'aes.com',

        // S&P 500 — Materials
        LIN: 'linde.com',
        SHW: 'sherwin-williams.com',
        APD: 'airproducts.com',
        ECL: 'ecolab.com',
        FCX: 'fcx.com',
        NEM: 'newmont.com',
        CTVA: 'corteva.com',
        DOW: 'dow.com',
        DD: 'dupont.com',
        NUE: 'nucor.com',
        VMC: 'vulcanmaterials.com',
        MLM: 'martinmarietta.com',
        PPG: 'ppg.com',
        LYB: 'lyondellbasell.com',
        IFF: 'iff.com',
        STLD: 'steeldynamics.com',
        ALB: 'albemarle.com',
        MOS: 'mosaicco.com',
        CF: 'cfindustries.com',
        BALL: 'ball.com',
        AMCR: 'amcor.com',
        PKG: 'packagingcorp.com',
        IP: 'internationalpaper.com',
        AVY: 'averydennison.com',
        EMN: 'eastman.com',
        SW: 'smurfitwestrock.com',
        SCCO: 'southerncoppercorp.com',

        // S&P 500 — Real estate
        PLD: 'prologis.com',
        AMT: 'americantower.com',
        EQIX: 'equinix.com',
        WELL: 'welltower.com',
        SPG: 'simon.com',
        PSA: 'publicstorage.com',
        O: 'realtyincome.com',
        DLR: 'digitalrealty.com',
        CCI: 'crowncastle.com',
        VICI: 'viciproperties.com',
        CBRE: 'cbre.com',
        CSGP: 'costar.com',
        AVB: 'avalonbay.com',
        EQR: 'equityapartments.com',
        EXR: 'extraspace.com',
        INVH: 'invitationhomes.com',
        IRM: 'ironmountain.com',
        SBAC: 'sbasite.com',
        VTR: 'ventasreit.com',
        ARE: 'are.com',
        MAA: 'maac.com',
        ESS: 'essex.com',
        UDR: 'udr.com',
        HST: 'hosthotels.com',
        KIM: 'kimcorp.com',
        REG: 'regencycenters.com',
        CPT: 'camdenliving.com',
        FRT: 'federalrealty.com',
        BXP: 'bxp.com',
        DOC: 'healthpeak.com',

        // S&P 500 — Added after cross-check with user's master index
        JNPR: 'juniper.net',
        WTW: 'wtwco.com',
        ZION: 'zionsbancorporation.com',
        OGN: 'organon.com',
        MYGN: 'myriad.com',
        VFC: 'vfc.com',
        WHR: 'whirlpoolcorp.com',
        CP: 'cpkcr.com',
        TRN: 'trin.net',
        APLE: 'applehospitalityreit.com',
        CPF: 'cpb.bank',
        CPN: 'calpine.com',
        RKT: 'rocketcompanies.com',

        // US — Growth, software and semiconductors (non-S&P 500)
        RBLX: 'roblox.com',
        SNOW: 'snowflake.com',
        NET: 'cloudflare.com',
        MDB: 'mongodb.com',
        ZS: 'zscaler.com',
        OKTA: 'okta.com',
        TWLO: 'twilio.com',
        PATH: 'uipath.com',
        BILL: 'bill.com',
        HUBS: 'hubspot.com',
        ASAN: 'asana.com',
        DOCU: 'docusign.com',
        PCTY: 'paylocity.com',
        VERX: 'vertexinc.com',
        DUOL: 'duolingo.com',
        COUR: 'coursera.org',
        TOST: 'toasttab.com',
        RPRX: 'royaltypharma.com',
        COHR: 'coherent.com',
        LITE: 'lumentum.com',
        SLAB: 'silabs.com',
        POWI: 'power.com',
        RMBS: 'rambus.com',
        SITM: 'sitime.com',
        ALGM: 'allegromicro.com',
        DIOD: 'diodes.com',
        CAMT: 'camtek.com',
        FORM: 'formfactor.com',
        VECO: 'veeco.com',
        AEIS: 'advancedenergy.com',
        PLAB: 'photronics.com',
        PDFS: 'pdf.com',
        NVTS: 'navitassemi.com',
        WOLF: 'wolfspeed.com',
        ONTO: 'ontoinnovation.com',

        // US — Space, EV and clean tech
        PCT: 'purecycle.com',
        ENVX: 'enovix.com',
        QS: 'quantumscape.com',
        JOBY: 'jobyaviation.com',
        ACHR: 'archer.com',
        RKLB: 'rocketlabusa.com',
        ASTS: 'ast-science.com',
        LUNR: 'intuitivemachines.com',
        SPCE: 'virgingalactic.com',
        BKSY: 'blacksky.com',
        PL: 'planet.com',
        RDW: 'redwirespace.com',

        // US — Transport and shipping
        ARCB: 'arcb.com',
        SAIA: 'saia.com',
        XPO: 'xpo.com',
        KNX: 'knightswift.com',
        HUBG: 'hubgroup.com',
        MATX: 'matson.com',
        GXO: 'gxo.com',
        WERN: 'werner.com',
        SNDR: 'schneider.com',
        LSTR: 'landstar.com',
        R: 'ryder.com',
        SBLK: 'starbulk.com',
        GSL: 'globalshiplease.com',
        DAC: 'danaos.com',

        // US — Regional banks
        BOKF: 'bokf.com',
        FCNCA: 'firstcitizens.com',
        EWBC: 'eastwestbank.com',
        CADE: 'cadencebank.com',
        WAL: 'westernalliancebancorp.com',
        PB: 'prosperitybankusa.com',
        OZK: 'bankozk.com',
        SNV: 'synovus.com',
        FHN: 'firsthorizon.com',
        CMA: 'comerica.com',
        COLB: 'columbiabank.com',
        UMBF: 'umb.com',
        INDB: 'independentbank.com',
        FULT: 'fultonbank.com',
        WBS: 'websterbank.com',
        CUBI: 'customersbank.com',
        HWC: 'hancockwhitney.com',
        ONB: 'oldnational.com',
        BPOP: 'popular.com',
        NBTB: 'nbtbank.com',
        ASB: 'associatedbank.com',
        TRMK: 'trustmark.com',
        CATY: 'cathaybank.com',
        VLY: 'valley.com',
        FFIN: 'ffin.com',
        RNST: 'renasant.com',
        IBTX: 'independent-bank.com',
        SFNC: 'simmonsbank.com',
        AMTB: 'amerantbank.com',
        UBSI: 'ubsi-inc.com',
        HTLF: 'htlf.com',
        FBNC: 'firstbancorp.com',
        TCBI: 'texascapitalbank.com',
        EFSC: 'enterprisebank.com',
        FLG: 'flagstar.com',

        // International ADRs and cross-listings
        TSM: 'tsmc.com',
        ASML: 'asml.com',
        NVO: 'novonordisk.com',
        AZN: 'astrazeneca.com',
        SHEL: 'shell.com',
        TTE: 'totalenergies.com',
        BABA: 'alibabagroup.com',
        JD: 'jd.com',
        BIDU: 'baidu.com',
        NTES: 'netease.com',
        PDD: 'pddholdings.com',
        TCEHY: 'tencent.com',
        SONY: 'sony.com',
        TM: 'global.toyota',
        HMC: 'honda.co.jp',
        BP: 'bp.com',
        RIO: 'riotinto.com',
        BHP: 'bhp.com',
        VALE: 'vale.com',
        SAN: 'santander.com',
        BBVA: 'bbva.com',
        ING: 'ing.com',
        HSBC: 'hsbc.com',
        LYG: 'lloydsbankinggroup.com',
        NWG: 'natwestgroup.com',
        UBS: 'ubs.com',
        DB: 'db.com',
        BCS: 'barclays.com',
        NVS: 'novartis.com',
        SNY: 'sanofi.com',
        GSK: 'gsk.com',
        UL: 'unilever.com',
        DEO: 'diageo.com',
        BUD: 'ab-inbev.com',
        NSRGY: 'nestle.com',

        // US — Fintech, crypto and consumer internet
        SOFI: 'sofi.com',
        AFRM: 'affirm.com',
        UPST: 'upstart.com',
        LC: 'lendingclub.com',
        MSTR: 'strategy.com',
        MARA: 'mara.com',
        RIOT: 'riotplatforms.com',
        CLSK: 'cleanspark.com',
        HUT: 'hut8.com',
        CIFR: 'ciphermining.com',
        CORZ: 'corescientific.com',
        CHWY: 'chewy.com',
        W: 'wayfair.com',
        CVNA: 'carvana.com',
        LYFT: 'lyft.com',
        PINS: 'pinterest.com',
        SNAP: 'snap.com',
        RDDT: 'redditinc.com',
        ZM: 'zoom.us',
        DBX: 'dropbox.com',
        BOX: 'box.com',
        U: 'unity.com',
        SHOP: 'shopify.com',
        SE: 'sea.com',
        MELI: 'mercadolibre.com',
        CPNG: 'coupang.com',
        NU: 'nu.com.br',
        GRAB: 'grab.com',
        ROKU: 'roku.com',
        SIRI: 'siriusxm.com',

        // US — Software, cyber and AI
        TEAM: 'atlassian.com',
        ESTC: 'elastic.co',
        GTLB: 'gitlab.com',
        CFLT: 'confluent.io',
        S: 'sentinelone.com',
        CYBR: 'cyberark.com',
        QLYS: 'qualys.com',
        TENB: 'tenable.com',
        RPD: 'rapid7.com',
        VRNS: 'varonis.com',
        FIVN: 'five9.com',
        WIX: 'wix.com',
        MNDY: 'monday.com',
        CHKP: 'checkpoint.com',
        IOT: 'samsara.com',
        APPF: 'appfolio.com',
        MANH: 'manh.com',
        BSY: 'bentley.com',
        DT: 'dynatrace.com',
        NTNX: 'nutanix.com',
        PSTG: 'purestorage.com',
        AI: 'c3.ai',
        SOUN: 'soundhound.com',
        BBAI: 'bigbear.ai',
        IONQ: 'ionq.com',
        RGTI: 'rigetti.com',
        NBIS: 'nebius.com',
        CRWV: 'coreweave.com',
        ALAB: 'asteralabs.com',

        // US — Semiconductors and hardware
        ARM: 'arm.com',
        CIEN: 'ciena.com',
        ACLS: 'axcelis.com',
        ENTG: 'entegris.com',
        MKSI: 'mks.com',
        AMKR: 'amkor.com',
        UMC: 'umc.com',
        SONO: 'sonos.com',
        GPRO: 'gopro.com',

        // US — EV, solar and clean energy
        RIVN: 'rivian.com',
        LCID: 'lucidmotors.com',
        NIO: 'nio.com',
        XPEV: 'xpeng.com',
        LI: 'lixiang.com',
        PLUG: 'plugpower.com',
        FCEL: 'fuelcellenergy.com',
        BE: 'bloomenergy.com',
        RUN: 'sunrun.com',
        SEDG: 'solaredge.com',
        CHPT: 'chargepoint.com',
        CCJ: 'cameco.com',
        UEC: 'uraniumenergy.com',
        UUUU: 'energyfuels.com',
        LEU: 'centrusenergy.com',
        SMR: 'nuscalepower.com',
        OKLO: 'oklo.com',
        BWXT: 'bwxt.com',

        // US — Retail, restaurants and consumer brands
        ANF: 'anfcorp.com',
        AEO: 'aeo-inc.com',
        URBN: 'urbn.com',
        GAP: 'gapinc.com',
        M: 'macysinc.com',
        KSS: 'kohls.com',
        BURL: 'burlington.com',
        FIVE: 'fivebelow.com',
        OLLI: 'ollies.us',
        BJ: 'bjs.com',
        SFM: 'sprouts.com',
        CASY: 'caseys.com',
        WING: 'wingstop.com',
        SHAK: 'shakeshack.com',
        CAVA: 'cava.com',
        TXRH: 'texasroadhouse.com',
        PZZA: 'papajohns.com',
        WEN: 'wendys.com',
        QSR: 'rbi.com',
        ARMK: 'aramark.com',
        CROX: 'crocs.com',
        SKX: 'skechers.com',
        ONON: 'on.com',
        BIRK: 'birkenstock.com',
        UAA: 'underarmour.com',
        COLM: 'columbia.com',
        FL: 'footlocker.com',
        DKS: 'dickssportinggoods.com',
        BBWI: 'bbwinc.com',
        VSCO: 'victoriassecret.com',
        LEVI: 'levistrauss.com',
        YETI: 'yeti.com',
        PTON: 'onepeloton.com',
        HIMS: 'hims.com',
        CELH: 'celsius.com',
        SAM: 'bostonbeer.com',
        FIZZ: 'nationalbeverage.com',
        UTZ: 'utzsnacks.com',
        POST: 'postholdings.com',
        FRPT: 'freshpet.com',

        // US — Biotech and health care
        ILMN: 'illumina.com',
        EXAS: 'exactsciences.com',
        NTRA: 'natera.com',
        TXG: '10xgenomics.com',
        CRSP: 'crisprtx.com',
        NTLA: 'intelliatx.com',
        BEAM: 'beamtx.com',
        SRPT: 'sarepta.com',
        ALNY: 'alnylam.com',
        BMRN: 'biomarin.com',
        NBIX: 'neurocrine.com',
        UTHR: 'unither.com',
        EXEL: 'exelixis.com',
        HALO: 'halozyme.com',
        JAZZ: 'jazzpharma.com',
        ARGX: 'argenx.com',
        LEGN: 'legendbiotech.com',
        IONS: 'ionispharma.com',
        RARE: 'ultragenyx.com',
        VKTX: 'vikingtherapeutics.com',
        TDOC: 'teladoc.com',
        DOCS: 'doximity.com',
        VEEV: 'veeva.com',
        GKOS: 'glaukos.com',
        TNDM: 'tandemdiabetes.com',
        NVCR: 'novocure.com',
        GMED: 'globusmedical.com',
        ELAN: 'elanco.com',
        PRGO: 'perrigo.com',

        // US — Industrials, defense and construction
        KTOS: 'kratosdefense.com',
        AVAV: 'avinc.com',
        HII: 'hii.com',
        CW: 'curtisswright.com',
        HEI: 'heico.com',
        ERJ: 'embraer.com',
        FLR: 'fluor.com',
        KBR: 'kbr.com',
        ACM: 'aecom.com',
        MTZ: 'mastec.com',
        FIX: 'comfortsystemsusa.com',
        AAON: 'aaon.com',
        TREX: 'trex.com',
        BLD: 'topbuild.com',

        // US — Metals, mining and oil & gas
        GOLD: 'barrick.com',
        AEM: 'agnicoeagle.com',
        KGC: 'kinross.com',
        WPM: 'wheatonpm.com',
        FNV: 'franconevada.com',
        RGLD: 'royalgold.com',
        HL: 'hecla.com',
        CDE: 'coeur.com',
        PAAS: 'panamericansilver.com',
        MP: 'mpmaterials.com',
        LAC: 'lithiumamericas.com',
        SQM: 'sqm.com',
        CLF: 'clevelandcliffs.com',
        AA: 'alcoa.com',
        TECK: 'teck.com',
        SM: 'sm-energy.com',
        MTDR: 'matadorresources.com',
        CHRD: 'chordenergy.com',
        PR: 'permianresources.com',
        RRC: 'rangeresources.com',
        AR: 'anteroresources.com',
        CNX: 'cnx.com',
        LNG: 'cheniere.com',

        // US — REITs and financial services
        AGNC: 'agnc.com',
        NLY: 'annaly.com',
        STWD: 'starwoodpropertytrust.com',
        OHI: 'ohihealthcare.com',
        NNN: 'nnnreit.com',
        ADC: 'agreerealty.com',
        STAG: 'stagindustrial.com',
        REXR: 'rexfordindustrial.com',
        COLD: 'americold.com',
        LAMR: 'lamar.com',
        CUBE: 'cubesmart.com',
        AMH: 'americanhomes4rent.com',
        ELS: 'equitylifestyle.com',
        WPC: 'wpcarey.com',
        GLPI: 'glpropinc.com',
        LPLA: 'lpl.com',
        SF: 'stifel.com',
        EVR: 'evercore.com',
        LAZ: 'lazard.com',
        HLI: 'hl.com',
        PJT: 'pjtpartners.com',
        VIRT: 'virtu.com',
        OWL: 'blueowl.com',
        ARES: 'aresmgmt.com',
        CG: 'carlyle.com',
        TPG: 'tpg.com',
        BN: 'brookfield.com',
        SLM: 'slm.com',
        ALLY: 'ally.com',
        OMF: 'onemainfinancial.com',
        RLI: 'rlicorp.com',
        KNSL: 'kinsaleinsurance.com',
        PRI: 'primerica.com',
        AFG: 'afginc.com',
        ORI: 'oldrepublic.com',
        FNF: 'fnf.com',
        FAF: 'firstam.com',
        MTG: 'mgic.com',
        RDN: 'radian.com',
        AXS: 'axiscapital.com',
        RNR: 'renre.com',
        JXN: 'jackson.com',
        CRBG: 'corebridgefinancial.com',
        UNM: 'unum.com',
        VOYA: 'voya.com',
        LMND: 'lemonade.com'
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
