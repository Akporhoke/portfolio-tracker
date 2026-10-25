/*
 * Alert engine.
 *
 * Listens for price events and fires alerts when a price CROSSES a user's
 * threshold between two observations.
 *
 *   above:  previous price < threshold  and  new price >= threshold
 *   below:  previous price > threshold  and  new price <= threshold
 *
 * Safe against repeats:
 *   - an observation is only used if it is NEWER than the last one the
 *     alert saw, so the same price delivered twice does nothing
 *   - the notification has a unique key (alert + observation), so it can
 *     never be created twice
 *   - the previous price is saved in the database, so a restart loses
 *     nothing
 *
 * It does NOT make calls to any price provider. It only reacts to prices
 * Gaze already fetched. When a notification is created it is also sent to
 * the user's phone/browser (push) and to their Telegram, wherever they
 * turned those on.
 */

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const priceEvents =
    require('./priceEvents');

const telegram =
    require('./telegramService');

const push =
    require('./pushService');


// Ignore prices that are already old when they arrive (for example a
// cached list reused while a provider is unavailable): a crossing found in
// them would be announced far too late.
const MAX_EVENT_AGE_MS =
    60 * 60 * 1000;

// Which stocks have an active alert (kept in memory, refreshed often)
const ACTIVE_CACHE_MS =
    30 * 1000;

let activeKeys = new Set();
let activeKeysAt = 0;
let stopListening = null;


function invalidateActiveCache() {
    activeKeysAt = 0;
}


async function hasActiveAlert(ticker, market) {
    const now = Date.now();

    if (now - activeKeysAt > ACTIVE_CACHE_MS) {
        const rows =
            await Alert.find({ status: 'active' })
                .select({ ticker: 1, market: 1 })
                .lean();

        activeKeys =
            new Set(
                rows.map(
                    row => `${row.market}|${row.ticker}`
                )
            );

        activeKeysAt = now;
    }

    return activeKeys.has(`${market}|${ticker}`);
}


function crossed(direction, previous, current, threshold) {
    if (
        !Number.isFinite(previous) ||
        !Number.isFinite(current)
    ) {
        return false;
    }

    return direction === 'above'
        ? previous < threshold && current >= threshold
        : previous > threshold && current <= threshold;
}


function formatNumber(value) {
    return Number(value).toLocaleString(
        'en-US',
        { maximumFractionDigits: 2 }
    );
}


// Returns the new notification, or null if it already existed (the same
// alert for the same observation)
async function createNotification(alert, price, fetchedAt) {
    const sign =
        alert.market === 'US'
            ? '$'
            : '₦';

    const verb =
        alert.direction === 'above'
            ? 'rose above'
            : 'fell below';

    try {
        return await Notification.create({
            userId: alert.userId,
            type: 'price_alert',

            title:
                `${alert.ticker} ${verb} ` +
                `${sign}${formatNumber(alert.threshold)}`,

            message:
                `${alert.ticker} is now ` +
                `${sign}${formatNumber(price)}.`,

            ticker: alert.ticker,
            market: alert.market,
            alertId: alert._id,
            price,
            threshold: alert.threshold,
            direction: alert.direction,
            observedAt: fetchedAt,

            dedupeKey:
                `${alert._id}|${fetchedAt.getTime()}`
        });

    } catch (error) {
        // Duplicate key: this alert already fired for this observation
        if (error && error.code === 11000) {
            return null;
        }

        throw error;
    }
}


// Sends one new notification out to every channel the user turned on.
// Neither call is awaited and neither can throw: a slow or failing
// channel must never hold up the engine or stop the other channel.
function deliver(notification) {
    void push.sendToUser(
        notification.userId,
        {
            title: notification.title,
            body: notification.message,

            // A different tag for every notification, so two alerts
            // never replace each other on the lock screen
            tag: notification.dedupeKey,

            // Opens the app on the Notifications tab
            url: '/?alerts=1'
        }
    );

    void telegram.sendToUser(
        notification.userId,
        `${notification.title}\n${notification.message}`
    );
}


// ------------------------------------------------------------
// HANDLE ONE PRICE EVENT
// ------------------------------------------------------------

async function handlePriceEvent(event) {
    const result = {
        checked: 0,
        triggered: 0,
        ignored: 0
    };

    if (!event) {
        return result;
    }

    const ticker =
        String(event.ticker || '').trim().toUpperCase();

    const market =
        String(event.market || '').trim().toUpperCase() === 'US'
            ? 'US'
            : 'NGX';

    const price =
        Number(event.price);

    const fetchedAt =
        new Date(event.fetchedAt || Date.now());

    if (
        !ticker ||
        !(price > 0) ||
        Number.isNaN(fetchedAt.getTime())
    ) {
        return result;
    }

    if (Date.now() - fetchedAt.getTime() > MAX_EVENT_AGE_MS) {
        result.ignored++;
        return result;
    }

    // Most stocks have no alert: stop here without touching the database
    if (!(await hasActiveAlert(ticker, market))) {
        return result;
    }

    const alerts =
        await Alert.find({
            status: 'active',
            ticker,
            market
        }).lean();

    for (const alert of alerts) {
        result.checked++;

        const didCross =
            crossed(
                alert.direction,
                alert.lastObservedPrice,
                price,
                alert.threshold
            );

        const cooling =
            Boolean(
                alert.cooldownUntil &&
                new Date(alert.cooldownUntil) > fetchedAt
            );

        const fire =
            didCross && !cooling;

        // Notification first: if the server stops right after, the worst
        // case is a duplicate later, never a lost alert. The unique key
        // stops duplicates for the same observation.
        let created = null;

        if (fire) {
            created =
                await createNotification(
                    alert,
                    price,
                    fetchedAt
                );

            // One new notification = one push + one Telegram message
            if (created) {
                deliver(created);
            }
        }

        const set = {
            lastObservedPrice: price,
            lastObservedFetchedAt: fetchedAt
        };

        const update = { $set: set };

        if (fire) {
            set.lastTriggeredAt = new Date();
            set.triggeredPrice = price;

            if (alert.repeat) {
                set.cooldownUntil =
                    new Date(
                        Date.now() +
                        (alert.cooldownMinutes || 60) * 60 * 1000
                    );
            } else {
                set.status = 'triggered';
            }

            update.$inc = { triggerCount: 1 };
        }

        // Only the first evaluation of a NEWER observation succeeds
        const claimed =
            await Alert.findOneAndUpdate(
                {
                    _id: alert._id,
                    status: 'active',

                    $or: [
                        { lastObservedFetchedAt: null },
                        { lastObservedFetchedAt: { $lt: fetchedAt } }
                    ]
                },
                update,
                { returnDocument: 'before' }
            );

        if (!claimed) {
            result.ignored++;
            continue;
        }

        if (fire && created) {
            result.triggered++;
        }
    }

    return result;
}


// ------------------------------------------------------------
// START / STOP
// ------------------------------------------------------------

function startAlertEngine() {
    if (stopListening) {
        return;
    }

    stopListening =
        priceEvents.subscribePrice(handlePriceEvent);

    console.log(
        '✓ Alert engine started (listening for price changes)'
    );
}


function stopAlertEngine() {
    if (stopListening) {
        stopListening();
        stopListening = null;
    }
}


module.exports = {
    startAlertEngine,
    stopAlertEngine,
    handlePriceEvent,
    invalidateActiveCache
};