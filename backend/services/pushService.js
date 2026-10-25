/*
 * Web push service: sends a notification to every device a user enabled
 * push on. Works even when the Gaze tab is closed.
 *
 * Put this file in:  backend/services/pushService.js
 *
 * Setup (once):
 *   1. In the backend folder:      npm install web-push
 *   2. Make a key pair:            npx web-push generate-vapid-keys
 *   3. Put them in backend/.env AND in the Render environment variables:
 *        VAPID_PUBLIC_KEY=...
 *        VAPID_PRIVATE_KEY=...        (secret: never commit it)
 *        VAPID_SUBJECT=mailto:you@example.com
 *
 * If the package or the keys are missing, push simply stays off and
 * nothing else in Gaze is affected.
 */

const PushSubscription =
    require('../models/PushSubscription');

// Loaded carefully: a missing package must not crash the server
let webpush = null;

try {
    webpush = require('web-push');
} catch (error) {
    webpush = null;
}


const MAX_SUBSCRIPTIONS_PER_USER = 10;

let configured = false;
let warned = false;


function warnOnce(message) {
    if (!warned) {
        warned = true;
        console.warn(message);
    }
}


function getPublicKey() {
    return String(process.env.VAPID_PUBLIC_KEY || '').trim();
}


// Sets up the VAPID identity the first time it is needed.
// VAPID = the proof to Google/Apple/Mozilla that these pushes come from us.
function isConfigured() {
    if (configured) {
        return true;
    }

    if (!webpush) {
        warnOnce('⏸️ Push is off (run: npm install web-push)');
        return false;
    }

    const publicKey = getPublicKey();

    const privateKey =
        String(process.env.VAPID_PRIVATE_KEY || '').trim();

    const subject =
        String(process.env.VAPID_SUBJECT || '').trim() ||
        'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
        warnOnce(
            '⏸️ Push is off (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set)'
        );

        return false;
    }

    try {
        webpush.setVapidDetails(subject, publicKey, privateKey);

        configured = true;

        return true;

    } catch (error) {
        warnOnce(`⏸️ Push is off (bad VAPID settings: ${error.message})`);

        return false;
    }
}


function startPush() {
    if (isConfigured()) {
        console.log('✓ Push notifications ready');
    }
}


// ------------------------------------------------------------
// CHECKING WHAT THE BROWSER SENDS US
// ------------------------------------------------------------

// SECURITY: the server will send a web request to the "endpoint" it is
// given. If any address were accepted, someone could make the server call
// internal or random addresses. So only the real push services are allowed.
function isAllowedEndpoint(value) {
    let url;

    try {
        url = new URL(value);
    } catch (error) {
        return false;
    }

    if (url.protocol !== 'https:') {
        return false;
    }

    const host = url.hostname.toLowerCase();

    return (
        host === 'fcm.googleapis.com' ||                       // Chrome, Brave, Samsung, Android
        host === 'push.services.mozilla.com' ||                // Firefox
        host.endsWith('.push.services.mozilla.com') ||
        host.endsWith('.push.apple.com') ||                    // Safari, iPhone Home Screen app
        host.endsWith('.notify.windows.com')                   // Edge
    );
}


// Returns a clean { endpoint, keys } or null if anything looks wrong
function normalizeSubscription(input) {
    if (!input || typeof input !== 'object') {
        return null;
    }

    const endpoint = String(input.endpoint || '');
    const keys = input.keys || {};
    const p256dh = String(keys.p256dh || '');
    const auth = String(keys.auth || '');

    // The keys are base64url text
    const keyPattern = /^[A-Za-z0-9_-]{8,200}$/;

    if (
        endpoint.length === 0 ||
        endpoint.length > 2048 ||
        !isAllowedEndpoint(endpoint) ||
        !keyPattern.test(p256dh) ||
        !keyPattern.test(auth)
    ) {
        return null;
    }

    return {
        endpoint,
        keys: { p256dh, auth }
    };
}


// ------------------------------------------------------------
// STORING DEVICES
// ------------------------------------------------------------

async function saveSubscription(userId, input, userAgent) {
    const subscription = normalizeSubscription(input);

    if (!subscription) {
        return false;
    }

    // Keyed by endpoint: the same device registering again just updates
    // its row. If a different user logs in on the same browser, the
    // device moves to them (it can belong to one user at a time).
    await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
            $set: {
                userId,
                keys: subscription.keys,
                userAgent: String(userAgent || '').slice(0, 300),
                lastSeenAt: new Date()
            }
        },
        { upsert: true }
    );

    // Keep only the newest devices per user
    const rows =
        await PushSubscription.find({ userId })
            .sort({ lastSeenAt: -1 })
            .select({ _id: 1 })
            .lean();

    if (rows.length > MAX_SUBSCRIPTIONS_PER_USER) {
        await PushSubscription.deleteMany({
            _id: {
                $in: rows
                    .slice(MAX_SUBSCRIPTIONS_PER_USER)
                    .map(row => row._id)
            }
        });
    }

    return true;
}


// A user can only remove their OWN device
async function removeSubscription(userId, endpoint) {
    await PushSubscription.deleteOne({
        userId,
        endpoint: String(endpoint || '')
    });
}


async function getStatus(userId) {
    const count =
        await PushSubscription.countDocuments({ userId });

    return {
        configured: isConfigured(),
        publicKey: isConfigured() ? getPublicKey() : null,
        count
    };
}


// ------------------------------------------------------------
// SENDING
// ------------------------------------------------------------

// payload = { title, body, tag, url }
// Returns how many devices accepted it. Never throws: a push problem
// must never break the alert engine.
async function sendToUser(userId, payload) {
    if (!isConfigured()) {
        return 0;
    }

    let subscriptions;

    try {
        subscriptions =
            await PushSubscription.find({ userId }).lean();

    } catch (error) {
        console.error('[Push] could not load devices:', error.message);

        return 0;
    }

    if (subscriptions.length === 0) {
        return 0;
    }

    const body = JSON.stringify(payload);

    let delivered = 0;

    await Promise.all(
        subscriptions.map(async subscription => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: subscription.keys
                    },
                    body,
                    {
                        // If the phone is off, keep it for 1 hour. An old
                        // price alert is worse than none.
                        TTL: 60 * 60,
                        urgency: 'high',
                        timeout: 10 * 1000
                    }
                );

                delivered++;

                PushSubscription.updateOne(
                    { _id: subscription._id },
                    { $set: { lastSeenAt: new Date() } }
                ).exec().catch(() => {});

            } catch (error) {
                const status = error.statusCode;

                // 404 / 410: the user turned push off or the browser
                // dropped it. This device is gone for good.
                if (status === 404 || status === 410) {
                    await PushSubscription.deleteOne({
                        _id: subscription._id
                    }).catch(() => {});

                    return;
                }

                console.error(
                    '[Push] send failed:',
                    status || '',
                    error.body || error.message
                );
            }
        })
    );

    return delivered;
}


module.exports = {
    startPush,
    isConfigured,
    saveSubscription,
    removeSubscription,
    getStatus,
    sendToUser
};