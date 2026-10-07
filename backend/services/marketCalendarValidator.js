/*
 * Market Calendar validator.
 *
 * Compares the primary source against the secondary source.
 * It never changes either source's data. It only reports.
 *
 * Results:
 *   matched     both sources agree
 *   mismatch    the sources disagree (Gaze keeps the primary data
 *               and records the discrepancy for review)
 *   unverified  the secondary source was unavailable, so there was
 *               nothing to compare against
 */

function statusOf(entry) {
    return entry
        ? entry.status
        : 'trading';
}


function compareDay(
    primaryEntry,
    secondaryEntry,
    secondaryAvailable
) {
    const primaryStatus =
        statusOf(primaryEntry);

    if (!secondaryAvailable) {
        return {
            status: 'unverified',
            primaryStatus,
            secondaryStatus: null
        };
    }

    const secondaryStatus =
        statusOf(secondaryEntry);

    return {
        status:
            primaryStatus === secondaryStatus
                ? 'matched'
                : 'mismatch',

        primaryStatus,
        secondaryStatus
    };
}


function summarize(results) {
    const summary = {
        matched: 0,
        mismatch: 0,
        unverified: 0
    };

    for (const result of results) {
        summary[result.status] =
            (summary[result.status] || 0) + 1;
    }

    return summary;
}


module.exports = {
    compareDay,
    summarize
};