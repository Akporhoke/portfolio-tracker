const fs = require('fs');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
require('dotenv').config();

const Stock = require('./models/Stock');

/*
==================================================
CONFIG
==================================================
*/

const PDF_PATH =
    './data/Daily Official List - Equities for 18-09-2026.pdf';

const SOURCE =
    'NGX Daily Official List';

/*
IMPORTANT:

Keep this TRUE while testing the parser.

The script will parse and validate the PDF,
but it will NOT modify MongoDB.

Once the parser output is confirmed clean,
change this to false.
*/

const DRY_RUN = false;


/*
==================================================
KNOWN TABLE / HEADER WORDS
==================================================
*/

const BLOCKED_TICKERS = new Set([
    'EQTY',
    'MARKET',
    'PRICE',
    'EX',
    'BUSINESS',
    'DONE',
    'EPS',
    'PE',
    'DIV',
    'SC',
    'DATE',
    'PAID',
    'INTERIMFINAL',
    'QTY',
    'HIGH',
    'LOW',
    'MAIN',
    'BOARD',
    'PREMIUM',
    'SYMBOL',
    'SECURITY',
    'NAME',
    'QUOTATION',
    'CURRENT',
    'LAST',
    'DIVIDENDS'
]);


/*
==================================================
NGX CLASSIFICATIONS
==================================================
*/

const NGX_CLASSIFICATIONS = {

    ELLAHLAKES: {
        sector: 'Consumer Defensive',
        industry: 'Agriculture'
    },

    FTNCOCOA: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    OKOMUOIL: {
        sector: 'Consumer Defensive',
        industry: 'Agriculture'
    },

    PRESCO: {
        sector: 'Consumer Defensive',
        industry: 'Agriculture'
    },

    LIVESTOCK: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    CUSTODIAN: {
        sector: 'Financial Services',
        industry: 'Investment Management'
    },

    JOHNHOLT: {
        sector: 'Industrials',
        industry: 'Diversified Industries'
    },

    SCOA: {
        sector: 'Consumer Cyclical',
        industry: 'Automobile & Industrial Services'
    },

    TRANSCORP: {
        sector: 'Industrials',
        industry: 'Conglomerates'
    },

    UACN: {
        sector: 'Consumer Defensive',
        industry: 'Diversified Consumer Goods'
    },

    AVAIF: {
        sector: 'Real Estate',
        industry: 'Infrastructure Fund'
    },

    CNIF: {
        sector: 'Real Estate',
        industry: 'Infrastructure Fund'
    },

    JBERGER: {
        sector: 'Industrials',
        industry: 'Construction & Engineering'
    },

    MOFIREIF: {
        sector: 'Real Estate',
        industry: 'Real Estate Investment Fund'
    },

    NIDF: {
        sector: 'Financial Services',
        industry: 'Infrastructure Debt Fund'
    },

    HMCALL: {
        sector: 'Real Estate',
        industry: 'Real Estate'
    },

    UPDC: {
        sector: 'Real Estate',
        industry: 'Real Estate Development'
    },

    NREIT: {
        sector: 'Real Estate',
        industry: 'REIT'
    },

    CHAMPION: {
        sector: 'Consumer Defensive',
        industry: 'Beverages'
    },

    GOLDBREW: {
        sector: 'Consumer Defensive',
        industry: 'Beverages'
    },

    GUINNESS: {
        sector: 'Consumer Defensive',
        industry: 'Beverages'
    },

    INTBREW: {
        sector: 'Consumer Defensive',
        industry: 'Beverages'
    },

    NB: {
        sector: 'Consumer Defensive',
        industry: 'Beverages'
    },

    BUAFOODS: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    DANGSUGAR: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    HONYFLOUR: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    MULTITREX: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    NASCON: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    NNFM: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    UNIONDICON: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    CADBURY: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    NESTLE: {
        sector: 'Consumer Defensive',
        industry: 'Food Products'
    },

    ENAMELWA: {
        sector: 'Consumer Defensive',
        industry: 'Household Products'
    },

    VITAFOAM: {
        sector: 'Consumer Cyclical',
        industry: 'Furnishings'
    },

    PZ: {
        sector: 'Consumer Defensive',
        industry: 'Personal & Household Products'
    },

    UNILEVER: {
        sector: 'Consumer Defensive',
        industry: 'Personal & Household Products'
    },

    ETI: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    FIDELITYBK: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    GTCO: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    STERLINGNG: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    UNITYBNK: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    WEMABANK: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    AFRINSURE: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    AIICO: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    CONHALLPLC: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    CORNERST: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    FTGINSURE: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    GUINEAINS: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    INTENEGINS: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    LASACO: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    LINKASSURE: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    MANSARD: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    MBENEFIT: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    NEM: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    PRESTIGE: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    REGALINS: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    SOVRENINS: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    STACO: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    SUNUASSUR: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    UNIVINSURE: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    VERITASKAP: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    WAPIC: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    NPFMCRFBK: {
        sector: 'Financial Services',
        industry: 'Microfinance Banking'
    },

    ABBEYBANK: {
        sector: 'Financial Services',
        industry: 'Mortgage Banking'
    },

    INFINITY: {
        sector: 'Financial Services',
        industry: 'Mortgage Banking'
    },

    AFRIPRUD: {
        sector: 'Financial Services',
        industry: 'Financial Services'
    },

    AVACAP: {
        sector: 'Financial Services',
        industry: 'Investment Management'
    },

    CMFC: {
        sector: 'Financial Services',
        industry: 'Investment Management'
    },

    FCMB: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    NGXGROUP: {
        sector: 'Financial Services',
        industry: 'Financial Exchange'
    },

    ROYALEX: {
        sector: 'Financial Services',
        industry: 'Insurance'
    },

    STANBIC: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    UCAP: {
        sector: 'Financial Services',
        industry: 'Investment Management'
    },

    EKOCORP: {
        sector: 'Healthcare',
        industry: 'Healthcare'
    },

    MORISON: {
        sector: 'Healthcare',
        industry: 'Healthcare'
    },

    FIDSON: {
        sector: 'Healthcare',
        industry: 'Pharmaceuticals'
    },

    MAYBAKER: {
        sector: 'Healthcare',
        industry: 'Pharmaceuticals'
    },

    NEIMETH: {
        sector: 'Healthcare',
        industry: 'Pharmaceuticals'
    },

    PHARMDEKO: {
        sector: 'Healthcare',
        industry: 'Pharmaceuticals'
    },

    OMATEK: {
        sector: 'Technology',
        industry: 'Technology'
    },

    CWG: {
        sector: 'Technology',
        industry: 'IT Services'
    },

    NCR: {
        sector: 'Technology',
        industry: 'Technology Hardware'
    },

    CHAMS: {
        sector: 'Technology',
        industry: 'IT Services'
    },

    ETRANZACT: {
        sector: 'Technology',
        industry: 'Fintech'
    },

    AIRTELAFRI: {
        sector: 'Communication Services',
        industry: 'Telecommunications'
    },

    LEGENDINT: {
        sector: 'Communication Services',
        industry: 'Internet Services'
    },

    BERGER: {
        sector: 'Industrials',
        industry: 'Building Materials'
    },

    BUACEMENT: {
        sector: 'Industrials',
        industry: 'Building Materials'
    },

    CAP: {
        sector: 'Industrials',
        industry: 'Chemicals'
    },

    MEYER: {
        sector: 'Industrials',
        industry: 'Building Materials'
    },

    PREMPAINTS: {
        sector: 'Industrials',
        industry: 'Building Materials'
    },

    AUSTINLAZ: {
        sector: 'Industrials',
        industry: 'Engineering'
    },

    CUTIX: {
        sector: 'Industrials',
        industry: 'Electrical Products'
    },

    BETAGLAS: {
        sector: 'Industrials',
        industry: 'Packaging'
    },

    TRIPPLEG: {
        sector: 'Industrials',
        industry: 'Printing & Packaging'
    },

    VFDGROUP: {
        sector: 'Financial Services',
        industry: 'Financial Services'
    },

    IMG: {
        sector: 'Healthcare',
        industry: 'Medical Equipment & Supplies'
    },

    ALEX: {
        sector: 'Industrials',
        industry: 'Aluminium & Metals'
    },

    MULTIVERSE: {
        sector: 'Basic Materials',
        industry: 'Mining'
    },

    THOMASWY: {
        sector: 'Industrials',
        industry: 'Engineering'
    },

    JAPAULGOLD: {
        sector: 'Basic Materials',
        industry: 'Mining'
    },

    ARADEL: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    OANDO: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    CONOIL: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    ETERNA: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    TOTAL: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    AFROMEDIA: {
        sector: 'Communication Services',
        industry: 'Media'
    },

    RTBRISCOE: {
        sector: 'Consumer Cyclical',
        industry: 'Automobile Services'
    },

    REDSTAREX: {
        sector: 'Industrials',
        industry: 'Logistics'
    },

    TRANSEXPR: {
        sector: 'Industrials',
        industry: 'Logistics'
    },

    TANTALIZER: {
        sector: 'Consumer Cyclical',
        industry: 'Restaurants'
    },

    IKEJAHOTEL: {
        sector: 'Consumer Cyclical',
        industry: 'Hotels'
    },

    TRANSCOHOT: {
        sector: 'Consumer Cyclical',
        industry: 'Hotels'
    },

    DAARCOMM: {
        sector: 'Communication Services',
        industry: 'Media'
    },

    ACADEMY: {
        sector: 'Communication Services',
        industry: 'Printing & Publishing'
    },

    LEARNAFRCA: {
        sector: 'Consumer Defensive',
        industry: 'Education'
    },

    UPL: {
        sector: 'Communication Services',
        industry: 'Printing & Publishing'
    },

    ABCTRANS: {
        sector: 'Industrials',
        industry: 'Transportation'
    },

    EUNISELL: {
        sector: 'Industrials',
        industry: 'Industrial Services'
    },

    NSLTECH: {
        sector: 'Technology',
        industry: 'Technology'
    },

    CAVERTON: {
        sector: 'Industrials',
        industry: 'Aviation Services'
    },

    CILEASING: {
        sector: 'Financial Services',
        industry: 'Leasing'
    },

    NAHCO: {
        sector: 'Industrials',
        industry: 'Aviation Services'
    },

    SKYAVN: {
        sector: 'Industrials',
        industry: 'Aviation Services'
    },

    GEREGU: {
        sector: 'Utilities',
        industry: 'Electricity Generation'
    },

    TRANSPOWER: {
        sector: 'Utilities',
        industry: 'Electricity Generation'
    },

    UBA: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    ZENITHBANK: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    ACCESSCORP: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    FIRSTHOLDCO: {
        sector: 'Financial Services',
        industry: 'Banks'
    },

    MTNN: {
        sector: 'Communication Services',
        industry: 'Telecommunications'
    },

    DANGCEM: {
        sector: 'Industrials',
        industry: 'Building Materials'
    },

    HBMNG: {
        sector: 'Industrials',
        industry: 'Construction & Engineering'
    },

    SEPLAT: {
        sector: 'Energy',
        industry: 'Oil & Gas'
    },

    SFSREIT: {
        sector: 'Real Estate',
        industry: 'REIT'
    },

    UHOMREIT: {
        sector: 'Real Estate',
        industry: 'REIT'
    },

    UPDCREIT: {
        sector: 'Real Estate',
        industry: 'REIT'
    }
};


/*
==================================================
SECTOR MAPPING FALLBACK
==================================================
*/

function mapGazeSector(mainSector, industry) {

    const text = [
        mainSector,
        industry
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    // Financial Services
    if (
        /bank|banking|insurance|assurance|financial|finance|investment|capital|mortgage|microfinance|securit|asset management|trust company|exchange group/.test(text)
    ) {
        return 'Financial Services';
    }

    // Technology
    if (
        /technology|telecom|telecommunications|ict|computer|software|internet|electronic technology|e-transaction|digital/.test(text)
    ) {
        return 'Technology';
    }

    // Healthcare
    if (
        /health|healthcare|pharmaceutical|pharma|medical|hospital|diagnostic/.test(text)
    ) {
        return 'Healthcare';
    }

    // Energy
    if (
        /oil|gas|petroleum|energy|exploration|production|upstream|downstream|refin/.test(text)
    ) {
        return 'Energy';
    }

    // Real Estate
    if (
        /real estate|reit|property|estate development|realty/.test(text)
    ) {
        return 'Real Estate';
    }

    // Utilities
    if (
        /utility|utilities|power|electric|electricity|generation|transmission|distribution/.test(text)
    ) {
        return 'Utilities';
    }

    // Consumer Defensive
    if (
        /agriculture|crop|livestock|food|beverage|brew|distill|flour|salt|consumer goods|household|personal care/.test(text)
    ) {
        return 'Consumer Defensive';
    }

    // Industrials
    if (
        /industrial|construction|building|cement|manufactur|engineering|mining|materials|paint|glass|packaging|chemical|allied products/.test(text)
    ) {
        return 'Industrials';
    }

    // Consumer Cyclical
    if (
        /hotel|hospitality|restaurant|leisure|retail|transport|automobile|motor|travel/.test(text)
    ) {
        return 'Consumer Cyclical';
    }

    // Communication Services
    if (
        /communication|broadcast|media|publishing|television|radio/.test(text)
    ) {
        return 'Communication Services';
    }

    return null;
}


/*
==================================================
VALID TICKER CHECK
==================================================
*/

function isPlausibleTicker(value) {

    const ticker =
        String(value || '')
            .trim()
            .toUpperCase();

    if (!ticker) {
        return false;
    }

    if (BLOCKED_TICKERS.has(ticker)) {
        return false;
    }

    /*
    NGX symbols are normally compact uppercase
    identifiers.

    Allow:

    A-Z
    0-9
    hyphen
    ampersand
    */

    if (!/^[A-Z][A-Z0-9&-]{1,14}$/.test(ticker)) {
        return false;
    }

    if (/\s/.test(ticker)) {
        return false;
    }

    return true;
}


/*
==================================================
SECURITY NAME CHECK
==================================================
*/

function cleanSecurityName(name) {

    return String(name || '')
        .replace(/\s+/g, ' ')
        .replace(/\s+\./g, '.')
        .trim();
}


function isValidSecurityName(name) {

    const value =
        cleanSecurityName(name);

    if (!value) {
        return false;
    }

    if (value.length < 4) {
        return false;
    }

    const upper =
        value.toUpperCase();

    const blockedNames = [
        'MAIN BOARD',
        'PREMIUM BOARD',
        'SYMBOL SECURITY NAME',
        'PAID INTERIMFINAL',
        'DIV DATE',
        'LAST EX',
        'BUSINESS DONE'
    ];

    if (
        blockedNames.some(
            item => upper.includes(item)
        )
    ) {
        return false;
    }

    if (!/[A-Z]/i.test(value)) {
        return false;
    }

    return true;
}


/*
==================================================
PRICE DETECTION
==================================================
*/

function containsPrice(text) {

    /*
    Detect numbers such as:

    0.50
    8.35
    1,418.00
    1050
    7.90
    */

    return /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/.test(
        text
    );
}


/*
==================================================
EXTRACT NAME FROM ROW
==================================================
*/

function extractSecurityName(rowText, ticker) {

    let text =
        String(rowText || '')
            .replace(/\s+/g, ' ')
            .trim();

    /*
    Remove ticker from beginning.
    */

    const tickerRegex =
        new RegExp(
            `^${ticker}\\s+`,
            'i'
        );

    text =
        text.replace(tickerRegex, '');

    /*
    The first quotation number marks the
    beginning of the numeric table fields.

    Everything before it belongs to the
    security name.
    */

    const priceMatch =
        text.match(
            /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/
        );

    if (priceMatch) {

        text =
            text.slice(
                0,
                priceMatch.index
            );
    }

    return cleanSecurityName(text);
}


/*
==================================================
LINE CLASSIFICATION
==================================================
*/

function looksLikeSectorHeading(line) {

    const value =
        String(line || '')
            .trim()
            .toUpperCase();

    const headings = [
        'AGRICULTURE',
        'CONGLOMERATES',
        'CONSTRUCTION/REAL ESTATE',
        'CONSUMER GOODS',
        'FINANCIAL SERVICES',
        'HEALTHCARE',
        'ICT',
        'INDUSTRIAL GOODS',
        'OIL & GAS',
        'SERVICES',
        'UTILITIES'
    ];

    return headings.includes(value);
}


/*
IMPORTANT:

Do NOT infer industry headings.

The PDF extractor can split company names
across multiple lines.

Industry classification is handled separately
through NGX_CLASSIFICATIONS.
*/

function looksLikeIndustryHeading(line) {

    const value =
        String(line || '').trim();

    if (!value) {
        return false;
    }

    if (containsPrice(value)) {
        return false;
    }

    return false;
}


/*
==================================================
TICKER AT START OF LINE
==================================================
*/

function extractStartingTicker(line) {

    const match =
        String(line || '')
            .trim()
            .match(
                /^([A-Z][A-Z0-9&-]{1,14})(?:\s+|$)/
            );

    if (!match) {
        return null;
    }

    const ticker =
        match[1].toUpperCase();

    if (!isPlausibleTicker(ticker)) {
        return null;
    }

    return ticker;
}


/*
==================================================
PARSE PDF
==================================================
*/

function parseNGXDirectory(text) {

    const rawLines =
        String(text || '')
            .split(/\r?\n/)
            .map(line =>
                line.replace(/\u00a0/g, ' ')
            )
            .map(line => line.trim())
            .filter(Boolean);

    const records = [];

    let currentMainSector = null;
    let currentIndustry = null;
    let pendingRow = null;


    function finalizePendingRow() {

        if (!pendingRow) {
            return;
        }

        const ticker =
            pendingRow.ticker;

        const combined =
            pendingRow.lines.join(' ');

        /*
        A valid row must contain a quotation
        number somewhere after the ticker.
        */

        if (!containsPrice(combined)) {
            pendingRow = null;
            return;
        }

        const name =
            extractSecurityName(
                combined,
                ticker
            );

        if (!isValidSecurityName(name)) {
            pendingRow = null;
            return;
        }

        const upperName =
            name.toUpperCase();

        if (
            upperName === 'COMPANY PLC' ||
            upperName === 'MILLS PLC' ||
            upperName === 'FUND' ||
            upperName === 'HOLDINGS PLC' ||
            upperName === 'PLC' ||
            upperName === 'DEBT FUND'
        ) {
            pendingRow = null;
            return;
        }


        /*
        Use explicit classification when available.
        Fall back to the PDF sector mapping when
        classification is unavailable.
        */

        const classification =
            NGX_CLASSIFICATIONS[ticker];

        const gazeSector =
            classification?.sector ||
            mapGazeSector(
                currentMainSector,
                currentIndustry
            );

        const industry =
            classification?.industry ||
            null;


        records.push({

            ticker,

            name,

            market: 'NGX',

            exchange: 'NGX',

            country: 'Nigeria',

            sector: gazeSector || '',

            industry: industry || '',

            aliases: [],

            active: true,

            source: SOURCE,

            lastUpdated: new Date()

        });

        pendingRow = null;
    }


    for (
        let i = 0;
        i < rawLines.length;
        i++
    ) {

        const line =
            rawLines[i];


        /*
        ------------------------------------------
        SECTION HEADINGS
        ------------------------------------------
        */

        if (looksLikeSectorHeading(line)) {

            finalizePendingRow();

            currentMainSector =
                line.trim();

            currentIndustry = null;

            continue;
        }


        /*
        ------------------------------------------
        TABLE HEADER
        ------------------------------------------
        */

        const upper =
            line.toUpperCase();

        if (
            upper.includes(
                'SYMBOL SECURITY NAME'
            ) ||
            upper.includes(
                'OFFICIAL OPEN'
            ) ||
            upper.includes(
                'CURRENT MARKET PRICE'
            ) ||
            upper.includes(
                'BUSINESS DONE'
            ) ||
            upper.includes(
                'DIVIDENDS EPS'
            )
        ) {

            finalizePendingRow();

            continue;
        }


        /*
        ------------------------------------------
        INDUSTRY HEADING
        ------------------------------------------
        */

        if (
            looksLikeIndustryHeading(line)
        ) {

            finalizePendingRow();

            if (
                !line
                    .toUpperCase()
                    .includes('SYMBOL')
            ) {

                currentIndustry =
                    line.trim();
            }

            continue;
        }


        /*
        ------------------------------------------
        IF A ROW IS CURRENTLY BEING BUILT
        ------------------------------------------
        */

        if (pendingRow) {

            pendingRow.lines.push(line);

            if (
                containsPrice(
                    pendingRow.lines.join(' ')
                )
            ) {

                finalizePendingRow();
            }

            continue;
        }


        /*
        ------------------------------------------
        START NEW STOCK ROW
        ------------------------------------------
        */

        const ticker =
            extractStartingTicker(line);

        if (!ticker) {
            continue;
        }

        if (
            upper.includes('BOARD') ||
            upper.includes('SYMBOL SECURITY')
        ) {
            continue;
        }

        pendingRow = {

            ticker,

            lines: [line]

        };


        /*
        If the entire row is on one line,
        finalize immediately.
        */

        if (containsPrice(line)) {

            finalizePendingRow();
        }
    }


    /*
    Finish final pending row.
    */

    finalizePendingRow();


    /*
    ------------------------------------------
    DEDUPLICATE
    ------------------------------------------
    */

    const unique =
        new Map();

    for (const record of records) {

        const key =
            `${record.ticker}|${record.market}`;

        if (!unique.has(key)) {

            unique.set(
                key,
                record
            );
        }
    }

    return Array.from(
        unique.values()
    );
}


/*
==================================================
VALIDATION
==================================================
*/

function validateRecords(records) {

    const problems = [];


    /*
    ------------------------------------------
    DETECT OBVIOUS CONTINUATION RECORDS
    ------------------------------------------
    */

    for (const record of records) {

        const ticker =
            record.ticker.toUpperCase();

        const name =
            record.name.toUpperCase();


        for (const other of records) {

            if (other === record) {
                continue;
            }

            const otherName =
                other.name.toUpperCase();

            const escaped =
                ticker.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

            const appearsInside =
                new RegExp(
                    `\\b${escaped}\\b`,
                    'i'
                ).test(otherName);


            /*
            UPDC → UPDC PLC
            BERGER → BERGER PAINTS PLC

            These are legitimate security names
            because the ticker appears at the
            beginning of its own name.
            */

            const tickerIsAtBeginningOfOwnName =
                name === ticker ||
                name.startsWith(`${ticker} `);


            if (
                appearsInside &&
                !tickerIsAtBeginningOfOwnName &&
                name.length < otherName.length
            ) {

                problems.push(
                    `Possible continuation ticker: ${record.ticker} → ${record.name}`
                );

                break;
            }
        }


        /*
        ------------------------------------------
        REJECT SUSPICIOUS SECURITY NAMES
        ------------------------------------------
        */

        const suspiciousNames = [

            'COMPANY PLC',

            'MILLS PLC',

            'FUND',

            'DEBT FUND',

            'HOLDINGS PLC',

            'PLC',

            'PLC.'

        ];

        if (
            suspiciousNames.includes(name)
        ) {

            problems.push(
                `Suspicious security name: ${record.ticker} → ${record.name}`
            );
        }
    }


    /*
    ------------------------------------------
    REMOVE DUPLICATE VALIDATION MESSAGES
    ------------------------------------------
    */

    return [
        ...new Set(problems)
    ];
}


/*
==================================================
MAIN
==================================================
*/

async function syncNGXDirectory() {

    let parser = null;

    try {

        console.log('');

        console.log(
            '================================'
        );

        console.log(
            'GAZE NGX DIRECTORY SYNC'
        );

        console.log(
            '================================'
        );

        console.log('');


        console.log(
            'Reading NGX Daily Official List...'
        );


        if (!fs.existsSync(PDF_PATH)) {

            throw new Error(
                `PDF not found: ${PDF_PATH}`
            );
        }


        console.log(
            '✓ PDF found'
        );


        const buffer =
            fs.readFileSync(PDF_PATH);


        console.log(
            `✓ PDF size: ${buffer.length.toLocaleString()} bytes`
        );


        parser =
            new PDFParse({
                data: buffer
            });


        const extractionResult =
            await parser.getText();


        console.log(
            `✓ Pages extracted: ${extractionResult.total}`
        );


        console.log(
            `✓ Characters extracted: ${extractionResult.text.length.toLocaleString()}`
        );


        console.log('');


        console.log(
            'Parsing NGX stock directory...'
        );


        const records =
            parseNGXDirectory(
                extractionResult.text
            );


        console.log(
            `✓ Unique stocks detected: ${records.length}`
        );


        /*
        ------------------------------------------
        VALIDATION REPORT
        ------------------------------------------
        */

        const problems =
            validateRecords(records);


        console.log('');

        console.log(
            '================================'
        );

        console.log(
            'NGX PARSER VALIDATION REPORT'
        );

        console.log(
            '================================'
        );

        console.log(
            `Detected stocks: ${records.length}`
        );

        console.log(
            `Validation problems: ${problems.length}`
        );


        if (problems.length > 0) {

            console.log('');

            console.log(
                'Problems detected:'
            );

            problems.forEach(
                (problem, index) => {

                    console.log(
                        `${index + 1}. ${problem}`
                    );
                }
            );
        }


        /*
        ------------------------------------------
        PRINT ALL RECORDS
        ------------------------------------------
        */

        console.log('');

        console.log(
            'Detected securities:'
        );

        console.log('');


        records.forEach(
            (stock, index) => {

                console.log(

                    `${String(index + 1).padStart(3)}. ` +

                    `${stock.ticker.padEnd(15)} | ` +

                    `${stock.name.padEnd(45)} | ` +

                    `${stock.sector || 'N/A'} | ` +

                    `${stock.industry || 'N/A'}`
                );
            }
        );


        /*
        ------------------------------------------
        SAFETY CHECKS
        ------------------------------------------
        */

        const MINIMUM_STOCKS = 100;


        if (
            records.length <
            MINIMUM_STOCKS
        ) {

            throw new Error(
                `Safety check failed: only ${records.length} valid stocks detected.`
            );
        }


        if (
            problems.length > 0
        ) {

            throw new Error(
                `Safety check failed: ${problems.length} validation problems found.`
            );
        }


        /*
        ------------------------------------------
        DRY RUN
        ------------------------------------------
        */

        if (DRY_RUN) {

            console.log('');

            console.log(
                '================================'
            );

            console.log(
                'DRY RUN COMPLETE'
            );

            console.log(
                '================================'
            );

            console.log(
                `✓ ${records.length} stocks parsed`
            );

            console.log(
                '✓ MongoDB was NOT modified'
            );

            console.log('');

            console.log(
                'If the detected securities look correct,'
            );

            console.log(
                'change DRY_RUN = false and run the script again.'
            );

            console.log('');

            return;
        }


        /*
        ------------------------------------------
        MONGODB
        ------------------------------------------
        */

        console.log('');

        console.log(
            'Connecting to MongoDB...'
        );


        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            '✓ MongoDB connected'
        );


        /*
        ------------------------------------------
        PREPARE OPERATIONS
        ------------------------------------------
        */

        const operations =
            records.map(stock => ({

                updateOne: {

                    filter: {

                        ticker: stock.ticker,

                        market: 'NGX'

                    },

                    update: {

                        $set: {

                            name: stock.name,

                            exchange:
                                stock.exchange,

                            country:
                                stock.country,

                            sector:
                                stock.sector,

                            industry:
                                stock.industry,

                            aliases:
                                stock.aliases,

                            active: true,

                            source:
                                stock.source,

                            lastUpdated:
                                stock.lastUpdated

                        }

                    },

                    upsert: true

                }

            }));


        console.log(
            `Preparing ${operations.length} database operations...`
        );


        /*
        ------------------------------------------
        SYNC
        ------------------------------------------
        */

        const syncResult =
            await Stock.bulkWrite(
                operations,
                {
                    ordered: false
                }
            );


        console.log(
            '✓ Database sync completed'
        );

        console.log('');


        console.log(
            '================================'
        );

        console.log(
            'NGX DIRECTORY SYNC COMPLETE'
        );

        console.log(
            '================================'
        );

        console.log(
            `Inserted: ${syncResult.upsertedCount || 0}`
        );

        console.log(
            `Modified: ${syncResult.modifiedCount || 0}`
        );

        console.log(
            `Matched: ${syncResult.matchedCount || 0}`
        );

        console.log(
            '================================'
        );

        console.log('');
    }


    catch (error) {

        console.error('');

        console.error(
            '================================'
        );

        console.error(
            'NGX DIRECTORY SYNC FAILED'
        );

        console.error(
            '================================'
        );

        console.error(
            error.message
        );

        console.error('');
    }


    finally {

        if (parser) {

            await parser.destroy();
        }


        if (
            mongoose.connection.readyState === 1
        ) {

            await mongoose.disconnect();

            console.log(
                '✓ MongoDB connection closed'
            );
        }
    }
}


syncNGXDirectory();