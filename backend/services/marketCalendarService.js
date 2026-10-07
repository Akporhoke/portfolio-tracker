/*
 * Market Calendar service (the business layer).
 *
 *   sources -> normalize -> validate -> MongoDB -> API
 *
 * Routes and the scheduler call this file. They contain no
 * calendar logic of their own.
 */

const MarketCalendar =
    require('../models/MarketCalendar');

const sources =
    require('./marketCalendarSources');

const validator =
    require('./marketCalendarValidator');

const dates =
    require('../utils/marketCalendarDates');


const MARKETS = ['NGX', 'US'];

const US_SESSION = {
    open: '09:30',
    close: '16:00',
    timeZone: 'America/New_York'
};

const US_EARLY_CLOSE = '13:00';


/* ============================================================
   SESSION SHAPE
   ============================================================ */

function buildSession(market, status) {
    if (status === 'closed') {
        return {
            open: null,
            close: null,
            timeZone: null
        };
    }

    // NGX session times are left empty on purpose: public sources
    // disagree on them and only the holiday status is verified.
    if (market === 'NGX') {
        return {
            open: null,
            close: null,
            timeZone: 'Africa/Lagos'
        };
    }

    return {
        open: US_SESSION.open,

        close:
            status === 'early_close'
                ? US_EARLY_CLOSE
                : US_SESSION.close,

        timeZone: US_SESSION.timeZone
    };
}


/* ============================================================
   BUILD ONE MARKET-MONTH
   ============================================================ */

async function buildMarketMonthDocs(
    market,
    monthKey,
    options = {}
) {
    const primary =
        sources.getPrimaryEntries(market, monthKey);

    const secondary =
        await sources.getSecondaryEntries(
            market,
            monthKey,
            { fresh: Boolean(options.fresh) }
        );

    const now = new Date();

    const docs = [];
    const results = [];

    for (const date of dates.datesInMonth(monthKey)) {

        // Weekends come from real weekday maths, not from any source
        if (dates.isWeekend(date)) {
            docs.push({
                market,
                date,
                month: monthKey,
                status: 'closed',

                reason: {
                    type: 'Weekend',
                    name: 'Weekend'
                },

                session: buildSession(market, 'closed'),

                verification: {
                    primaryStatus: 'closed',
                    secondaryStatus: 'closed',
                    status: 'matched',
                    checkedAt: now
                },

                source: {
                    primary: 'calendar-weekday',
                    secondary: 'calendar-weekday'
                }
            });

            continue;
        }

        const primaryEntry =
            primary.entries[date] || null;

        const secondaryEntry =
            secondary.entries[date] || null;

        const comparison =
            validator.compareDay(
                primaryEntry,
                secondaryEntry,
                secondary.available
            );

        results.push(comparison);

        const status =
            primaryEntry
                ? primaryEntry.status
                : 'trading';

        docs.push({
            market,
            date,
            month: monthKey,
            status,

            reason:
                primaryEntry
                    ? {
                        type: primaryEntry.type,
                        name: primaryEntry.name
                    }
                    : null,

            session: buildSession(market, status),

            verification: {
                primaryStatus: comparison.primaryStatus,
                secondaryStatus: comparison.secondaryStatus,
                status: comparison.status,
                checkedAt: now
            },

            source: {
                primary: primary.label,
                secondary: secondary.label
            }
        });
    }

    return {
        docs,
        summary: validator.summarize(results)
    };
}


/* ============================================================
   SAVE (writes only what changed)
   ============================================================ */

function fingerprint(doc) {
    return JSON.stringify([
        doc.status,
        doc.reason
            ? [doc.reason.type, doc.reason.name]
            : null,
        doc.session
            ? [doc.session.open, doc.session.close, doc.session.timeZone]
            : null,
        doc.verification
            ? [
                doc.verification.primaryStatus,
                doc.verification.secondaryStatus,
                doc.verification.status
            ]
            : null
    ]);
}


async function saveDocs(market, monthKey, docs) {
    const existing =
        await MarketCalendar.find({
            market,
            month: monthKey
        }).lean();

    const existingByDate = new Map();

    for (const doc of existing) {
        existingByDate.set(doc.date, doc);
    }

    const operations = [];

    let unchanged = 0;

    for (const doc of docs) {
        const current = existingByDate.get(doc.date);

        if (current) {

            // Do not downgrade a verified day to "unverified" just
            // because the secondary source was down this time
            if (
                doc.verification.status === 'unverified' &&
                current.verification &&
                current.verification.status !== 'unverified' &&
                current.status === doc.status
            ) {
                unchanged++;
                continue;
            }

            if (fingerprint(current) === fingerprint(doc)) {
                unchanged++;
                continue;
            }
        }

        operations.push({
            updateOne: {
                filter: {
                    market: doc.market,
                    date: doc.date
                },

                update: {
                    $set: doc
                },

                upsert: true
            }
        });
    }

    if (operations.length > 0) {
        await MarketCalendar.bulkWrite(
            operations,
            { ordered: false }
        );
    }

    return {
        written: operations.length,
        unchanged
    };
}


/* ============================================================
   REFRESH / VERIFY
   ============================================================ */

async function refreshCalendarMonth(
    monthKey,
    options = {}
) {
    const report = {};

    for (const market of MARKETS) {
        const built =
            await buildMarketMonthDocs(
                market,
                monthKey,
                options
            );

        const saved =
            await saveDocs(
                market,
                monthKey,
                built.docs
            );

        report[market] = {
            ...saved,
            verification: built.summary
        };
    }

    return report;
}


// Verification is a forced refresh that bypasses the source cache
async function verifyCalendarMonth(monthKey) {
    return refreshCalendarMonth(
        monthKey,
        { fresh: true }
    );
}


async function monthNeedsAttention(monthKey) {
    const count =
        await MarketCalendar.countDocuments({
            month: monthKey,
            'verification.status': {
                $in: ['mismatch', 'unverified']
            }
        });

    return count > 0;
}


/* ============================================================
   ROLLING WINDOW
   3 previous + current + next
   ============================================================ */

async function isMonthComplete(monthKey) {
    const expected =
        dates.datesInMonth(monthKey).length * MARKETS.length;

    const count =
        await MarketCalendar.countDocuments({
            month: monthKey
        });

    return count >= expected;
}


async function ensureRollingWindow() {
    const built = [];

    for (const monthKey of dates.getWindowMonths()) {
        if (await isMonthComplete(monthKey)) {
            continue;
        }

        await refreshCalendarMonth(monthKey);

        built.push(monthKey);
    }

    return built;
}


async function cleanupOldMonths() {
    const oldest = dates.getWindowMonths()[0];

    const result =
        await MarketCalendar.deleteMany({
            month: { $lt: oldest }
        });

    return result.deletedCount || 0;
}


/* ============================================================
   READ (used by the API)
   ============================================================ */

async function getCalendarMonth(monthKey) {

    // Self-heal: build the month if it is missing or incomplete
    if (!(await isMonthComplete(monthKey))) {
        await refreshCalendarMonth(monthKey);
    }

    const docs =
        await MarketCalendar.find({
            month: monthKey
        }).lean();

    const days = {};

    for (const doc of docs) {
        if (!days[doc.date]) {
            days[doc.date] = {};
        }

        days[doc.date][doc.market] = {
            status: doc.status,
            reason: doc.reason || null,
            session: doc.session || null,
            verification:
                doc.verification
                    ? doc.verification.status
                    : 'unverified',
            secondaryStatus:
                doc.verification
                    ? doc.verification.secondaryStatus
                    : null
        };
    }

    return days;
}


async function getMismatches() {
    const months = dates.getWindowMonths();

    return MarketCalendar.find({
        month: { $in: months },
        'verification.status': 'mismatch'
    })
        .sort({ date: 1, market: 1 })
        .select({
            market: 1,
            date: 1,
            status: 1,
            reason: 1,
            verification: 1,
            source: 1,
            _id: 0
        })
        .lean();
}


module.exports = {
    getCalendarMonth,
    refreshCalendarMonth,
    verifyCalendarMonth,
    ensureRollingWindow,
    cleanupOldMonths,
    monthNeedsAttention,
    getMismatches
};