/*
 * Market Calendar scheduler.
 *
 * Decides WHEN things happen. It calls the service for the work
 * and contains no calendar logic itself.
 *
 * Runs once per day, plus once at server startup (node-cron does
 * not replay jobs missed while the server was asleep, which
 * matters on Render).
 *
 * Each run:
 *   1. Makes sure the rolling window exists (3 previous + current + next)
 *   2. In the first 3 days of the month, verifies current + next month
 *        Day 1:   always verify
 *        Day 2-3: only retry months that still have mismatches
 *                 or unverified days
 *   3. Removes months older than the 3 previous ones
 *
 * If everything already matches, nothing is rewritten.
 */

const cron = require('node-cron');

const service =
    require('./marketCalendarService');

const dates =
    require('../utils/marketCalendarDates');

const SchedulerStatus =
    require('../models/SchedulerStatus');


const JOB_NAME = 'market_calendar';

const MAINTENANCE_CRON = '15 2 * * *';

let task = null;
let running = false;


async function updateStatus(update) {
    try {
        await SchedulerStatus.findOneAndUpdate(
            { job: JOB_NAME },
            { $set: update },
            { upsert: true }
        );
    } catch (error) {
        console.error(
            '[MarketCalendar] Failed to save scheduler status:',
            error.message
        );
    }
}


async function runMarketCalendarMaintenance() {

    if (running) {
        console.log(
            '⏭️ Market calendar maintenance already running. Skipping.'
        );

        return;
    }

    running = true;

    const startedAt = new Date();

    await updateStatus({
        status: 'running',
        startedAt,
        completedAt: null,
        error: null
    });

    console.log('');
    console.log('================================');
    console.log('GAZE MARKET CALENDAR MAINTENANCE');
    console.log('================================');

    try {
        const built =
            await service.ensureRollingWindow();

        console.log(
            built.length > 0
                ? `Built months: ${built.join(', ')}`
                : 'Rolling window complete: nothing to build'
        );

        const verified = [];
        const day = dates.currentDayOfMonth();

        if (day <= 3) {
            const current = dates.currentMonthKey();

            const months = [
                current,
                dates.addMonths(current, 1)
            ];

            for (const monthKey of months) {
                const shouldVerify =
                    day === 1 ||
                    await service.monthNeedsAttention(monthKey);

                if (!shouldVerify) {
                    console.log(
                        `✓ ${monthKey}: all days verified, no update required`
                    );

                    continue;
                }

                const report =
                    await service.verifyCalendarMonth(monthKey);

                verified.push(monthKey);

                console.log(
                    `Verified ${monthKey}: ` +
                    `NGX written ${report.NGX.written}, ` +
                    `US written ${report.US.written}`
                );
            }
        }

        const removed =
            await service.cleanupOldMonths();

        console.log(
            `Old calendar records removed: ${removed}`
        );

        console.log('================================');
        console.log('');

        await updateStatus({
            status: 'success',
            completedAt: new Date(),
            lastSuccessfulAt: new Date(),
            error: null
        });

    } catch (error) {
        console.error(
            '[MarketCalendar] Maintenance failed:',
            error.message
        );

        await updateStatus({
            status: 'failed',
            completedAt: new Date(),
            error: error.message
        });

    } finally {
        running = false;
    }
}


function startMarketCalendarScheduler() {

    if (task) {
        console.log(
            '⚠️ Market calendar scheduler already running.'
        );

        return;
    }

    setImmediate(() => {
        runMarketCalendarMaintenance()
            .catch(error => {
                console.error(
                    '[MarketCalendar] Startup run failed:',
                    error.message
                );
            });
    });

    task = cron.schedule(
        MAINTENANCE_CRON,
        runMarketCalendarMaintenance,
        {
            timezone: dates.TIME_ZONE,
            noOverlap: true
        }
    );

    console.log(
        `✓ Market calendar scheduler started (daily 02:15 ${dates.TIME_ZONE}, plus startup run)`
    );
}


function stopMarketCalendarScheduler() {
    if (task) {
        task.stop();
        task = null;
    }
}


module.exports = {
    startMarketCalendarScheduler,
    stopMarketCalendarScheduler,
    runMarketCalendarMaintenance
};