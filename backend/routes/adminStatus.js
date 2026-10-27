/*
 * Admin status route: one snapshot of how Gaze is doing.
 *
 * Put this file in:  backend/routes/adminStatus.js
 *
 *   GET /api/portfolio/:userId/admin/status      (admins only)
 *
 * It lives under /api/portfolio on purpose: that path already carries your
 * login token and the "own portfolio" check, so the frontend can call it
 * like any other request. requireRole('admin') then lets only admins in.
 *
 * Nothing secret is returned: never keys, tokens or connection strings.
 */

const express = require('express');

const router = express.Router();

const { requireRole } =
    require('../gaze-auth/src');

const breaker =
    require('../services/circuitBreaker');

const calendarService =
    require('../services/marketCalendarService');

const push =
    require('../services/pushService');

const telegram =
    require('../services/telegramService');

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const PushSubscription =
    require('../models/PushSubscription');

const TelegramLink =
    require('../models/TelegramLink');

const SchedulerStatus =
    require('../models/SchedulerStatus');

const ProviderState =
    require('../models/ProviderState');


// Runs one lookup. If it fails, that part shows { error } and the rest of
// the page still loads.
async function safe(work) {
    try {
        return await work();
    } catch (error) {
        return { error: error.message };
    }
}


router.get(
    '/:userId/admin/status',
    requireRole('admin'),
    async (req, res) => {
        const since =
            new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            alertCounts,
            notifications24h,
            pushDevices,
            telegramLinked,
            scheduler,
            providers,
            ngx,
            us
        ] = await Promise.all([
            safe(async () => {
                const rows =
                    await Alert.aggregate([
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ]);

                const counts = { active: 0, paused: 0, triggered: 0 };

                for (const row of rows) {
                    counts[row._id] = row.count;
                }

                return counts;
            }),

            safe(() =>
                Notification.countDocuments({ createdAt: { $gte: since } })
            ),

            safe(() => PushSubscription.countDocuments({})),

            safe(() =>
                TelegramLink.countDocuments({ chatId: { $type: 'string' } })
            ),

            safe(() =>
                SchedulerStatus.findOne({ job: 'price_refresh' }).lean()
            ),

            safe(() =>
                ProviderState.find({})
                    .select({
                        provider: 1,
                        status: 1,
                        cooldownUntil: 1,
                        lastError: 1,
                        updatedAt: 1
                    })
                    .lean()
            ),

            safe(() => calendarService.getMarketState('NGX')),
            safe(() => calendarService.getMarketState('US'))
        ]);

        res.json({
            generatedAt: new Date(),

            server: {
                uptimeSeconds: Math.round(process.uptime()),
                memoryMb: Math.round(process.memoryUsage().rss / 1048576),
                node: process.version
            },

            // What is switched on in THIS server
            features: {
                priceScheduler:
                    String(process.env.PRICE_SCHEDULER_ENABLED || 'true')
                        .toLowerCase() !== 'false',

                telegramConfigured: telegram.isConfigured(),

                telegramPolling:
                    String(process.env.TELEGRAM_POLLING || 'true')
                        .toLowerCase() !== 'false',

                pushConfigured: push.isConfigured()
            },

            // One entry per provider endpoint: closed / open / half_open
            breakers: breaker.getSnapshot(),

            scheduler,
            providers,

            markets: { NGX: ngx, US: us },

            counts: {
                alerts: alertCounts,
                notificationsLast24h: notifications24h,
                pushDevices,
                telegramLinked
            }
        });
    }
);


module.exports = router;
