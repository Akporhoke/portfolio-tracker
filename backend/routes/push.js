/*
 * Push notification routes.
 *
 * Put this file in:  backend/routes/push.js
 *
 * Mounted in server.js behind the same guard as the alert routes, so
 * :userId is always the logged-in user's own id.
 *
 *   GET  /api/portfolio/:userId/push               status + public key
 *   POST /api/portfolio/:userId/push/subscribe     register this device
 *   POST /api/portfolio/:userId/push/unsubscribe   remove this device
 *   POST /api/portfolio/:userId/push/test          send a test push
 */

const express = require('express');

const router = express.Router();

const push =
    require('../services/pushService');


function fail(res, status, code, message) {
    return res.status(status).json({
        error: message,
        code
    });
}


router.get('/:userId/push', async (req, res) => {
    try {
        res.json(
            await push.getStatus(req.params.userId)
        );

    } catch (error) {
        console.error('[Push] status failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not load push status');
    }
});


router.post('/:userId/push/subscribe', async (req, res) => {
    try {
        if (!push.isConfigured()) {
            return fail(
                res,
                503,
                'PUSH_OFF',
                'Push notifications are not set up on this server'
            );
        }

        const saved =
            await push.saveSubscription(
                req.params.userId,
                (req.body || {}).subscription,
                req.get('user-agent')
            );

        if (!saved) {
            return fail(
                res,
                400,
                'BAD_SUBSCRIPTION',
                'That device registration was not accepted'
            );
        }

        res.json({ ok: true });

    } catch (error) {
        console.error('[Push] subscribe failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not save this device');
    }
});


router.post('/:userId/push/unsubscribe', async (req, res) => {
    try {
        await push.removeSubscription(
            req.params.userId,
            (req.body || {}).endpoint
        );

        res.json({ ok: true });

    } catch (error) {
        console.error('[Push] unsubscribe failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not remove this device');
    }
});


router.post('/:userId/push/test', async (req, res) => {
    try {
        const delivered =
            await push.sendToUser(
                req.params.userId,
                {
                    title: 'Gaze test',
                    body: 'Push notifications are working on this device.',
                    tag: 'gaze-test',
                    url: '/?alerts=1'
                }
            );

        res.json({ ok: true, delivered });

    } catch (error) {
        console.error('[Push] test failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not send the test');
    }
});


module.exports = router;