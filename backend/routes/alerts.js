/*
 * Alert + notification routes.
 *
 * Put this file in:  backend/routes/alerts.js
 *
 * Mounted in server.js BEFORE portfolioRoutes, behind the same guard, so
 * portfolio-guard has already checked that you are logged in and that
 * :userId in the URL is YOUR id. Every query below ALSO filters by that
 * userId, so one user can never touch another user's alerts.
 *
 *   GET    /api/portfolio/:userId/alerts
 *   POST   /api/portfolio/:userId/alerts
 *   PATCH  /api/portfolio/:userId/alerts/:alertId       (PUT works too)
 *   POST   /api/portfolio/:userId/alerts/:alertId/status   pause / resume
 *   POST   /api/portfolio/:userId/alerts/:alertId/delete
 *   DELETE /api/portfolio/:userId/alerts/:alertId
 *
 *   GET    /api/portfolio/:userId/notifications?limit=50
 *   POST   /api/portfolio/:userId/notifications/read      (mark read)
 *   POST   /api/portfolio/:userId/notifications/read-all
 *   POST   /api/portfolio/:userId/notifications/:id/read  (PATCH/PUT too)
 *   DELETE /api/portfolio/:userId/notifications/:id
 *   DELETE /api/portfolio/:userId/notifications          (clear all)
 */

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const quoteStore =
    require('../services/quoteStore');

const {
    invalidateActiveCache
} = require('../services/alertEngine');


// Each alerted stock is refreshed by the scheduler (uses provider quota),
// so a user may only keep this many active or paused alerts
const MAX_LIVE_ALERTS_PER_USER = 25;

const MAX_COOLDOWN_MINUTES = 7 * 24 * 60;


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

// Same error shape as portfolio-guard: { error, code }
function fail(res, status, code, message) {
    return res.status(status).json({
        error: message,
        code
    });
}


// MongoDB sends "_id". The frontend reads "id". Send both, so
// `alert.id` and `alert._id` are never undefined.
function withId(doc) {
    if (!doc) {
        return doc;
    }

    const plain =
        typeof doc.toObject === 'function'
            ? doc.toObject()
            : doc;

    return {
        ...plain,
        id: String(plain._id)
    };
}


function cleanTicker(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.]/g, '');
}


// Strict on purpose: anything but NGX or US is rejected,
// not silently turned into NGX
function parseMarket(value) {
    const market =
        String(value || '').trim().toUpperCase();

    return market === 'NGX' || market === 'US'
        ? market
        : null;
}


function parseDirection(value) {
    const direction =
        String(value || '').trim().toLowerCase();

    return direction === 'above' || direction === 'below'
        ? direction
        : null;
}


function parseThreshold(value) {
    const number = Number(value);

    return Number.isFinite(number) &&
        number > 0 &&
        number < 1e9
        ? number
        : null;
}


function parseCooldown(value) {
    const number = Math.floor(Number(value));

    if (!Number.isFinite(number)) {
        return 60;
    }

    return Math.min(
        Math.max(number, 1),
        MAX_COOLDOWN_MINUTES
    );
}


function isId(value) {
    return mongoose.isValidObjectId(value);
}


// The alert engine needs a "previous price" to detect a crossing. Start
// from the last stored price (the one the user was looking at when they
// made the alert). Without it, a price that jumps past the threshold
// before Gaze's first observation would be treated as the starting point
// and never fire.
async function baselineFor(ticker, market) {
    try {
        const stored =
            await quoteStore.getStoredQuote(
                ticker,
                market
            );

        const price =
            Number(stored && stored.price);

        if (
            stored &&
            price > 0 &&
            stored.fetchedAt
        ) {
            return {
                lastObservedPrice: price,
                lastObservedFetchedAt:
                    new Date(stored.fetchedAt)
            };
        }
    } catch (error) {
        console.error(
            '[Alerts] baseline lookup failed:',
            error.message
        );
    }

    return {
        lastObservedPrice: null,
        lastObservedFetchedAt: null
    };
}


// ------------------------------------------------------------
// ALERTS: LIST
// ------------------------------------------------------------

router.get('/:userId/alerts', async (req, res) => {
    try {
        const filter = {
            userId: req.params.userId
        };

        // Optional ?status=active|triggered|paused
        const status =
            String(req.query.status || '').toLowerCase();

        if (['active', 'triggered', 'paused'].includes(status)) {
            filter.status = status;
        }

        const alerts =
            await Alert.find(filter)
                .sort({ createdAt: -1 })
                .select('-__v')
                .lean();

        res.json({
            alerts: alerts.map(withId)
        });

    } catch (error) {
        console.error('[Alerts] list failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not load alerts');
    }
});


// ------------------------------------------------------------
// ALERTS: CREATE
// ------------------------------------------------------------

router.post('/:userId/alerts', async (req, res) => {
    try {
        const userId = req.params.userId;
        const body = req.body || {};

        const ticker = cleanTicker(body.ticker);
        const market = parseMarket(body.market);
        const direction = parseDirection(body.direction);
        const threshold = parseThreshold(body.threshold);

        if (!ticker) {
            return fail(res, 400, 'BAD_TICKER', 'Ticker is required');
        }

        if (!market) {
            return fail(res, 400, 'BAD_MARKET', 'Market must be NGX or US');
        }

        if (!direction) {
            return fail(res, 400, 'BAD_DIRECTION', 'Direction must be above or below');
        }

        if (threshold === null) {
            return fail(res, 400, 'BAD_THRESHOLD', 'Threshold must be a number above 0');
        }

        const liveCount =
            await Alert.countDocuments({
                userId,
                status: { $in: ['active', 'paused'] }
            });

        if (liveCount >= MAX_LIVE_ALERTS_PER_USER) {
            return fail(
                res,
                400,
                'TOO_MANY_ALERTS',
                `You can keep up to ${MAX_LIVE_ALERTS_PER_USER} alerts. Delete one first.`
            );
        }

        const duplicate =
            await Alert.findOne({
                userId,
                ticker,
                market,
                direction,
                threshold,
                status: { $in: ['active', 'paused'] }
            }).lean();

        if (duplicate) {
            return fail(res, 409, 'DUPLICATE_ALERT', 'You already have this alert');
        }

        const baseline =
            await baselineFor(ticker, market);

        const alert =
            await Alert.create({
                userId,
                ticker,
                market,
                direction,
                threshold,
                repeat: Boolean(body.repeat),
                cooldownMinutes: parseCooldown(body.cooldownMinutes),
                note: String(body.note || '').slice(0, 200),
                ...baseline
            });

        // The engine remembers which stocks have alerts for 30 seconds;
        // tell it to look again so the new alert counts right away
        invalidateActiveCache();

        res.status(201).json({
            alert: withId(alert)
        });

    } catch (error) {
        console.error('[Alerts] create failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not create alert');
    }
});


// ------------------------------------------------------------
// ALERTS: EDIT (PATCH or PUT)
// ------------------------------------------------------------

async function updateAlert(req, res) {
    try {
        const userId = req.params.userId;
        const alertId = req.params.alertId;

        if (!isId(alertId)) {
            return fail(res, 400, 'BAD_ID', 'Invalid alert id');
        }

        const current =
            await Alert.findOne({
                _id: alertId,
                userId
            }).lean();

        if (!current) {
            return fail(res, 404, 'NOT_FOUND', 'Alert not found');
        }

        const body = req.body || {};
        const set = {};

        let needsReset = false;

        // Only these fields can be changed. Nothing else in the body
        // (userId, lastObservedPrice, triggerCount...) is ever copied.
        if (body.threshold !== undefined) {
            const threshold = parseThreshold(body.threshold);

            if (threshold === null) {
                return fail(res, 400, 'BAD_THRESHOLD', 'Threshold must be a number above 0');
            }

            if (threshold !== current.threshold) {
                set.threshold = threshold;
                needsReset = true;
            }
        }

        if (body.direction !== undefined) {
            const direction = parseDirection(body.direction);

            if (!direction) {
                return fail(res, 400, 'BAD_DIRECTION', 'Direction must be above or below');
            }

            if (direction !== current.direction) {
                set.direction = direction;
                needsReset = true;
            }
        }

        if (body.repeat !== undefined) {
            set.repeat = Boolean(body.repeat);
        }

        if (body.cooldownMinutes !== undefined) {
            set.cooldownMinutes = parseCooldown(body.cooldownMinutes);
        }

        if (body.note !== undefined) {
            set.note = String(body.note || '').slice(0, 200);
        }

        // A user may only pause or (re)activate. 'triggered' is set by the
        // engine alone.
        if (body.status !== undefined) {
            const status = String(body.status).toLowerCase();

            if (status !== 'active' && status !== 'paused') {
                return fail(res, 400, 'BAD_STATUS', 'Status must be active or paused');
            }

            if (status !== current.status) {
                set.status = status;

                if (status === 'active') {
                    needsReset = true;
                }
            }
        }

        // New rule or switched back on: forget the old cooldown and start
        // watching from the current price again
        if (needsReset) {
            const baseline =
                await baselineFor(current.ticker, current.market);

            Object.assign(set, baseline, { cooldownUntil: null });
        }

        if (Object.keys(set).length === 0) {
            return res.json({ alert: withId(current) });
        }

        const alert =
            await Alert.findOneAndUpdate(
                { _id: alertId, userId },
                { $set: set },
                {
                    returnDocument: 'after',
                    runValidators: true
                }
            ).lean();

        invalidateActiveCache();

        res.json({ alert: withId(alert) });

    } catch (error) {
        console.error('[Alerts] update failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not update alert');
    }
}

router.route('/:userId/alerts/:alertId')
    .patch(updateAlert)
    .put(updateAlert);


// ------------------------------------------------------------
// ALERTS: PAUSE / RESUME  (POST .../status, what alert.js calls)
//
// I have not seen the exact body alert.js sends, so this accepts
// several shapes:
//   { status: 'active' | 'paused' }   (also resume/pause/on/off)
//   { paused: true|false }
//   { active: true|false }  or  { enabled: true|false }
//   nothing recognisable -> flip it (active <-> paused)
// A 'triggered' alert that is switched on is re-armed.
// ------------------------------------------------------------

function pickStatus(body, currentStatus) {
    const activeWords =
        ['active', 'resume', 'resumed', 'on', 'enable', 'enabled'];

    const pausedWords =
        ['paused', 'pause', 'off', 'disable', 'disabled'];

    if (body.status !== undefined) {
        const word =
            String(body.status).trim().toLowerCase();

        if (activeWords.includes(word)) {
            return 'active';
        }

        if (pausedWords.includes(word)) {
            return 'paused';
        }
    }

    if (typeof body.paused === 'boolean') {
        return body.paused ? 'paused' : 'active';
    }

    if (typeof body.active === 'boolean') {
        return body.active ? 'active' : 'paused';
    }

    if (typeof body.enabled === 'boolean') {
        return body.enabled ? 'active' : 'paused';
    }

    return currentStatus === 'active'
        ? 'paused'
        : 'active';
}


router.post('/:userId/alerts/:alertId/status', async (req, res) => {
    try {
        const userId = req.params.userId;
        const alertId = req.params.alertId;

        if (!isId(alertId)) {
            return fail(res, 400, 'BAD_ID', 'Invalid alert id');
        }

        const current =
            await Alert.findOne({
                _id: alertId,
                userId
            }).lean();

        if (!current) {
            return fail(res, 404, 'NOT_FOUND', 'Alert not found');
        }

        const next =
            pickStatus(req.body || {}, current.status);

        if (next === current.status) {
            return res.json({ alert: withId(current) });
        }

        const set = { status: next };

        // Switched on: forget the cooldown, start from the current price
        if (next === 'active') {
            const baseline =
                await baselineFor(current.ticker, current.market);

            Object.assign(set, baseline, { cooldownUntil: null });
        }

        const alert =
            await Alert.findOneAndUpdate(
                { _id: alertId, userId },
                { $set: set },
                { returnDocument: 'after' }
            ).lean();

        invalidateActiveCache();

        res.json({ alert: withId(alert) });

    } catch (error) {
        console.error('[Alerts] status failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not change alert status');
    }
});


// ------------------------------------------------------------
// ALERTS: DELETE (DELETE .../:alertId, or POST .../:alertId/delete)
// ------------------------------------------------------------

async function deleteAlert(req, res) {
    try {
        const alertId = req.params.alertId;

        if (!isId(alertId)) {
            return fail(res, 400, 'BAD_ID', 'Invalid alert id');
        }

        const removed =
            await Alert.findOneAndDelete({
                _id: alertId,
                userId: req.params.userId
            });

        if (!removed) {
            return fail(res, 404, 'NOT_FOUND', 'Alert not found');
        }

        invalidateActiveCache();

        res.json({ ok: true });

    } catch (error) {
        console.error('[Alerts] delete failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not delete alert');
    }
}

router.delete('/:userId/alerts/:alertId', deleteAlert);
router.post('/:userId/alerts/:alertId/delete', deleteAlert);


// ------------------------------------------------------------
// NOTIFICATIONS: LIST (+ unread count for the badge)
// ------------------------------------------------------------

router.get('/:userId/notifications', async (req, res) => {
    try {
        const userId = req.params.userId;

        // ?limit=1 is used for a quick badge check, ?limit=50 for the list
        const limit =
            Math.min(
                Math.max(parseInt(req.query.limit, 10) || 50, 1),
                100
            );

        const filter = { userId };

        if (String(req.query.unread) === 'true') {
            filter.read = false;
        }

        const [notifications, unreadCount] =
            await Promise.all([
                Notification.find(filter)
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .select('-__v')
                    .lean(),

                Notification.countDocuments({
                    userId,
                    read: false
                })
            ]);

        res.json({
            notifications: notifications.map(withId),
            unreadCount
        });

    } catch (error) {
        console.error('[Alerts] notifications failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not load notifications');
    }
});


// ------------------------------------------------------------
// NOTIFICATIONS: MARK READ (what alert.js calls)
//   body { ids: [...] }  -> mark just those
//   no body / no ids     -> mark everything unread
// ------------------------------------------------------------

router.post('/:userId/notifications/read', async (req, res) => {
    try {
        const body = req.body || {};

        const filter = {
            userId: req.params.userId,
            read: false
        };

        // Accept { ids: [...] } or a single { id }. Anything that isn't
        // a valid id is dropped instead of crashing the query.
        const rawIds =
            Array.isArray(body.ids)
                ? body.ids
                : body.id
                    ? [body.id]
                    : [];

        const ids = rawIds.filter(isId);

        if (rawIds.length > 0) {
            filter._id = { $in: ids };
        }

        const result =
            await Notification.updateMany(
                filter,
                { $set: { read: true } }
            );

        res.json({
            ok: true,
            updated: result.modifiedCount
        });

    } catch (error) {
        console.error('[Alerts] mark read failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not update notifications');
    }
});


router.post('/:userId/notifications/read-all', async (req, res) => {
    try {
        const result =
            await Notification.updateMany(
                { userId: req.params.userId, read: false },
                { $set: { read: true } }
            );

        res.json({
            ok: true,
            updated: result.modifiedCount
        });

    } catch (error) {
        console.error('[Alerts] read-all failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not update notifications');
    }
});


async function markRead(req, res) {
    try {
        const id = req.params.id;

        if (!isId(id)) {
            return fail(res, 400, 'BAD_ID', 'Invalid notification id');
        }

        const updated =
            await Notification.findOneAndUpdate(
                { _id: id, userId: req.params.userId },
                { $set: { read: true } },
                { returnDocument: 'after' }
            ).lean();

        if (!updated) {
            return fail(res, 404, 'NOT_FOUND', 'Notification not found');
        }

        res.json({ notification: withId(updated) });

    } catch (error) {
        console.error('[Alerts] mark read failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not update notification');
    }
}

router.route('/:userId/notifications/:id/read')
    .post(markRead)
    .patch(markRead)
    .put(markRead);


// ------------------------------------------------------------
// NOTIFICATIONS: DELETE ONE / CLEAR ALL
// ------------------------------------------------------------

router.delete('/:userId/notifications/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!isId(id)) {
            return fail(res, 400, 'BAD_ID', 'Invalid notification id');
        }

        const removed =
            await Notification.findOneAndDelete({
                _id: id,
                userId: req.params.userId
            });

        if (!removed) {
            return fail(res, 404, 'NOT_FOUND', 'Notification not found');
        }

        res.json({ ok: true });

    } catch (error) {
        console.error('[Alerts] delete notification failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not delete notification');
    }
});


router.delete('/:userId/notifications', async (req, res) => {
    try {
        const result =
            await Notification.deleteMany({
                userId: req.params.userId
            });

        res.json({
            ok: true,
            deleted: result.deletedCount
        });

    } catch (error) {
        console.error('[Alerts] clear notifications failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not clear notifications');
    }
});


module.exports = router;