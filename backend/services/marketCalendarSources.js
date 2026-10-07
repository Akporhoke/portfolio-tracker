/*
 * Market Calendar sources.
 *
 * This file only RETURNS NORMALIZED DATA. It knows nothing about
 * MongoDB or the frontend.
 *
 * A normalized entry looks like:
 *
 *   { status: 'closed' | 'early_close', name, type }
 *
 * A date with no entry means "normal trading day".
 *
 * NGX
 *   primary:   curated official list (marketCalendarCurated.js)
 *   secondary: Google Calendar "Holidays in Nigeria"
 *
 * US
 *   primary:   curated NYSE schedule (marketCalendarCurated.js)
 *   secondary: NYSE rules computed independently in code. This
 *              catches typos in the curated list. It cannot know
 *              about ad hoc closures, which is why the primary
 *              list stays the authority.
 */

const curated = require('./marketCalendarCurated');

const {
    addMonths
} = require('../utils/marketCalendarDates');


const GOOGLE_CALENDAR_ID =
    process.env.NGX_GOOGLE_CALENDAR_ID ||
    'en.ng.official#holiday@group.v.calendar.google.com';

const GOOGLE_CACHE_MS = 6 * 60 * 60 * 1000;
const GOOGLE_TIMEOUT_MS = 10 * 1000;

const googleCache = new Map();

let warnedNoKey = false;


function inMonth(dateKey, monthKey) {
    return dateKey.startsWith(monthKey + '-');
}


/* ============================================================
   PRIMARY (curated)
   ============================================================ */

function getPrimaryEntries(market, monthKey) {
    const data = curated[market];

    const entries = {};

    if (!data) {
        return {
            label: null,
            entries
        };
    }

    for (const [date, info] of Object.entries(data.holidays || {})) {
        if (inMonth(date, monthKey)) {
            entries[date] = {
                status: 'closed',
                name: info.name,
                type: info.type
            };
        }
    }

    for (const [date, info] of Object.entries(data.earlyCloses || {})) {
        if (inMonth(date, monthKey)) {
            entries[date] = {
                status: 'early_close',
                name: info.name,
                type: info.type
            };
        }
    }

    return {
        label: data.source,
        entries
    };
}


/* ============================================================
   SECONDARY: NGX via Google Calendar
   ============================================================ */

function dateKeyFromUTC(date) {
    return date.toISOString().slice(0, 10);
}


async function fetchGoogleNigeriaMonth(monthKey, fresh) {
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

    if (!apiKey) {
        if (!warnedNoKey) {
            console.warn(
                '[MarketCalendar] GOOGLE_CALENDAR_API_KEY is not set. ' +
                'NGX data will be marked unverified.'
            );

            warnedNoKey = true;
        }

        return {
            available: false,
            entries: {}
        };
    }

    const cacheKey = `${GOOGLE_CALENDAR_ID}|${monthKey}`;
    const cached = googleCache.get(cacheKey);

    if (
        !fresh &&
        cached &&
        Date.now() - cached.at < GOOGLE_CACHE_MS
    ) {
        return cached.value;
    }

    if (typeof fetch !== 'function') {
        console.error(
            '[MarketCalendar] This Node version has no fetch(). Use Node 18+.'
        );

        return {
            available: false,
            entries: {}
        };
    }

    const timeMin = `${monthKey}-01T00:00:00Z`;
    const timeMax = `${addMonths(monthKey, 1)}-01T00:00:00Z`;

    const url =
        'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(GOOGLE_CALENDAR_ID) +
        '/events' +
        `?key=${encodeURIComponent(apiKey)}` +
        `&timeMin=${encodeURIComponent(timeMin)}` +
        `&timeMax=${encodeURIComponent(timeMax)}` +
        '&singleEvents=true&orderBy=startTime&maxResults=250';

    const controller = new AbortController();

    const timer = setTimeout(
        () => controller.abort(),
        GOOGLE_TIMEOUT_MS
    );

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Google Calendar responded ${response.status}`);
        }

        const data = await response.json();

        const entries = {};

        for (const item of data.items || []) {
            const description = String(item.description || '');

            // Google mixes in "Observance" days that do not close the market
            if (/^\s*observance/i.test(description)) {
                continue;
            }

            const startRaw = item.start && item.start.date;
            const endRaw = item.end && item.end.date;

            if (!startRaw) {
                continue;
            }

            // All-day events: end date is exclusive
            const cursor = new Date(`${startRaw}T00:00:00Z`);

            const end = endRaw
                ? new Date(`${endRaw}T00:00:00Z`)
                : new Date(cursor.getTime() + 24 * 60 * 60 * 1000);

            while (cursor < end) {
                const key = dateKeyFromUTC(cursor);

                if (inMonth(key, monthKey)) {
                    entries[key] = {
                        status: 'closed',
                        name: item.summary || 'Public holiday',
                        type: 'Public holiday'
                    };
                }

                cursor.setUTCDate(cursor.getUTCDate() + 1);
            }
        }

        const value = {
            available: true,
            entries
        };

        googleCache.set(cacheKey, {
            at: Date.now(),
            value
        });

        return value;

    } finally {
        clearTimeout(timer);
    }
}


async function getNGXSecondary(monthKey, fresh) {
    try {
        const result = await fetchGoogleNigeriaMonth(monthKey, fresh);

        return {
            label: 'google-calendar-ng',
            available: result.available,
            entries: result.entries
        };

    } catch (error) {
        console.error(
            `[MarketCalendar] Google Nigeria fetch failed for ${monthKey}:`,
            error.message
        );

        return {
            label: 'google-calendar-ng',
            available: false,
            entries: {}
        };
    }
}


/* ============================================================
   SECONDARY: US via NYSE rules computed in code
   ============================================================ */

function utc(year, month, day) {
    return new Date(Date.UTC(year, month, day));
}


function addDays(date, days) {
    const copy = new Date(date.getTime());

    copy.setUTCDate(copy.getUTCDate() + days);

    return copy;
}


function nthWeekday(year, month, weekday, n) {
    const first = utc(year, month, 1);

    const offset = (weekday - first.getUTCDay() + 7) % 7;

    return utc(year, month, 1 + offset + (n - 1) * 7);
}


function lastWeekday(year, month, weekday) {
    const last = utc(year, month + 1, 0);

    const offset = (last.getUTCDay() - weekday + 7) % 7;

    return utc(year, month, last.getUTCDate() - offset);
}


// Anonymous Gregorian algorithm
function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return utc(year, month - 1, day);
}


/*
 * Weekend observance.
 * Sunday -> following Monday.
 * Saturday -> preceding Friday (except New Year's Day, where
 * the NYSE does not close on the Friday before).
 */
function observed(date, saturdayRule) {
    const weekday = date.getUTCDay();

    if (weekday === 6) {
        return saturdayRule === 'none'
            ? null
            : addDays(date, -1);
    }

    if (weekday === 0) {
        return addDays(date, 1);
    }

    return date;
}


function computeUSYear(year) {
    const map = {};

    function closed(date, name) {
        if (date) {
            map[dateKeyFromUTC(date)] = {
                status: 'closed',
                name,
                type: 'Market holiday'
            };
        }
    }

    function early(date, name) {
        const key = dateKeyFromUTC(date);

        if (!map[key]) {
            map[key] = {
                status: 'early_close',
                name,
                type: 'Early close'
            };
        }
    }

    closed(observed(utc(year, 0, 1), 'none'), "New Year's Day");
    closed(nthWeekday(year, 0, 1, 3), 'Martin Luther King Jr. Day');
    closed(nthWeekday(year, 1, 1, 3), "Washington's Birthday");
    closed(addDays(easterSunday(year), -2), 'Good Friday');
    closed(lastWeekday(year, 4, 1), 'Memorial Day');
    closed(observed(utc(year, 5, 19), 'friday'), 'Juneteenth');
    closed(observed(utc(year, 6, 4), 'friday'), 'Independence Day');
    closed(nthWeekday(year, 8, 1, 1), 'Labor Day');

    const thanksgiving = nthWeekday(year, 10, 4, 4);

    closed(thanksgiving, 'Thanksgiving Day');
    closed(observed(utc(year, 11, 25), 'friday'), 'Christmas Day');

    // Early closes (1:00 p.m. ET)
    early(addDays(thanksgiving, 1), 'Day after Thanksgiving');

    const christmasEve = utc(year, 11, 24);
    const christmasEveWeekday = christmasEve.getUTCDay();

    if (christmasEveWeekday >= 1 && christmasEveWeekday <= 4) {
        early(christmasEve, 'Christmas Eve');
    }

    // July 3 closes early when July 4 falls Tuesday to Friday
    const julyFourthWeekday = utc(year, 6, 4).getUTCDay();

    if (julyFourthWeekday >= 2 && julyFourthWeekday <= 5) {
        early(utc(year, 6, 3), 'Day before Independence Day');
    }

    return map;
}


function getUSSecondary(monthKey) {
    const year = Number(monthKey.slice(0, 4));

    const all = {
        ...computeUSYear(year)
    };

    const entries = {};

    for (const [date, entry] of Object.entries(all)) {
        if (inMonth(date, monthKey)) {
            entries[date] = entry;
        }
    }

    return {
        label: 'nyse-rules',
        available: true,
        entries
    };
}


/* ============================================================
   PUBLIC API
   ============================================================ */

async function getSecondaryEntries(market, monthKey, options = {}) {
    if (market === 'US') {
        return getUSSecondary(monthKey);
    }

    return getNGXSecondary(
        monthKey,
        Boolean(options.fresh)
    );
}


module.exports = {
    getPrimaryEntries,
    getSecondaryEntries
};