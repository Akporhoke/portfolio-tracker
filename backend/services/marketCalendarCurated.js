/*
 * CURATED PRIMARY CALENDAR DATA
 * ------------------------------------------------------------
 * This is the authority list for each market. Edit it by hand
 * when an official announcement is made, then restart the server
 * (or wait for the next verification run).
 *
 * Only add a date here when it is OFFICIALLY confirmed:
 *
 *   NGX: Nigerian Exchange notices / Federal Government
 *        declarations of public holidays.
 *
 *   US:  https://www.nyse.com/trade/hours-calendars
 *
 * Weekends are NOT listed here. They are computed from real
 * weekday maths in the service.
 *
 * If the second source lists a day that is missing here, Gaze
 * records a MISMATCH. That is the signal to check the official
 * announcement and update this file.
 *
 * Dates below were seeded from public information and MUST be
 * checked against the official sources above before you rely
 * on them.
 */

module.exports = {

    NGX: {
        source: 'curated-ngx',

        holidays: {
            '2026-10-01': {
                name: 'Independence Day',
                type: 'National holiday'
            },

            '2026-12-25': {
                name: 'Christmas Day',
                type: 'National holiday'
            },

            '2027-01-01': {
                name: "New Year's Day",
                type: 'National holiday'
            }

            /*
             * Add NGX dates here as they are declared, for example
             * Boxing Day (and any substitute day when it falls on a
             * weekend) and the Eid holidays, which the Federal
             * Government usually confirms shortly before the date.
             */
        }
    },


    US: {
        source: 'curated-nyse',

        holidays: {
            // 2026
            '2026-01-01': { name: "New Year's Day", type: 'Market holiday' },
            '2026-01-19': { name: 'Martin Luther King Jr. Day', type: 'Market holiday' },
            '2026-02-16': { name: "Washington's Birthday", type: 'Market holiday' },
            '2026-04-03': { name: 'Good Friday', type: 'Market holiday' },
            '2026-05-25': { name: 'Memorial Day', type: 'Market holiday' },
            '2026-06-19': { name: 'Juneteenth', type: 'Market holiday' },
            '2026-07-03': { name: 'Independence Day (observed)', type: 'Market holiday' },
            '2026-09-07': { name: 'Labor Day', type: 'Market holiday' },
            '2026-11-26': { name: 'Thanksgiving Day', type: 'Market holiday' },
            '2026-12-25': { name: 'Christmas Day', type: 'Market holiday' },

            // 2027
            '2027-01-01': { name: "New Year's Day", type: 'Market holiday' },
            '2027-01-18': { name: 'Martin Luther King Jr. Day', type: 'Market holiday' },
            '2027-02-15': { name: "Washington's Birthday", type: 'Market holiday' },
            '2027-03-26': { name: 'Good Friday', type: 'Market holiday' },
            '2027-05-31': { name: 'Memorial Day', type: 'Market holiday' },
            '2027-06-18': { name: 'Juneteenth (observed)', type: 'Market holiday' },
            '2027-07-05': { name: 'Independence Day (observed)', type: 'Market holiday' },
            '2027-09-06': { name: 'Labor Day', type: 'Market holiday' },
            '2027-11-25': { name: 'Thanksgiving Day', type: 'Market holiday' },
            '2027-12-24': { name: 'Christmas Day (observed)', type: 'Market holiday' }
        },

        // Markets open but close at 1:00 p.m. ET
        earlyCloses: {
            '2026-11-27': { name: 'Day after Thanksgiving', type: 'Early close' },
            '2026-12-24': { name: 'Christmas Eve', type: 'Early close' },
            '2027-11-26': { name: 'Day after Thanksgiving', type: 'Early close' }
        }
    }
};