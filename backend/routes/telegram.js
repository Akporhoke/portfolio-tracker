/*
 * Telegram routes.
 *
 * Put this file in:  backend/routes/telegram.js
 *
 * Mounted in server.js behind the same guard as the alert routes, so
 * :userId is always the logged-in user's own id.
 *
 *   GET    /api/portfolio/:userId/telegram          status
 *   POST   /api/portfolio/:userId/telegram/link     new one-time link
 *   POST   /api/portfolio/:userId/telegram/test     send a test message
 *   DELETE /api/portfolio/:userId/telegram          disconnect
 *   POST   /api/portfolio/:userId/telegram/unlink   disconnect (same)
 */

const express = require('express');

const router = express.Router();

const telegram =
    require('../services/telegramService');


function fail(res, status, code, message) {
    return res.status(status).json({
        error: message,
        code
    });
}


router.get('/:userId/telegram', async (req, res) => {
    try {
        res.json(
            await telegram.getStatus(req.params.userId)
        );

    } catch (error) {
        console.error('[Telegram] status failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not load Telegram status');
    }
});


router.post('/:userId/telegram/link', async (req, res) => {
    try {
        if (!telegram.isConfigured()) {
            return fail(
                res,
                503,
                'TELEGRAM_OFF',
                'Telegram alerts are not set up on this server'
            );
        }

        const link =
            await telegram.createLinkCode(req.params.userId);

        if (!link.url) {
            return fail(
                res,
                503,
                'TELEGRAM_UNAVAILABLE',
                'Could not reach Telegram. Try again in a moment.'
            );
        }

        res.json(link);

    } catch (error) {
        console.error('[Telegram] link failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not create Telegram link');
    }
});


router.post('/:userId/telegram/test', async (req, res) => {
    try {
        const sent =
            await telegram.sendToUser(
                req.params.userId,
                'Gaze test: Telegram alerts are working.'
            );

        if (!sent) {
            return fail(
                res,
                400,
                'NOT_LINKED',
                'Telegram is not connected'
            );
        }

        res.json({ ok: true });

    } catch (error) {
        console.error('[Telegram] test failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not send test message');
    }
});


async function unlink(req, res) {
    try {
        await telegram.unlink(req.params.userId);

        res.json({ ok: true });

    } catch (error) {
        console.error('[Telegram] unlink failed:', error.message);

        fail(res, 500, 'SERVER_ERROR', 'Could not disconnect Telegram');
    }
}

router.delete('/:userId/telegram', unlink);
router.post('/:userId/telegram/unlink', unlink);


module.exports = router;