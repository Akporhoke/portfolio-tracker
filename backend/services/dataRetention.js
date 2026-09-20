const PriceHistory =
    require('../models/PriceHistory');


// ============================================================
// CONFIG
// ============================================================

/*
 * Keep at least one year of historical market data.
 */
const RETENTION_DAYS = 365;

/*
 * IMPORTANT:
 *
 * Keep this TRUE while testing.
 *
 * When TRUE:
 * - Nothing is deleted.
 * - The service only reports what would be deleted.
 *
 * Later, after Gaze has proper user accounts and
 * usage tracking, review the policy and consider
 * changing this to FALSE.
 */
const DRY_RUN = true;


// ============================================================
// HELPERS
// ============================================================

function getRetentionCutoffDate() {
    const cutoff =
        new Date();

    cutoff.setUTCDate(
        cutoff.getUTCDate() -
        RETENTION_DAYS
    );

    return cutoff
        .toISOString()
        .slice(0, 10);
}


// ============================================================
// RETENTION CLEANUP
// ============================================================

async function runPriceHistoryRetention() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE PRICE HISTORY RETENTION'
    );
    console.log(
        '================================'
    );

    try {
        const cutoffDate =
            getRetentionCutoffDate();

        console.log(
            `Retention period: ${RETENTION_DAYS} days`
        );

        console.log(
            `Cutoff date:       ${cutoffDate}`
        );

        console.log(
            `Dry run:           ${DRY_RUN}`
        );

        /*
         * --------------------------------------------------------
         * Find old history
         * --------------------------------------------------------
         */

        const oldCount =
            await PriceHistory.countDocuments({
                date: {
                    $lt: cutoffDate
                }
            });

        console.log(
            `Old PriceHistory rows: ${oldCount}`
        );

        /*
         * Nothing to clean.
         */

        if (
            oldCount === 0
        ) {
            console.log(
                '✓ No historical rows are older than the retention period.'
            );

            console.log(
                '================================'
            );

            console.log('');

            return {
                dryRun:
                    DRY_RUN,

                cutoffDate,

                matched:
                    0,

                deleted:
                    0
            };
        }

        /*
         * --------------------------------------------------------
         * Preview sample
         * --------------------------------------------------------
         */

        const sample =
            await PriceHistory.find({
                date: {
                    $lt: cutoffDate
                }
            })
                .sort({
                    date: 1
                })
                .limit(10)
                .lean();

        console.log('');

        console.log(
            'Sample old records:'
        );

        sample.forEach(
            row => {
                console.log(
                    `  ${row.ticker} | ` +
                    `${row.market} | ` +
                    `${row.date} | ` +
                    `close=${row.close}`
                );
            }
        );

        console.log('');

        /*
         * --------------------------------------------------------
         * DRY RUN
         * --------------------------------------------------------
         */

        if (
            DRY_RUN
        ) {
            console.log(
                '🧪 DRY RUN: no records were deleted.'
            );

            console.log(
                `🧪 ${oldCount} records WOULD be deleted.`
            );

            console.log(
                '================================'
            );

            console.log('');

            return {
                dryRun:
                    true,

                cutoffDate,

                matched:
                    oldCount,

                deleted:
                    0
            };
        }

        /*
         * --------------------------------------------------------
         * REAL DELETE
         *
         * This section is intentionally inactive while
         * DRY_RUN = true.
         * --------------------------------------------------------
         */

        const result =
            await PriceHistory.deleteMany({
                date: {
                    $lt: cutoffDate
                }
            });

        console.log(
            `✓ Deleted ${result.deletedCount || 0} old PriceHistory records.`
        );

        console.log(
            '================================'
        );

        console.log('');

        return {
            dryRun:
                false,

            cutoffDate,

            matched:
                oldCount,

            deleted:
                result.deletedCount || 0
        };

    } catch (error) {
        console.error(
            '[Retention] Cleanup failed:',
            error.message
        );

        return {
            dryRun:
                DRY_RUN,

            cutoffDate:
                getRetentionCutoffDate(),

            matched:
                0,

            deleted:
                0,

            error:
                error.message
        };
    }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    runPriceHistoryRetention
};