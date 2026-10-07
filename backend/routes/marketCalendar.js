const express = require('express');

const service =
    require('../services/marketCalendarService');

const dates =
    require('../utils/marketCalendarDates');

const router =
    express.Router();


/*
 * GET /api/market-calendar?month=2026-10
 *
 * Returns one month of verified market sessions.
 * The browser never talks to the external sources.
 */
router.get(
    '/',
    async (req, res) => {

        try {
            const month =
                String(req.query.month || '').trim();

            if (!dates.isValidMonthKey(month)) {
                return res.status(400).json({
                    success: false,
                    error: 'month must look like 2026-10'
                });
            }

            if (!dates.isInWindow(month)) {
                return res.status(400).json({
                    success: false,
                    error: 'That month is outside the available calendar window'
                });
            }

            const days =
                await service.getCalendarMonth(month);

            res.json({
                success: true,
                month,
                days
            });

        } catch (error) {
            console.error(
                '[MarketCalendar] GET /:',
                error.message
            );

            res.status(500).json({
                success: false,
                error: 'Unable to load the market calendar'
            });
        }
    }
);


/*
 * GET /api/market-calendar/mismatches
 *
 * Days where the two sources disagree. Check the official
 * announcement, then update marketCalendarCurated.js.
 */
router.get(
    '/mismatches',
    async (req, res) => {

        try {
            const mismatches =
                await service.getMismatches();

            res.json({
                success: true,
                count: mismatches.length,
                mismatches
            });

        } catch (error) {
            console.error(
                '[MarketCalendar] GET /mismatches:',
                error.message
            );

            res.status(500).json({
                success: false,
                error: 'Unable to load calendar mismatches'
            });
        }
    }
);


module.exports = router;