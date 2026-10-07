/*
 * Date helpers for the Market Calendar.
 *
 * Month keys look like "2026-10". Date keys look like "2026-10-06".
 * All month/date maths uses real calendar dates (UTC arithmetic),
 * never fixed month lengths.
 */

const TIME_ZONE = 'Africa/Lagos';

/* Rolling operational window: 3 previous + current + next */
const PREVIOUS_MONTHS = 3;
const NEXT_MONTHS = 1;


function pad(n) {
    return String(n).padStart(2, '0');
}


function lagosParts(now = new Date()) {
    const parts = new Intl.DateTimeFormat(
        'en-CA',
        {
            timeZone: TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
    ).formatToParts(now);

    const values = {};

    for (const part of parts) {
        values[part.type] = part.value;
    }

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day)
    };
}


function currentMonthKey(now = new Date()) {
    const p = lagosParts(now);

    return `${p.year}-${pad(p.month)}`;
}


function currentDayOfMonth(now = new Date()) {
    return lagosParts(now).day;
}


function addMonths(monthKey, amount) {
    const [year, month] = monthKey.split('-').map(Number);

    const date = new Date(
        Date.UTC(year, month - 1 + amount, 1)
    );

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}


function datesInMonth(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);

    const count = new Date(
        Date.UTC(year, month, 0)
    ).getUTCDate();

    return Array.from(
        { length: count },
        (_, i) => `${monthKey}-${pad(i + 1)}`
    );
}


function isWeekend(dateKey) {
    const weekday = new Date(
        `${dateKey}T00:00:00Z`
    ).getUTCDay();

    return weekday === 0 || weekday === 6;
}


function isValidMonthKey(value) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(value));
}


function getWindowMonths(now = new Date()) {
    const current = currentMonthKey(now);
    const months = [];

    for (let i = -PREVIOUS_MONTHS; i <= NEXT_MONTHS; i++) {
        months.push(addMonths(current, i));
    }

    return months;
}


function isInWindow(monthKey, now = new Date()) {
    return getWindowMonths(now).includes(monthKey);
}


module.exports = {
    TIME_ZONE,
    PREVIOUS_MONTHS,
    NEXT_MONTHS,
    currentMonthKey,
    currentDayOfMonth,
    addMonths,
    datesInMonth,
    isWeekend,
    isValidMonthKey,
    getWindowMonths,
    isInWindow
};